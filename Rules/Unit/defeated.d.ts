import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { GameDifficultyRegistry } from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
export declare const getRules: (
  cityRegistry?: CityRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  engine?: Engine,
  gameDifficultyRegistry?: GameDifficultyRegistry,
  clientRegistry?: ClientRegistry
) => Defeated[];
export default getRules;
