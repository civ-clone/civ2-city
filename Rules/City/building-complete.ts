import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import BuildingComplete from '@civ-clone/core-city-build/Rules/BulidingComplete';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Effect from '@civ-clone/core-rule/Effect';
import { emitBuildingComplete } from '@civ-clone/base-city-lifecycle/lib/events';

// Auto (a city choosing its own next build) is `Rules/City/auto-build`'s, registered after this.
export const getRules: (engine?: Engine) => BuildingComplete[] = (
  engine: Engine = engineInstance
): BuildingComplete[] => [
  new BuildingComplete(
    'civ2-city:city/building-complete/emit',
    new Effect((cityBuild: CityBuild, built: unknown): void => {
      emitBuildingComplete(cityBuild, built, engine);
    })
  ),
];

export default getRules;
