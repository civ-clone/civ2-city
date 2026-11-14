import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  GameDifficultyRegistry,
  instance as gameDifficultyRegistryInstance,
} from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import { foodBoxRows, levelOf } from '@civ-clone/civ2-difficulty/level';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import Cost from '@civ-clone/core-city-growth/Rules/Cost';
import Effect from '@civ-clone/core-rule/Effect';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';

// A city grows once its food box holds (size + 1) × its rows: @COSMIC's 10 for the human, and the computer players'
//  by level (civ2-difficulty `foodBoxRows`; OpenCiv2 `src/auto/city.cpp` `city_process_food`,
//  richardpenman/civ2@49f26ec).
export const getRules: (
  gameDifficultyRegistry?: GameDifficultyRegistry,
  clientRegistry?: ClientRegistry
) => Cost[] = (
  gameDifficultyRegistry: GameDifficultyRegistry = gameDifficultyRegistryInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance
): Cost[] => [
  new Cost(
    'civ2-city:city/growth-cost/food-box',
    new Effect(
      (cityGrowth: CityGrowth): number =>
        foodBoxRows(
          levelOf(gameDifficultyRegistry),
          isHuman(cityGrowth.city().player(), clientRegistry)
        ) *
        (cityGrowth.size() + 1)
    )
  ),
];

export default getRules;
