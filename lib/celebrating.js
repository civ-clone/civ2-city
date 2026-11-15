"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.celebrating = exports.LEADER_CELEBRATION = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const cityStatus_1 = require("@civ-clone/base-city-happiness-status/lib/cityStatus");
/** civ2-city-happiness' status for a city celebrating its leader (`CITYF_CELEBRATING`), named here so civ2-city needn't depend on it. */
exports.LEADER_CELEBRATION = 'civ2-city-happiness:leader-celebration';
/** Whether `city` is celebrating its leader: whether civ2-city-happiness has recorded the status on it. */
const celebrating = (city, pendingEffects = core_pending_effect_1.instance) => (0, cityStatus_1.cityStatus)(exports.LEADER_CELEBRATION, city, pendingEffects) !== null;
exports.celebrating = celebrating;
exports.default = exports.celebrating;
//# sourceMappingURL=celebrating.js.map