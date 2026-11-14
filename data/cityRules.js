"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scientistResearch = exports.taxCollectorGold = exports.entertainerLuxuries = exports.noTradeCorruption = exports.maximumDistance = exports.noCapitalDistance = exports.corruptionDivisor = void 0;
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
// Civilization II's city numbers that aren't in RULES.TXT, from OpenCiv2's reconstruction of the game
//  (richardpenman/civ2@49f26ec, `src/auto/city.cpp`), each by the function that holds it. Those that are in RULES.TXT
//  come from civ2-rules' `cosmic` (the effective @COSMIC values), and the unit support tables by government from
//  civ2-government.
/**
 * The corruption divisor, by government (`city_corruption_divisor`): 4 under Anarchy, one more for each step up to
 *  Communism, Fundamentalism the same as Communism, and one more again for the Republic and Democracy.
 */
exports.corruptionDivisor = Object.freeze([
    4, 5, 6, 7, 7, 8, 8,
]);
/** The distance a city with no Palace to measure from counts as (`city_calc_capital_link`). */
exports.noCapitalDistance = 32;
/** The furthest a distance counts, once the human's level is added to it (`city_calc_corruption`). */
exports.maximumDistance = 32;
/** The governments without trade corruption (`city_calc_trade_happiness`). */
exports.noTradeCorruption = Object.freeze([
    governments_1.FUNDAMENTALISM,
    governments_1.DEMOCRACY,
]);
/**
 * What each specialist yields, before any improvement multiplies it (`city_split_trade`): an Entertainer 2 luxuries, a
 *  Tax Collector 3 gold and a Scientist 3 research.
 */
exports.entertainerLuxuries = 2;
exports.taxCollectorGold = 3;
exports.scientistResearch = 3;
//# sourceMappingURL=cityRules.js.map