import {
  DESPOTISM_PENALTY,
  TRADE_BONUS,
} from '@civ-clone/civ2-world/lib/governmentTileYield';
import { Food, Production, Trade } from '../../Yields';
import { MONARCHY, REPUBLIC } from '@civ-clone/civ2-rules/data/governments';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  terrainIndex,
  terrainRow,
} from '@civ-clone/civ2-world/lib/terrainTable';
import City from '@civ-clone/core-city/City';
import CityTileYield from '@civ-clone/core-city/Rules/CityTileYield';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Mine from '@civ-clone/base-tile-improvement-mine/Mine';
import Pollution from '@civ-clone/base-tile-improvement-pollution/Pollution';
import Railroad from '@civ-clone/base-tile-improvement-railroad/Railroad';
import RailroadAdvance from '@civ-clone/base-science-advance-railroad/Railroad';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Yield from '@civ-clone/core-yield/Yield';
import celebrating from '../../lib/celebrating';
import governmentOf from '../../lib/government';
import { tileYieldPriority } from '../../lib/tileYieldPipeline';

/**
 * The providers of the yields civ2-world's square rules add after the road (`Rules/Tile/yield-modifier`): the railroad,
 *  the government's penalty and bonus, and pollution. A city takes them out and works them out again in its own place
 *  in the order, after its buildings' and Wonders' steps.
 */
export const laterSquareSteps: string[] = [
  Railroad.name,
  DESPOTISM_PENALTY,
  TRADE_BONUS,
  Pollution.name,
];

/** What `yields` add up to of `YieldType`. */
export const totalOf = (yields: Yield[], YieldType: typeof Yield): number =>
  yields.reduce(
    (total: number, tileYield: Yield): number =>
      tileYield instanceof YieldType ? total + tileYield.value() : total,
    0
  );

const has = (
  tile: Tile,
  Improvement: typeof TileImprovement,
  tileImprovementRegistry: TileImprovementRegistry
): boolean =>
  tileImprovementRegistry
    .getByTile(tile)
    .some(
      (improvement: TileImprovement): boolean =>
        improvement instanceof Improvement
    );

const knows = (
  city: City,
  AdvanceType: typeof RailroadAdvance,
  playerResearchRegistry: PlayerResearchRegistry
): boolean => {
  try {
    return playerResearchRegistry
      .getByPlayer(city.player())
      .completed(AdvanceType);
  } catch (e) {
    // A player with no research yet (one being set up) knows nothing.
    return false;
  }
};

const change = (
  yields: Yield[],
  YieldType: typeof Yield,
  value: number,
  provider: string
): void => {
  if (value !== 0) {
    yields.push(new YieldType(value, provider));
  }
};

/**
 * civ2-city's steps of what a square gives the city working it, each at its place in OpenCiv2 `src/auto/city.cpp`
 *  `city_tile_yield` (richardpenman/civ2@49f26ec, from line 2796; `lib/tileYieldPipeline` has the whole order and
 *  which package registers each step). civ2-world's square rules give a square's own yields, through its road and on
 *  to its railroad, government and pollution steps, for a square worked by no city. For a city, the first rule here
 *  takes those last steps out again, the city's buildings and Wonders add theirs (civ2-city-improvement, civ2-wonder),
 *  and the rules here then run the railroad, government and pollution steps on the result.
 */
export const getRules: (
  tileImprovementRegistry?: TileImprovementRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  playerResearchRegistry?: PlayerResearchRegistry,
  pendingEffectRegistry?: PendingEffectRegistry
) => CityTileYield[] = (
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance,
  pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
): CityTileYield[] => [
  // The square's own yields, up to its road (lines 2826–2888): without the railroad, government and pollution yields.
  new CityTileYield(
    'civ2-city:city/tile-yield/square',

    tileYieldPriority('square'),
    new Effect((city: City, tile: Tile, yields: Yield[]): void => {
      for (let index = yields.length - 1; index >= 0; index--) {
        const tileYield = yields[index],
          values = tileYield.values();

        if (
          !values.some(([, provider]) => laterSquareSteps.includes(provider))
        ) {
          continue;
        }

        const kept = values.filter(
          ([, provider]) => !laterSquareSteps.includes(provider)
        );

        if (kept.length === 0) {
          yields.splice(index, 1);

          continue;
        }

        const [[value, provider], ...rest] = kept;

        tileYield.set(value, provider);
        rest.forEach(([value, provider]) => tileYield.add(value, provider));
      }
    })
  ),

  // The city's own square counts as mined where its terrain has no irrigation bonus (lines 2863–2865: `TILE_CITY` and
  //  `irrigate_bonus == 0`), unless it has a mine already, which civ2-world's square rules count.
  new CityTileYield(
    'civ2-city:city/tile-yield/centre-mine',

    tileYieldPriority('centreMine'),
    new Criterion((city: City, tile: Tile): boolean => tile === city.tile()),
    new Criterion((city: City, tile: Tile): boolean => {
      const index = terrainIndex(tile.terrain());

      return (
        index >= 0 &&
        terrainRow(index)[5][1] === 0 &&
        terrainRow(index)[6][1] > 0
      );
    }),
    new Criterion(
      (city: City, tile: Tile): boolean =>
        !has(tile, Mine, tileImprovementRegistry)
    ),
    new Effect((city: City, tile: Tile, yields: Yield[]): void =>
      change(
        yields,
        Production,
        terrainRow(terrainIndex(tile.terrain()))[6][1],
        Mine.name
      )
    )
  ),

  // The city's own square gives at least 1 shield (lines 2873–2875: tile index 20 with no shields).
  new CityTileYield(
    'civ2-city:city/tile-yield/centre-minimum',

    tileYieldPriority('centreMinimum'),
    new Criterion((city: City, tile: Tile): boolean => tile === city.tile()),
    new Criterion(
      (city: City, tile: Tile, yields: Yield[]): boolean =>
        totalOf(yields, Production) === 0
    ),
    new Effect((city: City, tile: Tile, yields: Yield[]): void =>
      change(yields, Production, 1, 'civ2-city:city-square')
    )
  ),

  // Half again of the shields, rounded down, on a railroad, or on the city's square once its player knows Railroad
  //  (lines 2897–2907).
  new CityTileYield(
    'civ2-city:city/tile-yield/railroad',

    tileYieldPriority('railroad'),
    new Criterion(
      (city: City, tile: Tile): boolean =>
        has(tile, Railroad, tileImprovementRegistry) ||
        (tile === city.tile() &&
          knows(city, RailroadAdvance, playerResearchRegistry))
    ),
    new Effect((city: City, tile: Tile, yields: Yield[]): void =>
      change(
        yields,
        Production,
        totalOf(yields, Production) >> 1,
        Railroad.name
      )
    )
  ),

  // Below Monarchy, a yield over 2 loses 1, unless the city celebrates (lines 2909–2917).
  ...([Food, Production, Trade] as (typeof Yield)[]).map(
    (YieldType: typeof Yield): CityTileYield =>
      new CityTileYield(
        `civ2-city:city/tile-yield/government-penalty/${YieldType.name}`,

        tileYieldPriority('governmentPenalty'),
        new Criterion(
          (city: City): boolean =>
            governmentOf(city.player(), playerGovernmentRegistry) < MONARCHY
        ),
        new Criterion(
          (city: City, tile: Tile, yields: Yield[]): boolean =>
            totalOf(yields, YieldType) > 2
        ),
        new Criterion(
          (city: City): boolean => !celebrating(city, pendingEffectRegistry)
        ),
        new Effect((city: City, tile: Tile, yields: Yield[]): void =>
          change(yields, YieldType, -1, DESPOTISM_PENALTY)
        )
      )
  ),

  // Any trade gains 1 under the Republic and Democracy, or from Monarchy up while the city celebrates (lines
  //  2918–2925).
  new CityTileYield(
    'civ2-city:city/tile-yield/trade-bonus',

    tileYieldPriority('tradeBonus'),
    new Criterion(
      (city: City, tile: Tile, yields: Yield[]): boolean =>
        totalOf(yields, Trade) !== 0
    ),
    new Criterion(
      (city: City): boolean =>
        governmentOf(city.player(), playerGovernmentRegistry) >=
        (celebrating(city, pendingEffectRegistry) ? MONARCHY : REPUBLIC)
    ),
    new Effect((city: City, tile: Tile, yields: Yield[]): void =>
      change(yields, Trade, 1, TRADE_BONUS)
    )
  ),

  // Pollution halves each yield, rounded up (lines 2930–2936).
  ...([Food, Production, Trade] as (typeof Yield)[]).map(
    (YieldType: typeof Yield): CityTileYield =>
      new CityTileYield(
        `civ2-city:city/tile-yield/pollution/${YieldType.name}`,

        tileYieldPriority('pollution'),
        new Criterion((city: City, tile: Tile): boolean =>
          has(tile, Pollution, tileImprovementRegistry)
        ),
        new Effect((city: City, tile: Tile, yields: Yield[]): void => {
          const total = totalOf(yields, YieldType);

          change(yields, YieldType, ((total + 1) >> 1) - total, Pollution.name);
        })
      )
  ),

  // Nothing below 0 (lines 2937–2939).
  ...([Food, Production, Trade] as (typeof Yield)[]).map(
    (YieldType: typeof Yield): CityTileYield =>
      new CityTileYield(
        `civ2-city:city/tile-yield/floor/${YieldType.name}`,

        tileYieldPriority('floor'),
        new Criterion(
          (city: City, tile: Tile, yields: Yield[]): boolean =>
            totalOf(yields, YieldType) < 0
        ),
        new Effect((city: City, tile: Tile, yields: Yield[]): void =>
          change(
            yields,
            YieldType,
            -totalOf(yields, YieldType),
            'civ2-city:floor'
          )
        )
      )
  ),
];

export default getRules;
