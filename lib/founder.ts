import {
  PendingEffect,
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  PlayerRegistry,
  instance as playerRegistryInstance,
} from '@civ-clone/core-player/PlayerRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import City from '@civ-clone/core-city/City';
import Player from '@civ-clone/core-player/Player';

/**
 * Civ2's `cities[].founder`, which isn't the player who founded the city: a capture sets it to the city's loser
 *  (OpenCiv2 `src/auto/city.cpp` `city_capture_aftermath` ~5538, richardpenman/civ2@49f26ec), and 63 turns after the
 *  capture `city_process_turn` (~4450) sets it to whoever owns the city then (`(turns_captured - 1 ^ turn) & 0x3f`).
 *  It is what `was_founder` compares the captor with, so retaking a city its captor took from you is a liberation.
 *
 * Kept as a pending effect on the city (saved like any other), with the loser's id and the turn of the capture; a city
 *  never captured has its original player.
 */
export const FOUNDER = 'civ2-city:founder';

/** How many turns after a capture the owner becomes the founder: the first turn whose low 6 bits are the capture's − 1. */
export const founderTurns = 63;

export interface FounderDependencies {
  pendingEffectRegistry?: PendingEffectRegistry;
  playerRegistry?: PlayerRegistry;
  turn?: Turn;
}

const founderEffect = (
  city: City,
  pendingEffectRegistry: PendingEffectRegistry
): PendingEffect | null =>
  pendingEffectRegistry
    .getByTarget(city)
    .find((effect: PendingEffect): boolean => effect.handler() === FOUNDER) ??
  null;

/**
 * Who Civ2 counts as `city`'s founder, with `owner` as the city's owner for the 63 turns rule: pass the loser while a
 *  capture is under way (`City#capture` has already changed the owner).
 */
export const founderOf = (
  city: City,
  owner: Player = city.player(),
  {
    pendingEffectRegistry = pendingEffectRegistryInstance,
    playerRegistry = playerRegistryInstance,
    turn = turnInstance,
  }: FounderDependencies = {}
): Player => {
  const effect = founderEffect(city, pendingEffectRegistry);

  if (effect === null) {
    return city.originalPlayer();
  }

  const { loser, turn: captured } = effect.data();

  if (turn.value() - Number(captured) >= founderTurns) {
    return owner;
  }

  return (
    playerRegistry
      .entries()
      .find((player: Player): boolean => player.id() === loser) ?? owner
  );
};

/** Records `loser` as `city`'s founder from this turn, as a capture does. */
export const recordCapture = (
  city: City,
  loser: Player,
  {
    pendingEffectRegistry = pendingEffectRegistryInstance,
    turn = turnInstance,
  }: FounderDependencies = {}
): void => {
  const effect = founderEffect(city, pendingEffectRegistry);

  if (effect !== null) {
    pendingEffectRegistry.unregister(effect);
  }

  pendingEffectRegistry.register(
    new PendingEffect(FOUNDER, city, {
      loser: loser.id(),
      turn: String(turn.value()),
    })
  );
};
