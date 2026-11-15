"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAutoMode = exports.includeFor = exports.forgetAutoMode = exports.autoModeOf = exports.AUTO_MODE = exports.autoModes = void 0;
const autoBuild_1 = require("@civ-clone/base-city-auto-build/lib/autoBuild");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const rankBuildItems_1 = require("@civ-clone/core-city-build/lib/rankBuildItems");
exports.autoModes = ['any', 'units', 'improvements'];
/**
 * The pending effect that keeps a city's Auto mode, as Civ2's two flags: with `data.mode` `'units'` or `'improvements'`.
 *  Pending effects are saved, so the mode survives a save; a city on Auto with none is on `'any'`. Nothing discharges
 *  it, so it needs no handler.
 */
exports.AUTO_MODE = 'civ2-city:auto-mode';
const modeEffect = (city, pendingEffects) => {
    var _a;
    return (_a = pendingEffects
        .getByTarget(city)
        .find((effect) => effect.handler() === exports.AUTO_MODE)) !== null && _a !== void 0 ? _a : null;
};
/** The city's Auto mode, or `null` while it isn't on Auto. */
const autoModeOf = (cityBuild, pendingEffects = core_pending_effect_1.instance) => {
    var _a;
    if (!cityBuild.auto()) {
        return null;
    }
    const mode = (_a = modeEffect(cityBuild.city(), pendingEffects)) === null || _a === void 0 ? void 0 : _a.data().mode;
    return mode === 'units' || mode === 'improvements' ? mode : 'any';
};
exports.autoModeOf = autoModeOf;
/** Drops the city's Auto mode (`CITYF_AUTO_UNITS_ONLY | CITYF_AUTO_IMPROVEMENTS_ONLY`), leaving `'any'`. */
const forgetAutoMode = (city, pendingEffects = core_pending_effect_1.instance) => {
    const effect = modeEffect(city, pendingEffects);
    if (effect !== null) {
        pendingEffects.unregister(effect);
    }
};
exports.forgetAutoMode = forgetAutoMode;
/** What a city on Auto in `mode` may choose: base-city-auto-build's `anything`, `unitsOnly` or `improvementsOnly`. */
const includeFor = (mode) => mode === 'units'
    ? autoBuild_1.unitsOnly
    : mode === 'improvements'
        ? autoBuild_1.improvementsOnly
        : autoBuild_1.anything;
exports.includeFor = includeFor;
/**
 * Puts the city on Auto in `mode`, or takes it off with `null` (both flags go too, as `city_window.cpp` ~4294 clears
 *  them). As Civ2's change dialog does (`city_set_production(city, 99)` straight after setting the flags), it chooses
 *  at once, in place of what the city is building, when it finds anything (core-city-build's `ProductionChanged`
 *  rules apply to the change as to any other); with nothing it would choose, the build is left as it is. Returns
 *  whether it chose anything.
 */
const setAutoMode = (cityBuild, mode, ruleRegistry = RuleRegistry_1.instance, pendingEffects = core_pending_effect_1.instance) => {
    var _a;
    const city = cityBuild.city();
    (0, exports.forgetAutoMode)(city, pendingEffects);
    if (mode === null) {
        cityBuild.setAuto(false);
        return false;
    }
    if (mode !== 'any') {
        pendingEffects.register(new core_pending_effect_1.PendingEffect(exports.AUTO_MODE, city, { mode }));
    }
    cityBuild.setAuto(true);
    const [best] = (0, rankBuildItems_1.default)(cityBuild, ruleRegistry, (0, exports.includeFor)(mode));
    if (!best) {
        return false;
    }
    if (((_a = cityBuild.building()) === null || _a === void 0 ? void 0 : _a.item()) !== best.buildItem.item()) {
        cityBuild.build(best.buildItem.item());
    }
    return true;
};
exports.setAutoMode = setAutoMode;
exports.default = exports.autoModeOf;
//# sourceMappingURL=autoMode.js.map