import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { PlayerRegistry } from '@civ-clone/core-player/PlayerRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import City from '@civ-clone/core-city/City';
import Player from '@civ-clone/core-player/Player';
/**
 * Civ2's `cities[].founder`, which isn't the player who founded the city: a capture sets it to the city's loser
 *  (OpenCiv2 `src/auto/city.cpp` `city_capture_aftermath` ~5538, richardpenman/civ2@49f26ec), and 63 turns after the
 *  capture `city_process_turn` (~4450) sets it to whoever owns the city then (`(turns_captured - 1 ^ turn) & 0x3f`).
 *  It is what `was_founder` compares the captor with, so retaking a city its captor took from you is a liberation.
 *
 * Kept as a pending effect on the city (saved like any other), with the loser's id and the turn of the capture, and
 *  forgotten when the city is destroyed; a city never captured has its original player.
 *
 * A known difference for saves made before this record existed: a city captured before then has no record, so its
 *  original player stays its founder for good (until its next capture). Nothing tries to work out who lost it.
 */
export declare const FOUNDER = 'civ2-city:founder';
/** How many turns after a capture the owner becomes the founder: the first turn whose low 6 bits are the capture's − 1. */
export declare const founderTurns = 63;
export interface FounderDependencies {
  pendingEffectRegistry?: PendingEffectRegistry;
  playerRegistry?: PlayerRegistry;
  turn?: Turn;
}
/**
 * Who Civ2 counts as `city`'s founder, with `owner` as the city's owner for the 63 turns rule: pass the loser while a
 *  capture is under way (`City#capture` has already changed the owner).
 */
export declare const founderOf: (
  city: City,
  owner?: Player,
  { pendingEffectRegistry, playerRegistry, turn }?: FounderDependencies
) => Player;
/** Forgets `city`'s founder record, when the city is gone. */
export declare const forgetFounder: (
  city: City,
  { pendingEffectRegistry }?: FounderDependencies
) => void;
/** Records `loser` as `city`'s founder from this turn, as a capture does. */
export declare const recordCapture: (
  city: City,
  loser: Player,
  { pendingEffectRegistry, turn }?: FounderDependencies
) => void;
