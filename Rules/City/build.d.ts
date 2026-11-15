import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { GameDifficultyRegistry } from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { IBuildable as Buildable } from '@civ-clone/core-city-build/Buildable';
import BuildCategory from '@civ-clone/core-city-build/Rules/BuildCategory';
import BuildOverflow from '@civ-clone/core-city-build/Rules/BuildOverflow';
import ProductionChanged from '@civ-clone/core-city-build/Rules/ProductionChanged';
/** `city_production_category`'s three categories. */
export declare const UNIT = 'unit';
export declare const IMPROVEMENT = 'improvement';
export declare const WONDER = 'wonder';
/**
 * Which of Civ2's three categories an item is in (OpenCiv2 `src/auto/city.cpp` `city_production_category` ~2335,
 *  richardpenman/civ2@49f26ec): a unit; an improvement numbered up to 34 (Solar Plant); or anything numbered above it,
 *  which is the spaceship parts (35–37), Capitalization (38) and the Wonders (39 on). So Capitalization is in the
 *  Wonders' category, not the improvements'.
 */
export declare const categoryOf: (item: Buildable) => string | null;
/**
 * What a change of production keeps (`city_shields_after_change` ~2364): on a change to another category, the box
 *  loses @COSMIC's change penalty per cent, rounded down (`box - penalty × box / 100`), except on Chieftain. Asked from
 *  the box and the item the turn started with (`city_save_build_state`), so changing back restores it.
 */
export declare const shieldsAfterChange: (
  progress: number,
  penalty?: number
) => number;
export declare const getRules: (
  clientRegistry?: ClientRegistry,
  gameDifficultyRegistry?: GameDifficultyRegistry,
  ruleRegistry?: RuleRegistry
) => (BuildCategory | BuildOverflow | ProductionChanged)[];
export default getRules;
