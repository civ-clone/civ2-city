"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const destroyed_1 = require("@civ-clone/base-city-lifecycle/lib/destroyed");
const Destroyed_1 = require("@civ-clone/core-city/Rules/Destroyed");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Irrigation_1 = require("@civ-clone/base-tile-improvement-irrigation/Irrigation");
const Removed_1 = require("@civ-clone/core-tile-improvement/Rules/Removed");
const getRules = (tileImprovementRegistry = TileImprovementRegistry_1.instance, engine = Engine_1.instance, unitRegistry = UnitRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance) => [
    // The irrigation `created` gave the city's square goes with it, through the `Removed` rules, so the square's yields
    //  are worked out again and whoever shows it is told.
    new Destroyed_1.default('civ2-city:city/destroyed/remove-irrigation', new Effect_1.default((city) => tileImprovementRegistry
        .getByTile(city.tile())
        .filter((improvement) => improvement instanceof Irrigation_1.default)
        .forEach((irrigation) => {
        ruleRegistry.process(Removed_1.default, city.tile(), irrigation);
    }))),
    new Destroyed_1.default('civ2-city:city/destroyed/emit', new Effect_1.default((city, player) => {
        engine.emit('city:destroyed', city, player);
    })),
    new Destroyed_1.default('civ2-city:city/destroyed/destroy-supported-units', new Effect_1.default((city) => (0, destroyed_1.destroyUnits)(unitRegistry.getByCity(city)))),
    new Destroyed_1.default('civ2-city:city/destroyed/release-worked-tiles', new Effect_1.default((city) => (0, destroyed_1.releaseWorkedTiles)(city, workedTileRegistry))),
    new Destroyed_1.default('civ2-city:city/destroyed/release-specialists', new Effect_1.default((city) => (0, destroyed_1.releaseSpecialists)(city, specialistRegistry))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=destroyed.js.map