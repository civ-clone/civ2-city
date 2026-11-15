"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordCapture = exports.founderOf = exports.founderTurns = exports.FOUNDER = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerRegistry_1 = require("@civ-clone/core-player/PlayerRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
/**
 * Civ2's `cities[].founder`, which isn't the player who founded the city: a capture sets it to the city's loser
 *  (OpenCiv2 `src/auto/city.cpp` `city_capture_aftermath` ~5538, richardpenman/civ2@49f26ec), and 63 turns after the
 *  capture `city_process_turn` (~4450) sets it to whoever owns the city then (`(turns_captured - 1 ^ turn) & 0x3f`).
 *  It is what `was_founder` compares the captor with, so retaking a city its captor took from you is a liberation.
 *
 * Kept as a pending effect on the city (saved like any other), with the loser's id and the turn of the capture; a city
 *  never captured has its original player.
 */
exports.FOUNDER = 'civ2-city:founder';
/** How many turns after a capture the owner becomes the founder: the first turn whose low 6 bits are the capture's − 1. */
exports.founderTurns = 63;
const founderEffect = (city, pendingEffectRegistry) => {
    var _a;
    return (_a = pendingEffectRegistry
        .getByTarget(city)
        .find((effect) => effect.handler() === exports.FOUNDER)) !== null && _a !== void 0 ? _a : null;
};
/**
 * Who Civ2 counts as `city`'s founder, with `owner` as the city's owner for the 63 turns rule: pass the loser while a
 *  capture is under way (`City#capture` has already changed the owner).
 */
const founderOf = (city, owner = city.player(), { pendingEffectRegistry = core_pending_effect_1.instance, playerRegistry = PlayerRegistry_1.instance, turn = Turn_1.instance, } = {}) => {
    var _a;
    const effect = founderEffect(city, pendingEffectRegistry);
    if (effect === null) {
        return city.originalPlayer();
    }
    const { loser, turn: captured } = effect.data();
    if (turn.value() - Number(captured) >= exports.founderTurns) {
        return owner;
    }
    return ((_a = playerRegistry
        .entries()
        .find((player) => player.id() === loser)) !== null && _a !== void 0 ? _a : owner);
};
exports.founderOf = founderOf;
/** Records `loser` as `city`'s founder from this turn, as a capture does. */
const recordCapture = (city, loser, { pendingEffectRegistry = core_pending_effect_1.instance, turn = Turn_1.instance, } = {}) => {
    const effect = founderEffect(city, pendingEffectRegistry);
    if (effect !== null) {
        pendingEffectRegistry.unregister(effect);
    }
    pendingEffectRegistry.register(new core_pending_effect_1.PendingEffect(exports.FOUNDER, city, {
        loser: loser.id(),
        turn: String(turn.value()),
    }));
};
exports.recordCapture = recordCapture;
//# sourceMappingURL=founder.js.map