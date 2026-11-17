import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import CityBuild, {
  CityBuildClearedReason,
} from '@civ-clone/core-city-build/CityBuild';
import { IBuildable as Buildable } from '@civ-clone/core-city-build/Buildable';
import BuildingCancelled from '@civ-clone/core-city-build/Rules/BulidingCancelled';
import Effect from '@civ-clone/core-rule/Effect';
import { emitBuildingCancelled } from '@civ-clone/base-city-lifecycle/lib/events';

// Auto (a city choosing its own next build) is `Rules/City/auto-build`'s, registered after this.
export const getRules: (engine?: Engine) => BuildingCancelled[] = (
  engine: Engine = engineInstance
): BuildingCancelled[] => [
  // A city has stopped building something, however it was dropped: told with the item and why, so a client can show
  //  the build as it is now, even in the middle of its player's turn (civ-clone/web-renderer#978).
  new BuildingCancelled(
    'civ2-city:city/building-cancelled/emit',
    new Effect(
      (
        cityBuild: CityBuild,
        item: Buildable,
        reason: CityBuildClearedReason
      ): void => {
        emitBuildingCancelled(cityBuild, item, reason, engine);
      }
    )
  ),
];

export default getRules;
