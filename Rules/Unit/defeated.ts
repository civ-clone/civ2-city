import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import Action from '@civ-clone/core-unit/Action';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Effect from '@civ-clone/core-rule/Effect';
import Unit from '@civ-clone/core-unit/Unit';

// A city losing a citizen when one of its defenders loses (OpenCiv2 `unit_resolve_attack_remove_loser`) is civ2-unit's
//  `civ2-unit:unit/defeated/city-shrinks`, which also asks for City Walls and the Great Wall. It isn't repeated here,
//  or a city would lose two.
export const getRules: (engine?: Engine) => Defeated[] = (
  engine: Engine = engineInstance
): Defeated[] => [
  new Defeated(
    'civ2-city:unit/defeated/emit',
    new Effect((defeated: Unit, by: Unit, action: Action): void => {
      engine.emit('unit:defeated', defeated, by, action);
    })
  ),
];

export default getRules;
