"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.terms = void 0;
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const GovernmentTerms_1 = require("@civ-clone/base-government-terms/Rules/GovernmentTerms");
const cityRules_1 = require("../../data/cityRules");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const Governments_1 = require("../../Governments");
// The index of `GovernmentType` in Civ2's order (`Governments`), matched as `PlayerGovernment#is` matches, or -1.
const indexOf = (GovernmentType) => Governments_1.governments.findIndex((Known) => GovernmentType === Known || GovernmentType.prototype instanceof Known);
/**
 * What each of Civilization II's governments does to a city's squares and its corruption, as this package's rules
 *  apply them (`Rules/City/tile-yield`, `lib/corruption`), as base-government-terms' `GovernmentTerms`, for a player or
 *  its AI to compare governments with. Asked by nothing in the rules themselves. A city that isn't celebrating:
 * - below Monarchy, a yield over 2 loses 1;
 * - from the Republic up, any trade gains 1;
 * - corruption takes distance × 3 / (divisor × 20) of the trade, the divisor by government, and Communism measures every
 *   city at @COSMIC's distance; none under Fundamentalism and Democracy.
 */
const terms = (index) => ({
    tilePenalty: index < governments_1.MONARCHY ? { threshold: 2, amount: 1 } : null,
    tradeBonus: index >= governments_1.REPUBLIC ? 1 : 0,
    corruption: {
        perDistance: cityRules_1.noTradeCorruption.includes(index)
            ? 0
            : 3 /
                (cityRules_1.corruptionDivisor[Math.min(index, cityRules_1.corruptionDivisor.length - 1)] * 20),
        fixedDistance: index === governments_1.COMMUNISM ? cosmic_1.default.communismPalaceDistance : null,
    },
});
exports.terms = terms;
const getRules = () => [
    new GovernmentTerms_1.default('civ2-city:government/terms', new Criterion_1.default((GovernmentType) => indexOf(GovernmentType) > -1), new Effect_1.default((GovernmentType) => (0, exports.terms)(indexOf(GovernmentType)))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=terms.js.map