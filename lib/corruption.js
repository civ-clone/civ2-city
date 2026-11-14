"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradeCorruption = void 0;
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const cityRules_1 = require("../data/cityRules");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
/**
 * A city's trade corruption, as Civilization II works it out (OpenCiv2 `src/auto/city.cpp` `city_calc_corruption` and
 * `city_calc_trade_happiness`, richardpenman/civ2@49f26ec): distance × amount × 3 / (divisor × 20), at most the
 * amount, halved in the Palace's city. Communism measures every city at @COSMIC's distance; a person's cities under
 * Anarchy or Despotism add the level to theirs; there is none under Fundamentalism or Democracy.
 *
 * Not here: a celebrating city's step up in divisor and the Courthouse's halving, and the shield waste the same
 *  formula gives (civ2-city's README).
 */
const tradeCorruption = ({ amount, government, distance, human, level, capital, }) => {
    if (amount < 1 || cityRules_1.noTradeCorruption.includes(government)) {
        return 0;
    }
    let measured = government === governments_1.COMMUNISM
        ? cosmic_1.default.communismPalaceDistance
        : distance !== null && distance !== void 0 ? distance : cityRules_1.noCapitalDistance;
    if (government !== governments_1.COMMUNISM &&
        government < governments_1.MONARCHY &&
        measured !== 0 &&
        human) {
        measured = Math.min(Math.max(measured + level, 0), cityRules_1.maximumDistance);
    }
    const corruption = Math.min(Math.max(Math.trunc((measured * amount * 3) / (cityRules_1.corruptionDivisor[government] * 20)), 0), amount);
    return capital ? corruption >> 1 : corruption;
};
exports.tradeCorruption = tradeCorruption;
exports.default = exports.tradeCorruption;
//# sourceMappingURL=corruption.js.map