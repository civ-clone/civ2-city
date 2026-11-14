"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const TurnStart_1 = require("@civ-clone/core-player/Rules/TurnStart");
const occupiedTiles_1 = require("@civ-clone/base-city-lifecycle/lib/occupiedTiles");
const getRules = (cityRegistry = CityRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance) => [
    new TurnStart_1.default('civ2-city:player/turn-start/release-occupied-worked-tiles', 
    // Before the cities' yields are processed (`civ2-player:player/turn-start/process-city-yields` is `High`).
    new Priority_1.default(0), // X High
    new Effect_1.default((player) => (0, occupiedTiles_1.releaseOccupiedWorkedTiles)(player, cityRegistry, unitRegistry, workedTileRegistry, ruleRegistry))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=turn-start.js.map