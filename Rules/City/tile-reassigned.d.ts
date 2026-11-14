import { AvailableSpecialistRegistry } from '@civ-clone/core-city/AvailableSpecialistRegistry';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { PlayerWorldRegistry } from '@civ-clone/core-player-world/PlayerWorldRegistry';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import { WorkedTileRegistry } from '@civ-clone/core-city/WorkedTileRegistry';
import TileReassigned from '@civ-clone/core-city/Rules/TileReassigned';
export declare const getRules: (
  playerWorldRegistry?: PlayerWorldRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  workedTileRegistry?: WorkedTileRegistry,
  specialistRegistry?: SpecialistRegistry,
  availableSpecialistRegistry?: AvailableSpecialistRegistry
) => TileReassigned[];
export default getRules;
