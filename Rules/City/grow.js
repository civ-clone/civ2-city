"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const AvailableSpecialistRegistry_1 = require("@civ-clone/core-city/AvailableSpecialistRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const PlayerWorldRegistry_1 = require("@civ-clone/core-player-world/PlayerWorldRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const assignWorkers_1 = require("@civ-clone/base-city-lifecycle/lib/assignWorkers");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Grow_1 = require("@civ-clone/core-city-growth/Rules/Grow");
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance, playerWorldRegistry = PlayerWorldRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, availableSpecialistRegistry = AvailableSpecialistRegistry_1.instance, engine = Engine_1.instance) => [
    // The box empties as the city grows (OpenCiv2 `city_process_food`); a Granary's or the Pyramids' half box is
    //  civ2-city-improvement's and civ2-wonder's.
    new Grow_1.default('civ2-city:city/grow/empty-food-store', new Effect_1.default((cityGrowth) => cityGrowth.empty())),
    // The box for the new size, from the `Cost` rules (`growth-cost`).
    new Grow_1.default('civ2-city:city/grow/set-growth-cost', new Effect_1.default((cityGrowth) => cityGrowth.setCost())),
    // The new citizen works the best square left, or is a specialist when there's none: Civ2 has no size from which
    //  citizens are born specialists, as Civ1 has.
    new Grow_1.default('civ2-city:city/grow/assign-worker', new Criterion_1.default((cityGrowth) => (0, assignWorkers_1.citizenCount)(cityGrowth.city(), workedTileRegistry, specialistRegistry) <
        cityGrowth.size() + 1), new Effect_1.default((cityGrowth) => (0, assignWorkers_1.assignWorker)(cityGrowth.city(), playerWorldRegistry, cityGrowthRegistry, workedTileRegistry, specialistRegistry, availableSpecialistRegistry))),
    new Grow_1.default('civ2-city:city/grow/reduce-workers', new Criterion_1.default((cityGrowth) => (0, assignWorkers_1.citizenCount)(cityGrowth.city(), workedTileRegistry, specialistRegistry) >
        cityGrowth.size() + 1), new Effect_1.default((cityGrowth) => (0, assignWorkers_1.releaseCitizens)(cityGrowth.city(), cityGrowth, workedTileRegistry, specialistRegistry))),
    // Last, so a listener sees the city with its new citizen already at work, and is told why it grew.
    new Grow_1.default('civ2-city:city/grow/emit', new Effect_1.default((cityGrowth, cause) => {
        engine.emit('city:grow', cityGrowth.city(), cause);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=grow.js.map