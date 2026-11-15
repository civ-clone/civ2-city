import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { GameDifficultyRegistry } from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import { LateGameDependencies } from '@civ-clone/civ2-difficulty/lib/lateGame';
import Cost from '@civ-clone/core-city-growth/Rules/Cost';
export declare const getRules: (
  gameDifficultyRegistry?: GameDifficultyRegistry,
  clientRegistry?: ClientRegistry,
  lateGameDependencies?: LateGameDependencies
) => Cost[];
export default getRules;
