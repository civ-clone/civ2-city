"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.specialistSize = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Specialists_1 = require("../../Specialists");
const SpecialistAvailable_1 = require("@civ-clone/base-city-lifecycle/Rules/SpecialistAvailable");
/** The size below which a city's specialists can only be Entertainers. */
exports.specialistSize = 5;
// A city below size 5 may only have Entertainers (OpenCiv2 `src/auto/city_window.cpp` ~432, richardpenman/civ2@49f26ec:
//  clicking a specialist in such a city makes it an Entertainer, or refuses if it is one). The game itself only makes
//  new specialists Entertainers (`city.cpp` `city_fill_specialists`), and a city that shrinks below 5 keeps the kinds it
//  has, so this only stops a change.
const getRules = (cityGrowthRegistry = CityGrowthRegistry_1.instance) => [
    new SpecialistAvailable_1.default('civ2-city:city/specialist-available/entertainers-below-5', new Criterion_1.default((city, SpecialistType) => SpecialistType !== Specialists_1.Entertainer), new Effect_1.default((city) => cityGrowthRegistry.getByCity(city).size() >= exports.specialistSize)),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=specialist-available.js.map