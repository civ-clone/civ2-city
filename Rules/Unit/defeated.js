"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const GameDifficultyRegistry_1 = require("@civ-clone/core-difficulty/GameDifficultyRegistry");
const Attack_1 = require("@civ-clone/base-unit-action-attack/Attack");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Types_1 = require("@civ-clone/core-terrain/Types");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const level_1 = require("@civ-clone/civ2-difficulty/level");
const getRules = (cityRegistry = CityRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, engine = Engine_1.instance, gameDifficultyRegistry = GameDifficultyRegistry_1.instance, clientRegistry = ClientRegistry_1.instance) => [
    // A city whose defender loses an attack loses a citizen, unless the attack came from the sea or the city is a
    //  person's on Chieftain (OpenCiv2 `src/auto/unit_combat.cpp` `unit_resolve_attack_remove_loser`,
    //  richardpenman/civ2@49f26ec: `tile_is_ocean(x2, y2)` is the attacker's square, `civ5` the defender's owner). City
    //  Walls and the Great Wall, which also spare it there, are civ2-city-improvement's and civ2-wonder's, and not yet
    //  asked.
    new Defeated_1.default('civ2-city:unit/defeated/shrink-defended-city', new Criterion_1.default((defeated, by, action) => action instanceof Attack_1.default &&
        action.to() === defeated.tile() &&
        cityRegistry.getByTile(action.to()) !== null), new Criterion_1.default((defeated, by) => !(by.tile().terrain() instanceof Types_1.Water)), new Criterion_1.default((defeated) => (0, level_1.levelOf)(gameDifficultyRegistry) !== 0 ||
        !(0, isHuman_1.default)(defeated.player(), clientRegistry)), new Effect_1.default((defeated, by, action) => cityGrowthRegistry
        .getByCity(cityRegistry.getByTile(defeated.tile()))
        .shrink(action))),
    new Defeated_1.default('civ2-city:unit/defeated/emit', new Effect_1.default((defeated, by, action) => {
        engine.emit('unit:defeated', defeated, by, action);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=defeated.js.map