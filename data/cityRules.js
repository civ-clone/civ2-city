"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scientistResearch = exports.taxCollectorGold = exports.entertainerLuxuries = exports.noTradeCorruption = exports.maximumDistance = exports.noCapitalDistance = exports.corruptionDivisor = exports.settlerFood = exports.unitShieldCost = exports.freeUnitSupport = void 0;
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
// Civilization II's city numbers that aren't in RULES.TXT, from OpenCiv2's reconstruction of the game
//  (richardpenman/civ2@49f26ec, `src/auto/city.cpp`), each by the function that holds it. Those that are in RULES.TXT
//  come from civ2-rules' `cosmic` (the effective @COSMIC values) and are named there.
/**
 * How many of a city's units it supports at no cost, by government (`city_count_unit_support`): as many as the city
 *  has citizens under Anarchy and Despotism, @COSMIC's free support under Monarchy, Communism and Fundamentalism, and
 *  none under the Republic and Democracy.
 */
exports.freeUnitSupport = Object.freeze({
    [governments_1.ANARCHY]: 'size',
    [governments_1.DESPOTISM]: 'size',
    [governments_1.MONARCHY]: cosmic_1.default.monarchyFreeSupport,
    [governments_1.COMMUNISM]: cosmic_1.default.communismFreeSupport,
    [governments_1.FUNDAMENTALISM]: cosmic_1.default.fundamentalismFreeSupport,
    [governments_1.REPUBLIC]: 0,
    [governments_1.DEMOCRACY]: 0,
});
/** The shields each unit past the free ones costs (`city_count_unit_support`). */
exports.unitShieldCost = 1;
/**
 * The food a city's units that settle eat each, by government (`city_calc_food_box_rows`): @COSMIC's low figure up to
 *  Monarchy, its high one above.
 */
const settlerFood = (government) => government > governments_1.MONARCHY ? cosmic_1.default.settlerFoodHigh : cosmic_1.default.settlerFoodLow;
exports.settlerFood = settlerFood;
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