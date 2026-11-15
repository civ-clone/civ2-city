"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const autoMode_1 = require("../../lib/autoMode");
const BulidingCancelled_1 = require("@civ-clone/core-city-build/Rules/BulidingCancelled");
const BulidingComplete_1 = require("@civ-clone/core-city-build/Rules/BulidingComplete");
const Captured_1 = require("@civ-clone/core-city/Rules/Captured");
const Destroyed_1 = require("@civ-clone/core-city/Rules/Destroyed");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const TurnStart_1 = require("@civ-clone/core-player/Rules/TurnStart");
const Unit_1 = require("@civ-clone/core-unit/Unit");
const autoBuild_1 = require("@civ-clone/base-city-auto-build/lib/autoBuild");
/**
 * When a city on Auto chooses (base-city-auto-build's `lib/autoBuild`, from what its mode allows, `lib/autoMode`): when
 *  its build is finished or can no longer be built, and at the start of its player's turn while it builds nothing.
 *  With nothing it would choose, a city that has just finished a unit builds another of it, as Civ2's does (its
 *  `building` is left as it was), unless `clearWhenNothingChosen` takes it off Auto.
 */
const getRules = ({ cityBuildRegistry = CityBuildRegistry_1.instance, cityRegistry = CityRegistry_1.instance, pendingEffectRegistry = core_pending_effect_1.instance, ruleRegistry = RuleRegistry_1.instance, } = {}, { clearWhenNothingChosen = false } = {}) => {
    const choose = (cityBuild) => (0, autoBuild_1.default)(cityBuild, ruleRegistry, (0, autoMode_1.includeFor)((0, autoMode_1.autoModeOf)(cityBuild, pendingEffectRegistry))), nothingChosen = (cityBuild) => cityBuild.auto() && cityBuild.building() === null, clear = (cityBuild) => {
        if (clearWhenNothingChosen && nothingChosen(cityBuild)) {
            (0, autoMode_1.setAutoMode)(cityBuild, null, ruleRegistry, pendingEffectRegistry);
        }
    };
    return [
        new BulidingComplete_1.default('civ2-city:city/building-complete/auto', new Effect_1.default((cityBuild) => {
            var _a, _b;
            if (choose(cityBuild) || !nothingChosen(cityBuild)) {
                return;
            }
            if (clearWhenNothingChosen) {
                clear(cityBuild);
                return;
            }
            const completed = (_b = (_a = cityBuild.cleared()) === null || _a === void 0 ? void 0 : _a.item) !== null && _b !== void 0 ? _b : null;
            if (completed !== null &&
                Object.prototype.isPrototypeOf.call(Unit_1.default, completed) &&
                cityBuild.getAvailable(completed)) {
                cityBuild.build(completed);
            }
        })),
        new BulidingCancelled_1.default('civ2-city:city/building-cancelled/auto', new Effect_1.default((cityBuild) => {
            if (!choose(cityBuild)) {
                clear(cityBuild);
            }
        })),
        new TurnStart_1.default('civ2-city:player/turn-start/auto-build', new Effect_1.default((player) => cityRegistry.getByPlayer(player).forEach((city) => {
            const cityBuild = cityBuildRegistry.getByCity(city);
            if (nothingChosen(cityBuild) && !choose(cityBuild)) {
                clear(cityBuild);
            }
        }))),
        // A captured city is taken off Auto (`civ2-city:city/captured/stop-auto`), and its mode goes with it.
        new Captured_1.default('civ2-city:city/captured/auto-mode', new Effect_1.default((city) => (0, autoMode_1.forgetAutoMode)(city, pendingEffectRegistry))),
        new Destroyed_1.default('civ2-city:city/destroyed/auto-mode', new Effect_1.default((city) => (0, autoMode_1.forgetAutoMode)(city, pendingEffectRegistry))),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=auto-build.js.map