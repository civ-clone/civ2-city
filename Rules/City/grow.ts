import {
  AvailableSpecialistRegistry,
  instance as availableSpecialistRegistryInstance,
} from '@civ-clone/core-city/AvailableSpecialistRegistry';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  PlayerWorldRegistry,
  instance as playerWorldRegistryInstance,
} from '@civ-clone/core-player-world/PlayerWorldRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  WorkedTileRegistry,
  instance as workedTileRegistryInstance,
} from '@civ-clone/core-city/WorkedTileRegistry';
import {
  assignWorker,
  citizenCount,
  releaseCitizens,
} from '@civ-clone/base-city-lifecycle/lib/assignWorkers';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Grow from '@civ-clone/core-city-growth/Rules/Grow';

export const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  playerWorldRegistry?: PlayerWorldRegistry,
  workedTileRegistry?: WorkedTileRegistry,
  specialistRegistry?: SpecialistRegistry,
  availableSpecialistRegistry?: AvailableSpecialistRegistry,
  engine?: Engine
) => Grow[] = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  playerWorldRegistry: PlayerWorldRegistry = playerWorldRegistryInstance,
  workedTileRegistry: WorkedTileRegistry = workedTileRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  availableSpecialistRegistry: AvailableSpecialistRegistry = availableSpecialistRegistryInstance,
  engine: Engine = engineInstance
): Grow[] => [
  // The box empties as the city grows (OpenCiv2 `city_process_food`); a Granary's or the Pyramids' half box is
  //  civ2-city-improvement's and civ2-wonder's.
  new Grow(
    'civ2-city:city/grow/empty-food-store',
    new Effect((cityGrowth: CityGrowth): void => cityGrowth.empty())
  ),
  // The box for the new size, from the `Cost` rules (`growth-cost`).
  new Grow(
    'civ2-city:city/grow/set-growth-cost',
    new Effect((cityGrowth: CityGrowth): void => cityGrowth.setCost())
  ),
  // The new citizen works the best square left, or is a specialist when there's none: Civ2 has no size from which
  //  citizens are born specialists, as Civ1 has.
  new Grow(
    'civ2-city:city/grow/assign-worker',
    new Criterion(
      (cityGrowth: CityGrowth): boolean =>
        citizenCount(
          cityGrowth.city(),
          workedTileRegistry,
          specialistRegistry
        ) <
        cityGrowth.size() + 1
    ),
    new Effect((cityGrowth: CityGrowth): void =>
      assignWorker(
        cityGrowth.city(),
        playerWorldRegistry,
        cityGrowthRegistry,
        workedTileRegistry,
        specialistRegistry,
        availableSpecialistRegistry
      )
    )
  ),
  new Grow(
    'civ2-city:city/grow/reduce-workers',
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
  // Last, so a listener sees the city with its new citizen already at work, and is told why it grew.
  new Grow(
    'civ2-city:city/grow/emit',
    new Effect((cityGrowth: CityGrowth, cause: unknown): void => {
      engine.emit('city:grow', cityGrowth.city(), cause);
    })
  ),
];

export default getRules;
