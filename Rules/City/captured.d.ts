import { AvailableSpecialistRegistry } from '@civ-clone/core-city/AvailableSpecialistRegistry';
import { CityBuildRegistry } from '@civ-clone/core-city-build/CityBuildRegistry';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { PlayerWorldRegistry } from '@civ-clone/core-player-world/PlayerWorldRegistry';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import { WorkedTileRegistry } from '@civ-clone/core-city/WorkedTileRegistry';
import Captured from '@civ-clone/core-city/Rules/Captured';
import { CaptureDependencies } from '../../lib/captureAftermath';
export declare const getRules: (
  unitRegistry?: UnitRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  cityBuildRegistry?: CityBuildRegistry,
  engine?: Engine,
  playerWorldRegistry?: PlayerWorldRegistry,
  workedTileRegistry?: WorkedTileRegistry,
  specialistRegistry?: SpecialistRegistry,
  availableSpecialistRegistry?: AvailableSpecialistRegistry,
  capture?: CaptureDependencies
) => Captured[];
export default getRules;
