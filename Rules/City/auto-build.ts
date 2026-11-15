import {
  CityBuildRegistry,
  instance as cityBuildRegistryInstance,
} from '@civ-clone/core-city-build/CityBuildRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  autoModeOf,
  forgetAutoMode,
  includeFor,
  setAutoMode,
} from '../../lib/autoMode';
import BuildingCancelled from '@civ-clone/core-city-build/Rules/BulidingCancelled';
import BuildingComplete from '@civ-clone/core-city-build/Rules/BulidingComplete';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import Effect from '@civ-clone/core-rule/Effect';
import Player from '@civ-clone/core-player/Player';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Unit from '@civ-clone/core-unit/Unit';
import autoBuild from '@civ-clone/base-city-auto-build/lib/autoBuild';

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
   *  the code plays.
   */
  clearWhenNothingChosen?: boolean;
}

/**
 * When a city on Auto chooses (base-city-auto-build's `lib/autoBuild`, from what its mode allows, `lib/autoMode`): when
 *  its build is finished or can no longer be built, and at the start of its player's turn while it builds nothing.
 *  With nothing it would choose, a city that has just finished a unit builds another of it, as Civ2's does (its
 *  `building` is left as it was), unless `clearWhenNothingChosen` takes it off Auto.
 */
export const getRules = (
  {
    cityBuildRegistry = cityBuildRegistryInstance,
    cityRegistry = cityRegistryInstance,
    pendingEffectRegistry = pendingEffectRegistryInstance,
    ruleRegistry = ruleRegistryInstance,
  }: AutoBuildDependencies = {},
  { clearWhenNothingChosen = false }: AutoBuildOptions = {}
): (
  | BuildingComplete
  | BuildingCancelled
  | TurnStart
  | Captured
  | Destroyed
)[] => {
  const choose = (cityBuild: CityBuild): boolean =>
      autoBuild(
        cityBuild,
        ruleRegistry,
        includeFor(autoModeOf(cityBuild, pendingEffectRegistry))
      ),
    nothingChosen = (cityBuild: CityBuild): boolean =>
      cityBuild.auto() && cityBuild.building() === null,
    clear = (cityBuild: CityBuild): void => {
      if (clearWhenNothingChosen && nothingChosen(cityBuild)) {
        setAutoMode(cityBuild, null, ruleRegistry, pendingEffectRegistry);
      }
    };

  return [
    new BuildingComplete(
      'civ2-city:city/building-complete/auto',
      new Effect((cityBuild: CityBuild): void => {
        if (choose(cityBuild) || !nothingChosen(cityBuild)) {
          return;
        }

        if (clearWhenNothingChosen) {
          clear(cityBuild);

          return;
        }

        const completed = cityBuild.cleared()?.item ?? null;

        if (
          completed !== null &&
          Object.prototype.isPrototypeOf.call(Unit, completed) &&
          cityBuild.getAvailable(completed)
        ) {
          cityBuild.build(completed);
        }
      })
    ),

    new BuildingCancelled(
      'civ2-city:city/building-cancelled/auto',
      new Effect((cityBuild: CityBuild): void => {
        if (!choose(cityBuild)) {
          clear(cityBuild);
        }
      })
    ),

    new TurnStart(
      'civ2-city:player/turn-start/auto-build',
      new Effect((player: Player): void =>
        cityRegistry.getByPlayer(player).forEach((city: City): void => {
          const cityBuild = cityBuildRegistry.getByCity(city);

          if (nothingChosen(cityBuild) && !choose(cityBuild)) {
            clear(cityBuild);
          }
        })
      )
    ),

    // A captured city is taken off Auto (`civ2-city:city/captured/stop-auto`), and its mode goes with it.
    new Captured(
      'civ2-city:city/captured/auto-mode',
      new Effect((city: City): void =>
        forgetAutoMode(city, pendingEffectRegistry)
      )
    ),

    new Destroyed(
      'civ2-city:city/destroyed/auto-mode',
      new Effect((city: City): void =>
        forgetAutoMode(city, pendingEffectRegistry)
      )
    ),
  ];
};

export default getRules;
