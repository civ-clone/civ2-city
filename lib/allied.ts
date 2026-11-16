import {
  TreatyLevel,
  hasTreatyLevel,
} from '@civ-clone/base-diplomacy/lib/treatyLevel';
import InteractionRegistry from '@civ-clone/core-diplomacy/InteractionRegistry';
import Player from '@civ-clone/core-player/Player';

/**
 * Whether `player` has an alliance with `other` in `interactionRegistry` (`TREATY_ALLIANCE`), by base-diplomacy's
 *  treaty level: an alliance in force, not a peace or a ceasefire.
 */
export const allied =
  (interactionRegistry: InteractionRegistry) =>
  (player: Player, other: Player): boolean =>
    hasTreatyLevel(
      { interactionRegistry },
      player,
      other,
      TreatyLevel.Alliance
    );

export default allied;
