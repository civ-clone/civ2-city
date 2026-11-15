"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.shieldsAfterChange = exports.categoryOf = exports.WONDER = exports.IMPROVEMENT = exports.UNIT = void 0;
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const GameDifficultyRegistry_1 = require("@civ-clone/core-difficulty/GameDifficultyRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const BuildCategory_1 = require("@civ-clone/core-city-build/Rules/BuildCategory");
const BuildOverflow_1 = require("@civ-clone/core-city-build/Rules/BuildOverflow");
const Capitalization_1 = require("@civ-clone/base-city-improvement-capitalization/Capitalization");
const CityImprovement_1 = require("@civ-clone/core-city-improvement/CityImprovement");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const ProductionChanged_1 = require("@civ-clone/core-city-build/Rules/ProductionChanged");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const Wonder_1 = require("@civ-clone/core-wonder/Wonder");
const buildCategory_1 = require("@civ-clone/core-city-build/lib/buildCategory");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const level_1 = require("@civ-clone/civ2-difficulty/level");
/** `city_production_category`'s three categories. */
exports.UNIT = 'unit';
exports.IMPROVEMENT = 'improvement';
exports.WONDER = 'wonder';
const isA = (item, Type) => item === Type || item.prototype instanceof Type;
/**
 * Which of Civ2's three categories an item is in (OpenCiv2 `src/auto/city.cpp` `city_production_category` ~2335,
 *  richardpenman/civ2@49f26ec): a unit; an improvement numbered up to 34 (Solar Plant); or anything numbered above it,
 *  which is the spaceship parts (35–37), Capitalization (38) and the Wonders (39 on). So Capitalization is in the
 *  Wonders' category, not the improvements'.
 */
const categoryOf = (item) => {
    if (isA(item, Unit_1.default)) {
        return exports.UNIT;
    }
    if (isA(item, Wonder_1.default) || isA(item, Capitalization_1.default)) {
        return exports.WONDER;
    }
    if (isA(item, CityImprovement_1.default)) {
        return exports.IMPROVEMENT;
    }
    return null;
};
exports.categoryOf = categoryOf;
/**
 * What a change of production keeps (`city_shields_after_change` ~2364): on a change to another category, the box
 *  loses @COSMIC's change penalty per cent, rounded down (`box - penalty × box / 100`), except on Chieftain. Asked from
 *  the box and the item the turn started with (`city_save_build_state`), so changing back restores it.
 */
const shieldsAfterChange = (progress, penalty = cosmic_1.default.changePenalty) => progress - Math.trunc((penalty * (progress & 0xffff)) / 100);
exports.shieldsAfterChange = shieldsAfterChange;
const getRules = (clientRegistry = ClientRegistry_1.instance, gameDifficultyRegistry = GameDifficultyRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance) => [
    new BuildCategory_1.default('civ2-city:city/build-category', new Criterion_1.default((item) => (0, exports.categoryOf)(item) !== null), new Effect_1.default((item) => (0, exports.categoryOf)(item))),
    // `city_process_production` (city_production.cpp ~3003): a computer player's completed unit or improvement takes its
    //  cost from the box, keeping what's over (~2460, ~2730); a person's box is emptied after the announcement (~2410,
    //  ~2838), and so is anyone's after a Wonder or a spaceship part, which are announced to all.
    new BuildOverflow_1.default('civ2-city:city/build-overflow/computer-players', new Criterion_1.default((cityBuild) => !(0, isHuman_1.default)(cityBuild.city().player(), clientRegistry)), new Criterion_1.default((cityBuild, item) => (0, exports.categoryOf)(item) !== exports.WONDER), new Effect_1.default((cityBuild, item, progress, cost) => Math.max(progress - cost, 0))),
    // `city_set_production` (city.cpp ~1488) only asks `city_shields_after_change` for a person's change outside the turn's
    //  processing.
    new ProductionChanged_1.default('civ2-city:city/production-changed/change-penalty', new Criterion_1.default((cityBuild) => (0, isHuman_1.default)(cityBuild.city().player(), clientRegistry)), new Criterion_1.default(() => (0, level_1.levelOf)(gameDifficultyRegistry) !== 0), new Criterion_1.default((cityBuild, from, to) => from !== null &&
        (0, buildCategory_1.default)(from, ruleRegistry) !== (0, buildCategory_1.default)(to, ruleRegistry)), new Effect_1.default((cityBuild, from, to, progress) => (0, exports.shieldsAfterChange)(progress))),
    // A computer player's change from anything but a Wonder to a Wonder halves the box, rounded down, on every level
    //  (`city_set_production`, city.cpp ~1512-1514: `building < -0x26` and `-IMP_FIRST_WONDER < old_building`; Capitalization
    //  and the spaceship parts count as "anything but a Wonder" here). It includes the shields a finished unit or
    //  improvement carried over, as the computer player chooses its next build after the completion. Asked, as every
    //  change is, from where the turn started, so unlike the original, changing back the same turn restores the box.
    new ProductionChanged_1.default('civ2-city:city/production-changed/computer-player-wonder', new Criterion_1.default((cityBuild) => !(0, isHuman_1.default)(cityBuild.city().player(), clientRegistry)), new Criterion_1.default((cityBuild, from, to) => from !== null && !isA(from, Wonder_1.default) && isA(to, Wonder_1.default)), new Effect_1.default((cityBuild, from, to, progress) => Math.trunc(progress / 2))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=build.js.map