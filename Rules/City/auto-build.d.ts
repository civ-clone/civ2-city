import { CityBuildRegistry } from '@civ-clone/core-city-build/CityBuildRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import BuildingCancelled from '@civ-clone/core-city-build/Rules/BulidingCancelled';
import BuildingComplete from '@civ-clone/core-city-build/Rules/BulidingComplete';
import Captured from '@civ-clone/core-city/Rules/Captured';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
export interface AutoBuildDependencies {
  cityBuildRegistry?: CityBuildRegistry;
  cityRegistry?: CityRegistry;
  pendingEffectRegistry?: PendingEffectRegistry;
  ruleRegistry?: RuleRegistry;
}
export interface AutoBuildOptions {
  /**
   * Take a city off Auto when it finds nothing it would choose (every score over 500). Civ2 means to
   *  (`city_process_production`, `src/auto/city_production.cpp` ~3142: `city_set_production(city, 99)` then, if the
   *  build reads 99, it clears `CITYF_AUTOBUILD` and both mode flags), but `city_set_production` (`src/auto/city.cpp`
   *  ~1488) only stores a choice below 99, so the build never reads 99 and the city stays on Auto: off by default, as
   *  the code plays. The other places a finished build chooses again (`city_process_production_announce` ~2412 for an
   *  improvement, `city_process_production_unit` ~2839 for a unit) don't clear it either, and leave the finished item
   *  as the build when nothing is chosen.
   */
  clearWhenNothingChosen?: boolean;
}
/**
 * When a city on Auto chooses (base-city-auto-build's `lib/autoBuild`, from what its mode allows, `lib/autoMode`): when
 *  its build is finished or can no longer be built, and at the start of its player's turn while it builds nothing.
 *  With nothing it would choose, a city that has just finished a unit builds another of it, as Civ2's does (its
 *  `building` is left as it was), unless `clearWhenNothingChosen` takes it off Auto.
 */
export declare const getRules: (
  {
    cityBuildRegistry,
    cityRegistry,
    pendingEffectRegistry,
    ruleRegistry,
  }?: AutoBuildDependencies,
  { clearWhenNothingChosen }?: AutoBuildOptions
) => (
  | BuildingComplete
  | BuildingCancelled
  | TurnStart
  | Captured
  | Destroyed
)[];
export default getRules;
