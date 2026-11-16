import CapitalLink, { CapitalLinkDependencies } from '../../lib/capitalLink';
import InteractionRegistry from '@civ-clone/core-diplomacy/InteractionRegistry';
import { CityBuildRegistry } from '@civ-clone/core-city-build/CityBuildRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { GameDifficultyRegistry } from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import Cost from '@civ-clone/core-city/Rules/Cost';
import Built from '@civ-clone/core-tile-improvement/Rules/Built';
import Captured from '@civ-clone/core-city/Rules/Captured';
import CityCreated from '@civ-clone/core-city/Rules/Created';
import CityImprovementCreated from '@civ-clone/core-city-improvement/Rules/Created';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import TerrainChanged from '@civ-clone/core-world/Rules/TerrainChanged';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
export interface CorruptionDependencies extends CapitalLinkDependencies {
  cityBuildRegistry?: CityBuildRegistry;
  clientRegistry?: ClientRegistry;
  gameDifficultyRegistry?: GameDifficultyRegistry;
  pendingEffectRegistry?: PendingEffectRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  /**
   * The game's diplomacy: with it, and no `allied` of its own, a player's allies are those it has an alliance with
   *  (base-diplomacy's `TreatyLevel.Alliance`), whose cities and units don't block its capital link
   *  (`map_road_connection`).
   */
  interactionRegistry?: InteractionRegistry;
  /** The link to share; one is made from the dependencies otherwise. */
  capitalLink?: CapitalLink;
}
/**
 * Civilization II's corruption and waste (`lib/corruption`), measured from the nearest Palace and, for waste, along
 *  the road to it (`lib/capitalLink`).
 */
export declare const getRules: (
  dependencies?: CorruptionDependencies
) => (
  | YieldRule
  | Cost
  | TerrainChanged
  | CityImprovementCreated
  | Captured
  | Destroyed
  | CityCreated
  | Built
)[];
export default getRules;
