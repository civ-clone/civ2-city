"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const AvailableSpecialistRegistry_1 = require("@civ-clone/core-city/AvailableSpecialistRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const PlayerWorldRegistry_1 = require("@civ-clone/core-player-world/PlayerWorldRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const TileReassigned_1 = require("@civ-clone/core-city/Rules/TileReassigned");
const assignWorkers_1 = require("@civ-clone/base-city-lifecycle/lib/assignWorkers");
const getRules = (playerWorldRegistry = PlayerWorldRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, availableSpecialistRegistry = AvailableSpecialistRegistry_1.instance) => [
    new TileReassigned_1.default('civ2-city:city/tile-reassigned/assign-workers', 
    // A destroyed city can still hold a tile (a new city founded on its site takes its centre back and processes this),
    //  but must not be given another.
    new Criterion_1.default((city) => !city.destroyed()), new Effect_1.default((city) => (0, assignWorkers_1.default)(city, playerWorldRegistry, cityGrowthRegistry, workedTileRegistry, specialistRegistry, availableSpecialistRegistry))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=tile-reassigned.js.map