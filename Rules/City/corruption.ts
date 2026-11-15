import CapitalLink, { CapitalLinkDependencies } from '../../lib/capitalLink';
import {
  CityBuildRegistry,
  instance as cityBuildRegistryInstance,
} from '@civ-clone/core-city-build/CityBuildRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import { Corruption, Production, Trade, Waste } from '../../Yields';
import {
  GameDifficultyRegistry,
  instance as gameDifficultyRegistryInstance,
} from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { shieldWaste, tradeCorruption } from '../../lib/corruption';
import City from '@civ-clone/core-city/City';
import Cost from '@civ-clone/core-city/Rules/Cost';
import Captured from '@civ-clone/core-city/Rules/Captured';
import CityImprovementCreated from '@civ-clone/core-city-improvement/Rules/Created';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import Courthouse from '@civ-clone/base-city-improvement-courthouse/Courthouse';
import Effect from '@civ-clone/core-rule/Effect';
import { High } from '@civ-clone/core-rule/Priorities';
import Low from '@civ-clone/core-rule/Priorities/Low';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import TerrainChanged from '@civ-clone/core-world/Rules/TerrainChanged';
import UnitSupportProduction from '@civ-clone/base-city-yield-unit-support-production/UnitSupportProduction';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import celebrating from '../../lib/celebrating';
import governmentOf from '../../lib/government';
import isBarbarian from '@civ-clone/base-civilization-barbarian/isBarbarian';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';
import { levelOf } from '@civ-clone/civ2-difficulty/level';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';

export interface CorruptionDependencies extends CapitalLinkDependencies {
  cityBuildRegistry?: CityBuildRegistry;
  clientRegistry?: ClientRegistry;
  gameDifficultyRegistry?: GameDifficultyRegistry;
  pendingEffectRegistry?: PendingEffectRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  /** The link to share; one is made from the dependencies otherwise. */
  capitalLink?: CapitalLink;
}

/** Whether the city is building the Palace (`cities[city].building == -IMP_PALACE`). */
const buildingPalace = (
  city: City,
  cityBuildRegistry: CityBuildRegistry
): boolean => {
  try {
    const Item = cityBuildRegistry.getByCity(city).building()?.item();

    return (
      Item !== undefined &&
      (Item === Palace || (Item as any).prototype instanceof Palace)
    );
  } catch (e) {
    return false;
  }
};

/**
 * Civilization II's corruption and waste (`lib/corruption`), measured from the nearest Palace and, for waste, along
 *  the road to it (`lib/capitalLink`).
 */
export const getRules = (
  dependencies: CorruptionDependencies = {}
): (
  | YieldRule
  | Cost
  | TerrainChanged
  | CityImprovementCreated
  | Captured
  | Destroyed
)[] => {
  const {
      cityBuildRegistry = cityBuildRegistryInstance,
      clientRegistry = clientRegistryInstance,
      gameDifficultyRegistry = gameDifficultyRegistryInstance,
      pendingEffectRegistry = pendingEffectRegistryInstance,
      playerGovernmentRegistry = playerGovernmentRegistryInstance,
      capitalLink = new CapitalLink(dependencies),
    } = dependencies,
    // `City#yields` hands its rules and costs the same array, so the nearest Palace is looked up once a call.
    capitals = new WeakMap<Yield[], ReturnType<CapitalLink['capital']>>(),
    capitalOf = (city: City, yields: Yield[]) => {
      if (!capitals.has(yields)) {
        capitals.set(yields, capitalLink.capital(city));
      }

      return capitals.get(yields)!;
    },
    common = (city: City) => ({
      government: governmentOf(city.player(), playerGovernmentRegistry),
      human: isHuman(city.player(), clientRegistry),
      level: levelOf(gameDifficultyRegistry),
      capital: capitalLink.has(city, Palace),
      celebrating: celebrating(city, pendingEffectRegistry),
    });

  return [
    // `city_calc_trade_happiness`: corruption takes from the city's trade. Civ2 asks after its trade routes are added
    //  too; the Courthouse's halving is civ2-city-improvement's.
    new YieldRule(
      'civ2-city:city/yield/corruption',
      new High(),
      new Effect((city: City, yields: Yield[]): Yield => {
        const { distance, nearest } = capitalOf(city, yields),
          input = common(city);

        return new Corruption(
          tradeCorruption({
            ...input,
            amount: reduceYield(yields, Trade),
            distance,
          }),
          nearest === null && !input.capital ? 'no-capital' : String(distance)
        );
      })
    ),

    // `city_calc_shields_pollution`: waste takes from the city's shields, after the Factory's and the plants' bonuses
    //  (`YieldModifier`s) and its units' support (the other `Cost`s), so it comes last.
    new Cost(
      'civ2-city:city/cost/waste',
      new Low(),
      new Effect((city: City, yields: Yield[]): Yield[] => {
        const total = (include: (cityYield: Yield) => boolean): number =>
            yields
              .filter(include)
              .reduce(
                (sum: number, cityYield: Yield): number =>
                  sum + cityYield.value(),
                0
              ),
          shields = total(
            (cityYield: Yield): boolean =>
              cityYield instanceof Production &&
              !(cityYield instanceof UnitSupportProduction) &&
              !(cityYield instanceof Waste)
          ),
          // Support is a negative yield.
          support = -total(
            (cityYield: Yield): boolean =>
              cityYield instanceof UnitSupportProduction
          ),
          { distance, nearest, link } = capitalLink.of(
            city,
            capitalOf(city, yields)
          ),
          waste = shieldWaste({
            ...common(city),
            courthouse: capitalLink.has(city, Courthouse),
            distance,
            shields,
            support,
            link,
            barbarian: isBarbarian(city.player()),
            buildingPalaceWithNoCapital:
              nearest === null && buildingPalace(city, cityBuildRegistry),
          });

        return waste > 0 ? [new Waste(waste, `link-${link}`)] : [];
      })
    ),

    // The capital link's cost grids follow the land.
    new TerrainChanged(
      'civ2-city:capital-link/terrain-changed',
      new Effect((): void => capitalLink.invalidate())
    ),

    // A Palace built, or a city with one captured or destroyed, changes the turn's capitals and links.
    new CityImprovementCreated(
      'civ2-city:capital-link/city-improvement-created',
      new Effect((): void => capitalLink.invalidateCapitals())
    ),
    new Captured(
      'civ2-city:capital-link/captured',
      new Effect((): void => capitalLink.invalidateCapitals())
    ),
    new Destroyed(
      'civ2-city:capital-link/destroyed',
      new Effect((): void => capitalLink.invalidateCapitals())
    ),
  ];
};

export default getRules;
