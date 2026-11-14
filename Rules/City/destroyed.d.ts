import { Engine } from '@civ-clone/core-engine/Engine';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import { WorkedTileRegistry } from '@civ-clone/core-city/WorkedTileRegistry';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
export declare const getRules: (
  tileImprovementRegistry?: TileImprovementRegistry,
  engine?: Engine,
  unitRegistry?: UnitRegistry,
  workedTileRegistry?: WorkedTileRegistry,
  specialistRegistry?: SpecialistRegistry,
  ruleRegistry?: RuleRegistry
) => Destroyed[];
export default getRules;
