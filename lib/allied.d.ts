import InteractionRegistry from '@civ-clone/core-diplomacy/InteractionRegistry';
import Player from '@civ-clone/core-player/Player';
/**
 * Whether `player` has an alliance with `other` in `interactionRegistry` (`TREATY_ALLIANCE`), by base-diplomacy's
 *  treaty level: an alliance in force, not a peace or a ceasefire.
 */
export declare const allied: (
  interactionRegistry: InteractionRegistry
) => (player: Player, other: Player) => boolean;
export default allied;
