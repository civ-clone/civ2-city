import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { Gold, Luxuries, Research } from '../../Yields';
import { Entertainer, Scientist, TaxCollector } from '../../Specialists';
import {
  GameDifficultyRegistry,
  instance as gameDifficultyRegistryInstance,
} from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  entertainerLuxuries,
  scientistResearch,
  taxCollectorGold,
} from '../../data/cityRules';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Priority from '@civ-clone/core-rule/Priority';
import Specialist from '@civ-clone/core-city/Specialist';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRule from '@civ-clone/core-city/Rules/Yield';

export const getRules: (
  cityImprovementRegistry?: CityImprovementRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  specialistRegistry?: SpecialistRegistry,
  gameDifficultyRegistry?: GameDifficultyRegistry,
  clientRegistry?: ClientRegistry
) => YieldRule[] = (
  cityImprovementRegistry: CityImprovementRegistry = cityImprovementRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  gameDifficultyRegistry: GameDifficultyRegistry = gameDifficultyRegistryInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance
): YieldRule[] => [
  new YieldRule(
    'civ2-city:city/yield/worked-tiles',
    new Priority(0), // X High
    // What each square gives this city goes through its `CityTileYield` rules (`Rules/City/tile-yield`, in the order
    //  of `lib/tileYieldPipeline`), fetched once for all its squares.
    new Effect((city: City) => {
      const rules = city.tileYieldRules();

      return city
        .tilesWorked()
        .entries()
        .flatMap((tile) =>
          city.tileYields(tile, rules).flatMap(
            (tileYield: Yield) =>
              new (tileYield.constructor as typeof Yield)(
                tileYield.value(),
                tile.id() +
                  ': ' +
                  tileYield
                    .values()
                    .map(([, provider]) => provider)
                    .join('-')
              )
          )
        );
    })
  ),

  // Each specialist's yield, before improvements (`data/cityRules`).
  ...(
    [
      [Entertainer, Luxuries, entertainerLuxuries],
      [TaxCollector, Gold, taxCollectorGold],
      [Scientist, Research, scientistResearch],
    ] as [typeof Specialist, typeof Yield, number][]
  ).map(
    ([SpecialistType, YieldType, value]) =>
      new YieldRule(
        `civ2-city:city/yield/specialist/${SpecialistType.name}`,
        new Criterion((city: City): boolean =>
          specialistRegistry
            .getByCity(city)
            .some((specialist) => specialist instanceof SpecialistType)
        ),
        new Effect(
          (city: City): Yield =>
            new YieldType(
              specialistRegistry
                .getByCity(city)
                .filter((specialist) => specialist instanceof SpecialistType)
                .length * value,
              SpecialistType.name
            )
        )
      )
  ),
];

export default getRules;
