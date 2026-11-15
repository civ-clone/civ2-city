"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
const Effect_1 = require("@civ-clone/core-rule/Effect");
// A city losing a citizen when one of its defenders loses (OpenCiv2 `unit_resolve_attack_remove_loser`) is civ2-unit's
//  `civ2-unit:unit/defeated/city-shrinks`, which also asks for City Walls and the Great Wall. It isn't repeated here,
//  or a city would lose two.
const getRules = (engine = Engine_1.instance) => [
    new Defeated_1.default('civ2-city:unit/defeated/emit', new Effect_1.default((defeated, by, action) => {
        engine.emit('unit:defeated', defeated, by, action);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=defeated.js.map