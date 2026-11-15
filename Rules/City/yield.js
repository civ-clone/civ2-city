"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const Yields_1 = require("../../Yields");
const Specialists_1 = require("../../Specialists");
const GameDifficultyRegistry_1 = require("@civ-clone/core-difficulty/GameDifficultyRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const cityRules_1 = require("../../data/cityRules");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const getRules = (cityImprovementRegistry = CityImprovementRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, gameDifficultyRegistry = GameDifficultyRegistry_1.instance, clientRegistry = ClientRegistry_1.instance) => [
    new Yield_1.default('civ2-city:city/yield/worked-tiles', new Priority_1.default(0), // X High
    new Effect_1.default((city) => city
        .tilesWorked()
        .entries()
        .flatMap((tile) => tile.yields(city.player()).flatMap((tileYield) => new tileYield.constructor(tileYield.value(), tile.id() +
        ': ' +
        tileYield
            .values()
            .map(([, provider]) => provider)
            .join('-')))))),
    // Each specialist's yield, before improvements (`data/cityRules`).
    ...[
        [Specialists_1.Entertainer, Yields_1.Luxuries, cityRules_1.entertainerLuxuries],
        [Specialists_1.TaxCollector, Yields_1.Gold, cityRules_1.taxCollectorGold],
        [Specialists_1.Scientist, Yields_1.Research, cityRules_1.scientistResearch],
    ].map(([SpecialistType, YieldType, value]) => new Yield_1.default(`civ2-city:city/yield/specialist/${SpecialistType.name}`, new Criterion_1.default((city) => specialistRegistry
        .getByCity(city)
        .some((specialist) => specialist instanceof SpecialistType)), new Effect_1.default((city) => new YieldType(specialistRegistry
        .getByCity(city)
        .filter((specialist) => specialist instanceof SpecialistType)
        .length * value, SpecialistType.name)))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=yield.js.map