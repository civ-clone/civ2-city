import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  GameDifficultyRegistry,
  instance as gameDifficultyRegistryInstance,
} from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import lateGame, {
  LateGameDependencies,
} from '@civ-clone/civ2-difficulty/lib/lateGame';
import { foodBoxRows, levelOf } from '@civ-clone/civ2-difficulty/level';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import Cost from '@civ-clone/core-city-growth/Rules/Cost';
import Effect from '@civ-clone/core-rule/Effect';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';

// A city grows once its food box holds (size + 1) × its rows: @COSMIC's 10 for the human, and the computer players'
//  by level, less the rows taken off them late in the game (civ2-difficulty `foodBoxRows` and `lateGame`; OpenCiv2
//  `src/auto/city.cpp` `city_process_food` and `city_calc_food_box_rows`, richardpenman/civ2@49f26ec).
export const getRules: (
  gameDifficultyRegistry?: GameDifficultyRegistry,
  clientRegistry?: ClientRegistry,
  lateGameDependencies?: LateGameDependencies
) => Cost[] = (
  gameDifficultyRegistry: GameDifficultyRegistry = gameDifficultyRegistryInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance,
  lateGameDependencies: LateGameDependencies = {}
): Cost[] => {
  const late = lateGame({
    ...lateGameDependencies,
    clientRegistry,
    gameDifficultyRegistry,
  });

  return [
    new Cost(
      'civ2-city:city/growth-cost/food-box',
      new Effect((cityGrowth: CityGrowth): number => {
        const human = isHuman(cityGrowth.city().player(), clientRegistry);

        return (
          foodBoxRows(
            levelOf(gameDifficultyRegistry),
            human,
            human ? undefined : late()
          ) *
          (cityGrowth.size() + 1)
        );
      })
    ),
  ];
};

export default getRules;
