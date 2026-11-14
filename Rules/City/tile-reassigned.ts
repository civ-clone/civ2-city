import {
  AvailableSpecialistRegistry,
  instance as availableSpecialistRegistryInstance,
} from '@civ-clone/core-city/AvailableSpecialistRegistry';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
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
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import TileReassigned from '@civ-clone/core-city/Rules/TileReassigned';
import assignWorkers from '@civ-clone/base-city-lifecycle/lib/assignWorkers';

export const getRules = (
  playerWorldRegistry: PlayerWorldRegistry = playerWorldRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  workedTileRegistry: WorkedTileRegistry = workedTileRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  availableSpecialistRegistry: AvailableSpecialistRegistry = availableSpecialistRegistryInstance
): TileReassigned[] => [
  new TileReassigned(
    'civ2-city:city/tile-reassigned/assign-workers',
    // A destroyed city can still hold a tile (a new city founded on its site takes its centre back and processes this),
    //  but must not be given another.
    new Criterion((city: City): boolean => !city.destroyed()),
    new Effect((city: City): void =>
      assignWorkers(
        city,
        playerWorldRegistry,
        cityGrowthRegistry,
        workedTileRegistry,
        specialistRegistry,
        availableSpecialistRegistry
      )
    )
  ),
];

export default getRules;
