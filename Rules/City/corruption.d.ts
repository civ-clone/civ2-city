import CapitalLink, { CapitalLinkDependencies } from '../../lib/capitalLink';
import { CityBuildRegistry } from '@civ-clone/core-city-build/CityBuildRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { GameDifficultyRegistry } from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import Cost from '@civ-clone/core-city/Rules/Cost';
import TerrainChanged from '@civ-clone/core-world/Rules/TerrainChanged';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
export interface CorruptionDependencies extends CapitalLinkDependencies {
  cityBuildRegistry?: CityBuildRegistry;
  clientRegistry?: ClientRegistry;
  gameDifficultyRegistry?: GameDifficultyRegistry;
  pendingEffectRegistry?: PendingEffectRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  /** The link to share; one is made from the dependencies otherwise. */
  capitalLink?: CapitalLink;
}
/**
 * Civilization II's corruption and waste (`lib/corruption`), measured from the nearest Palace and, for waste, along
 *  the road to it (`lib/capitalLink`).
 */
export declare const getRules: (
  dependencies?: CorruptionDependencies
) => (YieldRule | Cost | TerrainChanged)[];
export default getRules;
