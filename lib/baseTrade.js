"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgetBaseTrade = exports.storeBaseTrade = exports.baseTradeOf = exports.storedBaseTrade = exports.continuedBaseTrade = exports.liveBaseTrade = exports.BASE_TRADE = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const Cost_1 = require("@civ-clone/core-city/Rules/Cost");
const Yield_1 = require("@civ-clone/core-yield/Yield");
const YieldModifier_1 = require("@civ-clone/core-city/Rules/YieldModifier");
const Yield_2 = require("@civ-clone/core-city/Rules/Yield");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const Yields_1 = require("../Yields");
const baseTrade_1 = require("@civ-clone/base-city-trade-route/lib/baseTrade");
/**
 * Civ2's `cities[city].base_trade`: a city's trade after corruption without its routes (`city_calc_trade_happiness`,
 *  `city.cpp:3667`), which other cities' routes and a Caravan's delivery read (`city.cpp:3672`, `unit.cpp:454`).
 *
 * Kept as a pending effect on the city (saved like any other, with the value as a string), written only by
 *  `storeBaseTrade`, which civ2-city calls at two points: as the city's yields are processed at the start of its
 *  player's turn (`ProcessYield`, as `city_process_turn`'s `city_recalc`, `:4470`), and when it is captured
 *  (`Captured`), so its new owner's corruption counts at once. It is forgotten when the city is destroyed.
 *
 * **A deviation, on purpose:** the original rewrites `base_trade` on every `city_recalc`, which includes opening a
 *  city's window and many moves of units. Here asking a city's yields never writes it, so nothing a client looks at,
 *  and no reload, changes what a route earns. A partner's change during a turn (its squares, specialists, government
 *  or rates) therefore counts from its next processing, where the original may count it sooner. A city never
 *  processed yet (just founded, or from a save made before this record) has its value worked out live when read,
 *  without keeping it; so does a kept value that isn't a finite number.
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
// A copy of a yield with its values and their providers, so a later rule that changes a yield in place changes the
//  copy, never the pipeline the copy was taken from.
const copyOf = (cityYield) => {
    const copy = Object.assign(Object.create(Object.getPrototypeOf(cityYield)), cityYield);
    copy._values = cityYield._values.map(([value, provider]) => [value, provider]);
    return copy;
};
/**
 * `city`'s trade after corruption without its routes, worked out from inside its own yield pipeline: `yields` is what
 *  the `YieldRule`s before `rule` (the route income rule) made, which a fresh pipeline would make again, so only what
 *  comes after it is run here, on a copy (every later `YieldRule` in order, then the `YieldModifier`s and `Cost`s, as
 *  `City#yields` runs them), and `rule` itself is left out. The original works `base_trade` out in the same
 *  recalculation (`city.cpp:3667`); this gives what `liveBaseTrade` gives without working the city's squares out again.
 */
const continuedBaseTrade = (city, yields, rule, ruleRegistry) => {
    const continued = yields.map(copyOf), push = (cityYields) => {
        if (!cityYields) {
            return;
        }
        if (cityYields instanceof Yield_1.default) {
            continued.push(cityYields);
            return;
        }
        cityYields.forEach((cityYield) => continued.push(cityYield));
    }, yieldRules = ruleRegistry.get(Yield_2.default), index = yieldRules.indexOf(rule);
    // Not one of the registry's rules (a test calling it directly): the whole pipeline, as before.
    if (index === -1) {
        return (0, exports.liveBaseTrade)(city);
    }
    yieldRules.slice(index + 1).forEach((yieldRule) => {
        if (yieldRule.validate(city, continued)) {
            push(yieldRule.process(city, continued));
        }
    });
    const base = [...continued];
    ruleRegistry.get(YieldModifier_1.default).forEach((modifier) => {
        if (modifier.validate(city, continued, base)) {
            push(modifier.process(city, continued, base));
        }
    });
    ruleRegistry.get(Cost_1.default).forEach((cost) => {
        if (cost.validate(city, continued)) {
            push(cost.process(city, continued));
        }
    });
    return Math.max((0, reduceYields_1.reduceYield)(continued, Yields_1.Trade), 0);
};
exports.continuedBaseTrade = continuedBaseTrade;
/** The base trade kept for `city`, or `null` if none has been (or what was kept isn't a finite number). */
const storedBaseTrade = (city, { pendingEffectRegistry = core_pending_effect_1.instance, } = {}) => {
    const record = recordOf(city, pendingEffectRegistry);
    if (record === null) {
        return null;
    }
    const value = Number(record.data().value);
    return Number.isFinite(value) ? value : null;
};
exports.storedBaseTrade = storedBaseTrade;
/** The base trade kept for `city`, or, with none kept yet, worked out now (and not kept). */
const baseTradeOf = (city, dependencies = {}) => { var _a; return (_a = (0, exports.storedBaseTrade)(city, dependencies)) !== null && _a !== void 0 ? _a : (0, exports.liveBaseTrade)(city); };
exports.baseTradeOf = baseTradeOf;
/**
 * Works `city`'s base trade out now and keeps it: at the city's processing and its capture only. At the processing it
 *  is worked out as the city's trade is processed, after its food and shields have been (a city that grew or finished
 *  a building has changed since its yields were asked for), as the original's second `city_recalc` (`city.cpp:4491`)
 *  leaves it.
 */
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