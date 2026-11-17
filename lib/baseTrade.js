"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgetBaseTrade = exports.storeBaseTrade = exports.baseTradeOf = exports.storedBaseTrade = exports.liveBaseTrade = exports.BASE_TRADE = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const Yields_1 = require("../Yields");
const baseTrade_1 = require("@civ-clone/base-city-trade-route/lib/baseTrade");
/**
 * Civ2's `cities[city].base_trade`: a city's trade after corruption without its routes, kept from its last
 *  recalculation at turn time (`city_calc_trade_happiness`, `city.cpp:3667`, from `city_process_turn`'s
 *  `city_recalc`, `:4470`), and what other cities' routes and a Caravan's delivery read (`city.cpp:3672`,
 *  `unit.cpp:454`).
 *
 * Kept as a pending effect on the city (saved like any other, with the value as a string), written only by
 *  `storeBaseTrade`, which civ2-city's `ProcessYield` rule calls as the city's yields are processed at the start of its
 *  player's turn, and forgotten when the city is destroyed. Asking a city's yields never writes it, so nothing a client
 *  looks at, and no reload, changes what a route earns.
 *
 * A partner's change during a turn (its squares, specialists, government or rates) counts from its next processing,
 *  as in the original. A city never processed yet (just founded, or from a save made before this record) has its
 *  value worked out live when read, without keeping it.
 */
exports.BASE_TRADE = 'civ2-city:base-trade';
const recordOf = (city, pendingEffectRegistry) => {
    var _a;
    return (_a = pendingEffectRegistry
        .getByTarget(city)
        .find((effect) => effect.handler() === exports.BASE_TRADE)) !== null && _a !== void 0 ? _a : null;
};
/** `city`'s trade after corruption without its routes, worked out now. */
const liveBaseTrade = (city) => (0, baseTrade_1.baseTrade)(city, Yields_1.Trade);
exports.liveBaseTrade = liveBaseTrade;
/** The base trade kept for `city`, or `null` if none has been. */
const storedBaseTrade = (city, { pendingEffectRegistry = core_pending_effect_1.instance, } = {}) => {
    const record = recordOf(city, pendingEffectRegistry);
    return record === null ? null : Number(record.data().value);
};
exports.storedBaseTrade = storedBaseTrade;
/** The base trade kept for `city`, or, with none kept yet, worked out now (and not kept). */
const baseTradeOf = (city, dependencies = {}) => { var _a; return (_a = (0, exports.storedBaseTrade)(city, dependencies)) !== null && _a !== void 0 ? _a : (0, exports.liveBaseTrade)(city); };
exports.baseTradeOf = baseTradeOf;
/** Works `city`'s base trade out now and keeps it: at the city's processing only. */
const storeBaseTrade = (city, { pendingEffectRegistry = core_pending_effect_1.instance, } = {}) => {
    const value = (0, exports.liveBaseTrade)(city), record = recordOf(city, pendingEffectRegistry);
    if (record === null) {
        pendingEffectRegistry.register(new core_pending_effect_1.PendingEffect(exports.BASE_TRADE, city, { value: String(value) }));
    }
    else {
        record.setData({ value: String(value) });
    }
    return value;
};
exports.storeBaseTrade = storeBaseTrade;
/** Forgets `city`'s base trade, when the city is gone. */
const forgetBaseTrade = (city, { pendingEffectRegistry = core_pending_effect_1.instance, } = {}) => {
    const record = recordOf(city, pendingEffectRegistry);
    if (record !== null) {
        pendingEffectRegistry.unregister(record);
    }
};
exports.forgetBaseTrade = forgetBaseTrade;
//# sourceMappingURL=baseTrade.js.map