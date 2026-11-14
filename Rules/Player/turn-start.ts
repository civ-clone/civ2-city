import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  WorkedTileRegistry,
  instance as workedTileRegistryInstance,
} from '@civ-clone/core-city/WorkedTileRegistry';
import Effect from '@civ-clone/core-rule/Effect';
import Player from '@civ-clone/core-player/Player';
import Priority from '@civ-clone/core-rule/Priority';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import { releaseOccupiedWorkedTiles } from '@civ-clone/base-city-lifecycle/lib/occupiedTiles';

export const getRules = (
  cityRegistry: CityRegistry = cityRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance,
  workedTileRegistry: WorkedTileRegistry = workedTileRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): TurnStart[] => [
  new TurnStart(
    'civ2-city:player/turn-start/release-occupied-worked-tiles',
    // Before the cities' yields are processed (`civ2-player:player/turn-start/process-city-yields` is `High`).
    new Priority(0), // X High
    new Effect((player: Player): void =>
      releaseOccupiedWorkedTiles(
        player,
        cityRegistry,
        unitRegistry,
        workedTileRegistry,
        ruleRegistry
      )
    )
  ),
];

export default getRules;
