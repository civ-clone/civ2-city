"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const BulidingCancelled_1 = require("@civ-clone/core-city-build/Rules/BulidingCancelled");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const events_1 = require("@civ-clone/base-city-lifecycle/lib/events");
// Auto (a city choosing its own next build) is `Rules/City/auto-build`'s, registered after this.
const getRules = (engine = Engine_1.instance) => [
    // A city has stopped building something, however it was dropped: told with the item and why, so a client can show
    //  the build as it is now, even in the middle of its player's turn (civ-clone/web-renderer#978).
    new BulidingCancelled_1.default('civ2-city:city/building-cancelled/emit', new Effect_1.default((cityBuild, item, reason) => {
        (0, events_1.emitBuildingCancelled)(cityBuild, item, reason, engine);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=building-cancelled.js.map