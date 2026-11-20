"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shieldWaste = exports.tradeCorruption = exports.corruption = exports.CORRUPTION_HALVED_BY = void 0;
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const cityRules_1 = require("../data/cityRules");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
/**
 * What the Palace, in its own city, or a Courthouse divides corruption and waste by (`city_calc_corruption`'s halving),
 *  read by `corruption` and by what the waste rule says the Courthouse does (civ-clone/web-renderer#1196).
 */
exports.CORRUPTION_HALVED_BY = 2;
/** The corruption divisor for a government level, which a celebrating Democracy takes one past the table. */
const divisorOf = (level) => cityRules_1.corruptionDivisor[Math.min(level, cityRules_1.corruptionDivisor.length - 1)];
/**
 * `city_calc_corruption` (OpenCiv2 `src/auto/city.cpp`, richardpenman/civ2@49f26ec), for trade and shields alike:
 *  distance × amount × 3 / (divisor × 20), rounded down, at most the amount, then halved (rounding down) by the Palace
 *  or a Courthouse. Communism measures every city at @COSMIC's distance. A celebrating city counts its government one
 *  step up, for the divisor and for the level a person's cities under Anarchy or Despotism add to the distance (up to
 *  32); Communism itself still goes by the government.
 */
const corruption = ({ amount, government, distance, human, level, capital, celebrating = false, courthouse = false, clampDistance = null, }) => {
    if (amount < 1) {
        return 0;
    }
    const governmentLevel = celebrating ? government + 1 : government, divisor = divisorOf(governmentLevel);
    let measured;
    if (government === governments_1.COMMUNISM) {
        measured = cosmic_1.default.communismPalaceDistance;
    }
    else {
        // `city_calc_capital_link` starts at 32 and only lowers it, so no distance counts for more.
        measured = Math.min(distance !== null && distance !== void 0 ? distance : cityRules_1.noCapitalDistance, cityRules_1.maximumDistance);
        if (clampDistance !== null && measured > clampDistance) {
            measured = clampDistance;
        }
        if (governmentLevel < governments_1.MONARCHY && measured !== 0 && human) {
            measured = Math.min(Math.max(measured + level, 0), cityRules_1.maximumDistance);
        }
    }
    const result = Math.min(Math.max(Math.trunc((measured * amount * 3) / (divisor * 20)), 0), amount);
    // `result` is never negative, so this is `result >> 1`, as the original has it.
    return capital || courthouse
        ? Math.trunc(result / exports.CORRUPTION_HALVED_BY)
        : result;
};
exports.corruption = corruption;
/**
 * A city's trade corruption (`city_calc_trade_happiness`): `corruption` with no limit on the distance, and none under
 *  Fundamentalism or Democracy. The Courthouse's halving is civ2-city-improvement's.
 */
const tradeCorruption = (input) => cityRules_1.noTradeCorruption.includes(input.government)
    ? 0
    : (0, exports.corruption)({ ...input, courthouse: false, clampDistance: null });
exports.tradeCorruption = tradeCorruption;
/**
 * A city's shield waste (`city_calc_shields_pollution`): `corruption` of its shields less their support, the distance
 *  counting no more than 16, times (3 − link) / 3, over (government ÷ 2) + 1, each rounded down; at most what leaves
 *  the city 1 shield over its support, and none below 1. None for the barbarians, under Democracy or Fundamentalism,
 *  or while building the Palace with no capital. The divisor after the link is the government's own, celebrating or
 *  not.
 */
const shieldWaste = ({ shields, support, link, barbarian, buildingPalaceWithNoCapital, ...input }) => {
    if (barbarian ||
        cityRules_1.noShieldWaste.includes(input.government) ||
        buildingPalaceWithNoCapital) {
        return 0;
    }
    const wasted = Math.trunc(Math.trunc(((3 - link) *
        (0, exports.corruption)({
            ...input,
            amount: shields - support,
            clampDistance: cityRules_1.wasteDistance,
        })) /
        3) /
        ((input.government >> 1) + 1)), waste = Math.min(wasted, shields - (support + 1));
    return waste < 1 ? 0 : waste;
};
exports.shieldWaste = shieldWaste;
exports.default = exports.tradeCorruption;
//# sourceMappingURL=corruption.js.map