"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const assignWorkers_1 = require("@civ-clone/base-city-lifecycle/lib/assignWorkers");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Shrink_1 = require("@civ-clone/core-city-growth/Rules/Shrink");
const getRules = (workedTileRegistry = WorkedTileRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, engine = Engine_1.instance) => [
    new Shrink_1.default('civ2-city:city/shrink/set-growth-cost', new Criterion_1.default((cityGrowth) => cityGrowth.size() > 0), new Effect_1.default((cityGrowth) => cityGrowth.setCost())),
    new Shrink_1.default('civ2-city:city/shrink/reduce-workers', new Criterion_1.default((cityGrowth) => cityGrowth.size() > 0), new Criterion_1.default((cityGrowth) => (0, assignWorkers_1.citizenCount)(cityGrowth.city(), workedTileRegistry, specialistRegistry) >
        cityGrowth.size() + 1), new Effect_1.default((cityGrowth) => (0, assignWorkers_1.releaseCitizens)(cityGrowth.city(), cityGrowth, workedTileRegistry, specialistRegistry))),
    // With what caused it. A city shrunk to nothing is destroyed instead, which emits `city:destroyed`.
    new Shrink_1.default('civ2-city:city/shrink/emit', new Criterion_1.default((cityGrowth) => cityGrowth.size() > 0), new Effect_1.default((cityGrowth, cause) => {
        engine.emit('city:shrink', cityGrowth.city(), cause);
    })),
    new Shrink_1.default('civ2-city:city/shrink/destroy-empty-city', new Criterion_1.default((cityGrowth) => cityGrowth.size() <= 0), new Effect_1.default((cityGrowth) => cityGrowth.city().destroy())),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=shrink.js.map