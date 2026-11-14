"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const AvailableCityBuildItemsRegistry_1 = require("@civ-clone/core-city-build/AvailableCityBuildItemsRegistry");
const AvailableSpecialistRegistry_1 = require("@civ-clone/core-city/AvailableSpecialistRegistry");
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const PlayerWorldRegistry_1 = require("@civ-clone/core-player-world/PlayerWorldRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const created_1 = require("@civ-clone/base-city-lifecycle/lib/created");
const Created_1 = require("@civ-clone/core-city/Rules/Created");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Irrigation_1 = require("@civ-clone/base-tile-improvement-irrigation/Irrigation");
const Road_1 = require("@civ-clone/base-tile-improvement-road/Road");
const getRules = (tileImprovementRegistry = TileImprovementRegistry_1.instance, cityBuildRegistry = CityBuildRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, cityRegistry = CityRegistry_1.instance, playerWorldRegistry = PlayerWorldRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, availableBuildItemsRegistry = AvailableCityBuildItemsRegistry_1.instance, engine = Engine_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, availableSpecialistRegistry = AvailableSpecialistRegistry_1.instance) => [
    // A city's square counts as irrigated and has a road (OpenCiv2 `src/auto/city.cpp` `city_tile_yield`,
    //  richardpenman/civ2@49f26ec). Given as the improvements themselves, as Civ1's are: the square of a city on terrain
    //  that can't be irrigated (where Civ2 counts it as mined) and the centre's farmland aren't modelled yet.
    ...[Irrigation_1.default, Road_1.default].map((TileImprovementType) => new Created_1.default(`civ2-city:city/created/add-improvement/${TileImprovementType.name}`, new Criterion_1.default((city) => tileImprovementRegistry
        .getByTile(city.tile())
        .every((tileImprovement) => !(tileImprovement instanceof TileImprovementType))), new Effect_1.default((city) => tileImprovementRegistry.register(new TileImprovementType(city.tile()))))),
    new Created_1.default('civ2-city:city/created/register-city-build', new Effect_1.default((city) => {
        (0, created_1.registerCityBuild)(city, cityBuildRegistry, availableBuildItemsRegistry, ruleRegistry);
    })),
    new Created_1.default('civ2-city:city/created/register-city-growth', new Effect_1.default((city) => {
        (0, created_1.registerCityGrowth)(city, cityGrowthRegistry, ruleRegistry);
    })),
    new Created_1.default('civ2-city:city/created/register', new Effect_1.default((city) => cityRegistry.register(city))),
    new Created_1.default('civ2-city:city/created/emit', new Effect_1.default((city) => {
        engine.emit('city:created', city);
    })),
    new Created_1.default('civ2-city:city/created/work-city-tile', new Effect_1.default((city) => (0, created_1.workCityTile)(city, ruleRegistry, playerWorldRegistry, cityGrowthRegistry, workedTileRegistry, specialistRegistry, availableSpecialistRegistry))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=created.js.map