"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.inciterBecomesFounder = exports.incitedPriority = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const flags_1 = require("@civ-clone/civ2-diplomacy/lib/flags");
const Captured_1 = require("@civ-clone/core-city/Rules/Captured");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const InciteRevolt_1 = require("@civ-clone/base-unit-action-incite-revolt/InciteRevolt");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const SubvertCity_1 = require("@civ-clone/base-unit-action-incite-revolt/SubvertCity");
const espionage_1 = require("@civ-clone/civ2-diplomacy/lib/espionage");
const isBarbarian_1 = require("@civ-clone/base-civilization-barbarian/isBarbarian");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const core_random_1 = require("@civ-clone/core-random");
const founder_1 = require("../../lib/founder");
/** Before every other rule of a capture (`High` is 1000), as the original's aftermath starts with them. */
exports.incitedPriority = 100;
/**
 * At the doubled price the inciter becomes `city`'s founder before the city changes hands (`unit_spy.cpp:843`), so
 *  its capture is a liberation (`was_founder`, `city.cpp:5407`): no Partisans, no buildings lost, no citizen lost at
 *  size 1. Call it from the `RevoltIncited` rule that captures the city, just before `City#capture`: a `Captured`
 *  rule would be too late, as every `Criterion` of a capture is asked before any `Effect` runs. The capture then
 *  makes the loser the founder, as every capture does (`lib/captureAftermath`'s `founder` rule, `city.cpp:5538`).
 */
const inciterBecomesFounder = (city, inciter, dependencies = {}) => (0, founder_1.recordCapture)(city, inciter, dependencies);
exports.inciterBecomesFounder = inciterBecomesFounder;
/**
 * A city taken by a Diplomat or Spy, and what any capture does between the two players (OpenCiv2
 *  richardpenman/civ2@e39fe7b):
 * - **the price** (`unit_spy.cpp:835-846`, `city.cpp:5404`): at the plain price, an incident and a forced war; at the
 *   doubled price (`SubvertCity`, offered under a treaty), the victim holds a vendetta instead (civ2-diplomacy's
 *   `incited`);
 * - **the founder**: `inciterBecomesFounder`, for the rule that captures the city;
 * - **the incident** (`city.cpp:5410-5413`): any capture with a person on either side sets `INCIDENT` both ways (the
 *   original also asks that no spaceship has been launched, and there is none yet). A Barbarian's captures set
 *   nothing: no diplomacy is kept with them.
 */
const getRules = ({ diplomacy, engine = Engine_1.instance, randomNumberGenerator = core_random_1.instance, }) => [
    new Captured_1.default('civ2-city:city/captured/incited', new Priority_1.default(exports.incitedPriority), new Criterion_1.default((city, captor, loser, cause) => cause instanceof InciteRevolt_1.default), new Effect_1.default((city, captor, loser, cause) => (0, espionage_1.incited)(diplomacy, captor, loser, cause instanceof SubvertCity_1.default, randomNumberGenerator, { engine }))),
    new Captured_1.default('civ2-city:city/captured/incident', new Priority_1.default(exports.incitedPriority), new Criterion_1.default((city, captor, loser) => captor !== loser &&
        !(0, isBarbarian_1.default)(captor) &&
        !(0, isBarbarian_1.default)(loser) &&
        ((0, isHuman_1.default)(captor, diplomacy.clientRegistry) ||
            (0, isHuman_1.default)(loser, diplomacy.clientRegistry))), new Effect_1.default((city, captor, loser) => (0, flags_1.setBoth)(diplomacy, captor, loser, flags_1.INCIDENT))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=incited.js.map