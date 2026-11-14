import Player from '@civ-clone/core-player/Player';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
/**
 * The index, in Civilization II's order (`Governments`), of `player`'s government: Despotism for a player with none,
 * or with a government Civ2 doesn't have, as a city of a player who hasn't started is.
 */
export declare const governmentOf: (
  player: Player,
  playerGovernmentRegistry: PlayerGovernmentRegistry
) => number;
export default governmentOf;
