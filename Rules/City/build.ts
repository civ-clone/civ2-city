import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  GameDifficultyRegistry,
  instance as gameDifficultyRegistryInstance,
} from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import { IBuildable as Buildable } from '@civ-clone/core-city-build/Buildable';
import BuildCategory from '@civ-clone/core-city-build/Rules/BuildCategory';
import BuildOverflow from '@civ-clone/core-city-build/Rules/BuildOverflow';
import Capitalization from '@civ-clone/base-city-improvement-capitalization/Capitalization';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import ProductionChanged from '@civ-clone/core-city-build/Rules/ProductionChanged';
import Unit from '@civ-clone/core-unit/Unit';
import Wonder from '@civ-clone/core-wonder/Wonder';
import buildCategory from '@civ-clone/core-city-build/lib/buildCategory';
import cosmic from '@civ-clone/civ2-rules/data/cosmic';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';
import { levelOf } from '@civ-clone/civ2-difficulty/level';

/** `city_production_category`'s three categories. */
export const UNIT = 'unit';
export const IMPROVEMENT = 'improvement';
export const WONDER = 'wonder';

const isA = (item: Buildable, Type: abstract new (...args: any[]) => any) =>
  (item as unknown) === Type || (item as any).prototype instanceof Type;

/**
 * Which of Civ2's three categories an item is in (OpenCiv2 `src/auto/city.cpp` `city_production_category` ~2335,
 *  richardpenman/civ2@49f26ec): a unit; an improvement numbered up to 34 (Solar Plant); or anything numbered above it,
 *  which is the spaceship parts (35–37), Capitalization (38) and the Wonders (39 on). So Capitalization is in the
 *  Wonders' category, not the improvements'.
 */
export const categoryOf = (item: Buildable): string | null => {
  if (isA(item, Unit)) {
    return UNIT;
  }

  if (isA(item, Wonder) || isA(item, Capitalization)) {
    return WONDER;
  }

  if (isA(item, CityImprovement)) {
    return IMPROVEMENT;
  }

  return null;
};

/**
 * What a change of production keeps (`city_shields_after_change` ~2364): on a change to another category, the box
 *  loses @COSMIC's change penalty per cent, rounded down (`box - penalty × box / 100`), except on Chieftain. Asked from
 *  the box and the item the turn started with (`city_save_build_state`), so changing back restores it.
 */
export const shieldsAfterChange = (
  progress: number,
  penalty: number = cosmic.changePenalty
): number => progress - Math.trunc((penalty * (progress & 0xffff)) / 100);

export const getRules: (
  clientRegistry?: ClientRegistry,
  gameDifficultyRegistry?: GameDifficultyRegistry,
  ruleRegistry?: RuleRegistry
) => (BuildCategory | BuildOverflow | ProductionChanged)[] = (
  clientRegistry: ClientRegistry = clientRegistryInstance,
  gameDifficultyRegistry: GameDifficultyRegistry = gameDifficultyRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): (BuildCategory | BuildOverflow | ProductionChanged)[] => [
  new BuildCategory(
    'civ2-city:city/build-category',
    new Criterion((item: Buildable): boolean => categoryOf(item) !== null),
    new Effect((item: Buildable): string => categoryOf(item)!)
  ),

  // `city_process_production` (city_production.cpp ~3003): a computer player's completed unit or improvement takes its
  //  cost from the box, keeping what's over (~2460, ~2730); a person's box is emptied after the announcement (~2410,
  //  ~2838), and so is anyone's after a Wonder or a spaceship part, which are announced to all.
  new BuildOverflow(
    'civ2-city:city/build-overflow/computer-players',
    new Criterion(
      (cityBuild: CityBuild): boolean =>
        !isHuman(cityBuild.city().player(), clientRegistry)
    ),
    new Criterion(
      (cityBuild: CityBuild, item: Buildable): boolean =>
        categoryOf(item) !== WONDER
    ),
    new Effect(
      (
        cityBuild: CityBuild,
        item: Buildable,
        progress: number,
        cost: number
      ): number => Math.max(progress - cost, 0)
    )
  ),

  // `city_set_production` (city.cpp ~1488) only asks `city_shields_after_change` for a person's change outside the turn's
  //  processing; a computer player's changes cost nothing.
  new ProductionChanged(
    'civ2-city:city/production-changed/change-penalty',
    new Criterion((cityBuild: CityBuild): boolean =>
      isHuman(cityBuild.city().player(), clientRegistry)
    ),
    new Criterion((): boolean => levelOf(gameDifficultyRegistry) !== 0),
    new Criterion(
      (cityBuild: CityBuild, from: Buildable | null, to: Buildable): boolean =>
        from !== null &&
        buildCategory(from, ruleRegistry) !== buildCategory(to, ruleRegistry)
    ),
    new Effect(
      (
        cityBuild: CityBuild,
        from: Buildable | null,
        to: Buildable,
        progress: number
      ): number => shieldsAfterChange(progress)
    )
  ),
];

export default getRules;
