import { DESPOTISM } from '@civ-clone/civ2-rules/data/governments';
import Player from '@civ-clone/core-player/Player';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { governments } from '../Governments';

/**
 * The index, in Civilization II's order (`Governments`), of `player`'s government: Despotism for a player with none,
 * or with a government Civ2 doesn't have, as a city of a player who hasn't started is.
 */
export const governmentOf = (
  player: Player,
  playerGovernmentRegistry: PlayerGovernmentRegistry
): number => {
  try {
    const playerGovernment = playerGovernmentRegistry.getByPlayer(player),
      index = governments.findIndex((GovernmentType) =>
        playerGovernment.is(GovernmentType)
      );

    return index === -1 ? DESPOTISM : index;
  } catch (e) {
    return DESPOTISM;
  }
};

export default governmentOf;
