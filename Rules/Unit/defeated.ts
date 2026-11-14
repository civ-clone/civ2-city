import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  GameDifficultyRegistry,
  instance as gameDifficultyRegistryInstance,
} from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import Action from '@civ-clone/core-unit/Action';
import Attack from '@civ-clone/base-unit-action-attack/Attack';
import Criterion from '@civ-clone/core-rule/Criterion';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Effect from '@civ-clone/core-rule/Effect';
import Unit from '@civ-clone/core-unit/Unit';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';
import { levelOf } from '@civ-clone/civ2-difficulty/level';

export const getRules: (
  cityRegistry?: CityRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  engine?: Engine,
  gameDifficultyRegistry?: GameDifficultyRegistry,
  clientRegistry?: ClientRegistry
) => Defeated[] = (
  cityRegistry: CityRegistry = cityRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  engine: Engine = engineInstance,
  gameDifficultyRegistry: GameDifficultyRegistry = gameDifficultyRegistryInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance
): Defeated[] => [
  // A city whose defender loses an attack loses a citizen, except a person's city on Chieftain (OpenCiv2
  //  `src/auto/unit_combat.cpp` `unit_resolve_attack_remove_loser`, richardpenman/civ2@49f26ec). City Walls and the
  //  Great Wall, which also spare it there, are civ2-city-improvement's and civ2-wonder's, and not yet asked.
  new Defeated(
    'civ2-city:unit/defeated/shrink-defended-city',
    new Criterion(
      (defeated: Unit, by: Unit, action: Action): boolean =>
        action instanceof Attack &&
        action.to() === defeated.tile() &&
        cityRegistry.getByTile(action.to()) !== null
    ),
    new Criterion(
      (defeated: Unit): boolean =>
        levelOf(gameDifficultyRegistry) !== 0 ||
        !isHuman(defeated.player(), clientRegistry)
    ),
    new Effect((defeated: Unit, by: Unit, action: Action): void =>
      cityGrowthRegistry
        .getByCity(cityRegistry.getByTile(defeated.tile())!)
        .shrink(action)
    )
  ),
  new Defeated(
    'civ2-city:unit/defeated/emit',
    new Effect((defeated: Unit, by: Unit, action: Action): void => {
      engine.emit('unit:defeated', defeated, by, action);
    })
  ),
];

export default getRules;
