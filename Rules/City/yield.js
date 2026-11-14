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
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const Palace_1 = require("@civ-clone/base-city-improvement-palace/Palace");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const government_1 = require("../../lib/government");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const level_1 = require("@civ-clone/civ2-difficulty/level");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
const corruption_1 = require("../../lib/corruption");
const getRules = (cityImprovementRegistry = CityImprovementRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, gameDifficultyRegistry = GameDifficultyRegistry_1.instance, clientRegistry = ClientRegistry_1.instance) => [
    // Corruption takes from the city's trade (`lib/corruption`), measured from its player's Palace by the world's own
    //  distance.
    new Yield_1.default('civ2-city:city/yield/corruption', new Priorities_1.High(), new Effect_1.default((city, yields) => {
        const [capital] = cityImprovementRegistry
            .filter((cityImprovement) => cityImprovement instanceof Palace_1.default &&
            // A Palace is destroyed when its city is captured, but stays registered: it's no one's capital.
            !cityImprovement.destroyed() &&
            city.player() === cityImprovement.city().player())
            .map((cityImprovement) => cityImprovement.city()), distance = capital
            ? Math.round(capital.tile().distanceFrom(city.tile()))
            : null;
        return new Yields_1.Corruption((0, corruption_1.default)({
            amount: (0, reduceYields_1.reduceYield)(yields, Yields_1.Trade),
            government: (0, government_1.default)(city.player(), playerGovernmentRegistry),
            distance,
            human: (0, isHuman_1.default)(city.player(), clientRegistry),
            level: (0, level_1.levelOf)(gameDifficultyRegistry),
            capital: capital === city,
        }), distance === null ? 'no-capital' : String(distance));
    })),
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