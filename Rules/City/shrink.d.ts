import { Engine } from '@civ-clone/core-engine/Engine';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import { WorkedTileRegistry } from '@civ-clone/core-city/WorkedTileRegistry';
import Shrink from '@civ-clone/core-city-growth/Rules/Shrink';
export declare const getRules: (
  workedTileRegistry?: WorkedTileRegistry,
  specialistRegistry?: SpecialistRegistry,
  engine?: Engine
) => Shrink[];
export default getRules;
