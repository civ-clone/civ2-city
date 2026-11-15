"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const AvailableSpecialistRegistry_1 = require("@civ-clone/core-city/AvailableSpecialistRegistry");
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const PlayerWorldRegistry_1 = require("@civ-clone/core-player-world/PlayerWorldRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const Captured_1 = require("@civ-clone/core-city/Rules/Captured");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const InciteRevolt_1 = require("@civ-clone/base-unit-action-incite-revolt/InciteRevolt");
const captureAftermath_1 = require("../../lib/captureAftermath");
const founder_1 = require("../../lib/founder");
const captured_1 = require("@civ-clone/base-city-lifecycle/lib/captured");
const assignWorkers_1 = require("@civ-clone/base-city-lifecycle/lib/assignWorkers");
// What happens to a city that changes hands, as Civilization II has it (OpenCiv2 `src/auto/city.cpp`
//  `city_capture_aftermath`, richardpenman/civ2@49f26ec): its shield box is emptied, Auto is turned off, it keeps what
//  it was building, and it loses a citizen. Plunder, the units it supported and Partisans are in `captured-aftermath`;
//  lost improvements and the Palace are civ2-city-improvement's, the stolen advance civ2-science's.
const getRules = (unitRegistry = UnitRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, cityBuildRegistry = CityBuildRegistry_1.instance, engine = Engine_1.instance, playerWorldRegistry = PlayerWorldRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, availableSpecialistRegistry = AvailableSpecialistRegistry_1.instance, capture = {}) => [
    new Captured_1.default('civ2-city:city/captured/reset-build-progress', new Effect_1.default((capturedCity) => cityBuildRegistry.getByCity(capturedCity).progress().set(0))),
    new Captured_1.default('civ2-city:city/captured/stop-auto', new Effect_1.default((capturedCity) => cityBuildRegistry.getByCity(capturedCity).setAuto(false))),
    // Whoever takes it, the item stays, at the new owner's price.
    new Captured_1.default('civ2-city:city/captured/keep-build', new Effect_1.default((capturedCity) => (0, captured_1.keepCapturedBuild)(cityBuildRegistry.getByCity(capturedCity)))),
    // A city conquered from another than its founder (as Civ2 counts it: `lib/founder`) loses a citizen, so one of size 1 is destroyed; one taken by a
    //  Diplomat or Spy, or retaken by its founder, loses one only when it has one to spare (`city_capture_aftermath`).
    new Captured_1.default('civ2-city:city/captured/shrink', new Criterion_1.default((capturedCity, capturingPlayer, player, cause) => cityGrowthRegistry.getByCity(capturedCity).size() > 1 ||
        (!(cause instanceof InciteRevolt_1.default) &&
            (0, founder_1.founderOf)(capturedCity, player, (0, captureAftermath_1.withCaptureDefaults)(capture)) !==
                capturingPlayer)), new Effect_1.default((capturedCity) => cityGrowthRegistry.getByCity(capturedCity).shrink(Captured_1.default))),
    // The food box is the new owner's: a computer player's rows differ from a person's (`growth-cost`). A city that
    //  shrank was costed by `shrink/set-growth-cost` already and is costed again here, which is harmless; one that's
    //  gone isn't (checked here, as every `Criterion` is evaluated before any `Effect` runs).
    new Captured_1.default('civ2-city:city/captured/set-growth-cost', new Effect_1.default((capturedCity) => {
        if (capturedCity.destroyed()) {
            return;
        }
        cityGrowthRegistry.getByCity(capturedCity).setCost();
    })),
    new Captured_1.default('civ2-city:city/captured/emit', new Effect_1.default((capturedCity, capturingPlayer, player) => {
        engine.emit('city:captured', capturedCity, capturingPlayer, player);
    })),
    // Plunder (`High`, then after every `Normal` rule), the units the city supported (`Normal`, here: after the shrink,
    //  which may have destroyed the city and its units with it, as `city_delete` does) and Partisans (after `Normal`).
    ...(0, captureAftermath_1.captureRules)(unitRegistry, cityGrowthRegistry, engine, (0, captureAftermath_1.withCaptureDefaults)(capture)),
    new Captured_1.default('civ2-city:city/captured/reassign-workers', new Effect_1.default((capturedCity) => {
        // A city `shrink` destroyed has released its tiles. Checked here, not in a `Criterion`: every `Criterion` is
        //  evaluated before any `Effect` runs.
        if (capturedCity.destroyed()) {
            return;
        }
        (0, assignWorkers_1.reassignWorkers)(capturedCity, playerWorldRegistry, cityGrowthRegistry, workedTileRegistry, specialistRegistry, availableSpecialistRegistry);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=captured.js.map