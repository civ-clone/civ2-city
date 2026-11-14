import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  WorkedTileRegistry,
  instance as workedTileRegistryInstance,
} from '@civ-clone/core-city/WorkedTileRegistry';
import {
  citizenCount,
  releaseCitizens,
} from '@civ-clone/base-city-lifecycle/lib/assignWorkers';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Shrink from '@civ-clone/core-city-growth/Rules/Shrink';

export const getRules: (
  workedTileRegistry?: WorkedTileRegistry,
  specialistRegistry?: SpecialistRegistry,
  engine?: Engine
) => Shrink[] = (
  workedTileRegistry: WorkedTileRegistry = workedTileRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  engine: Engine = engineInstance
): Shrink[] => [
  new Shrink(
    'civ2-city:city/shrink/set-growth-cost',
    new Criterion((cityGrowth: CityGrowth): boolean => cityGrowth.size() > 0),
    new Effect((cityGrowth: CityGrowth): void => cityGrowth.setCost())
  ),
  new Shrink(
    'civ2-city:city/shrink/reduce-workers',
    new Criterion((cityGrowth: CityGrowth): boolean => cityGrowth.size() > 0),
    new Criterion(
      (cityGrowth: CityGrowth): boolean =>
        citizenCount(
          cityGrowth.city(),
          workedTileRegistry,
          specialistRegistry
        ) >
        cityGrowth.size() + 1
    ),
    new Effect((cityGrowth: CityGrowth): void =>
      releaseCitizens(
        cityGrowth.city(),
        cityGrowth,
        workedTileRegistry,
        specialistRegistry
      )
    )
  ),
  // With what caused it. A city shrunk to nothing is destroyed instead, which emits `city:destroyed`.
  new Shrink(
    'civ2-city:city/shrink/emit',
    new Criterion((cityGrowth: CityGrowth): boolean => cityGrowth.size() > 0),
    new Effect((cityGrowth: CityGrowth, cause: unknown): void => {
      engine.emit('city:shrink', cityGrowth.city(), cause);
    })
  ),
  new Shrink(
    'civ2-city:city/shrink/destroy-empty-city',
    new Criterion((cityGrowth: CityGrowth): boolean => cityGrowth.size() <= 0),
    new Effect((cityGrowth: CityGrowth): void => cityGrowth.city().destroy())
  ),
];

export default getRules;
