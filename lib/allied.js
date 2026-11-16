"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allied = void 0;
const treatyLevel_1 = require("@civ-clone/base-diplomacy/lib/treatyLevel");
/**
 * Whether `player` has an alliance with `other` in `interactionRegistry` (`TREATY_ALLIANCE`), by base-diplomacy's
 *  treaty level: an alliance in force, not a peace or a ceasefire.
 */
const allied = (interactionRegistry) => (player, other) => (0, treatyLevel_1.hasTreatyLevel)({ interactionRegistry }, player, other, treatyLevel_1.TreatyLevel.Alliance);
exports.allied = allied;
exports.default = exports.allied;
//# sourceMappingURL=allied.js.map