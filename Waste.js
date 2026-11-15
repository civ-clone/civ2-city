"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Waste = void 0;
const Production_1 = require("@civ-clone/base-terrain-yield-production/Production");
const NegativeYield_1 = require("@civ-clone/core-yield/NegativeYield");
/**
 * The shields a city loses to waste (Civilization II's `shield_waste`, `lib/corruption`'s `shieldWaste`). Like
 *  `Corruption` from trade, it is a negative `Production`, so the city's production is net of it.
 */
class Waste extends Production_1.default {
}
exports.Waste = Waste;
(0, NegativeYield_1.makeNegative)(Waste);
exports.default = Waste;
//# sourceMappingURL=Waste.js.map