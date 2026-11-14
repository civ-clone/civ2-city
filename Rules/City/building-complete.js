"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const BulidingComplete_1 = require("@civ-clone/core-city-build/Rules/BulidingComplete");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const events_1 = require("@civ-clone/base-city-lifecycle/lib/events");
// Auto (a city choosing its own next build) isn't here yet (civ2-city's README).
const getRules = (engine = Engine_1.instance) => [
    new BulidingComplete_1.default('civ2-city:city/building-complete/emit', new Effect_1.default((cityBuild, built) => {
        (0, events_1.emitBuildingComplete)(cityBuild, built, engine);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=building-complete.js.map