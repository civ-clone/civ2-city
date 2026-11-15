"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const capitalLink_1 = require("../../lib/capitalLink");
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Yields_1 = require("../../Yields");
const GameDifficultyRegistry_1 = require("@civ-clone/core-difficulty/GameDifficultyRegistry");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const corruption_1 = require("../../lib/corruption");
const Cost_1 = require("@civ-clone/core-city/Rules/Cost");
const Captured_1 = require("@civ-clone/core-city/Rules/Captured");
const Created_1 = require("@civ-clone/core-city-improvement/Rules/Created");
const Destroyed_1 = require("@civ-clone/core-city/Rules/Destroyed");
const Courthouse_1 = require("@civ-clone/base-city-improvement-courthouse/Courthouse");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const Low_1 = require("@civ-clone/core-rule/Priorities/Low");
const Palace_1 = require("@civ-clone/base-city-improvement-palace/Palace");
const TerrainChanged_1 = require("@civ-clone/core-world/Rules/TerrainChanged");
const UnitSupportProduction_1 = require("@civ-clone/base-city-yield-unit-support-production/UnitSupportProduction");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const celebrating_1 = require("../../lib/celebrating");
const government_1 = require("../../lib/government");
const isBarbarian_1 = require("@civ-clone/base-civilization-barbarian/isBarbarian");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const level_1 = require("@civ-clone/civ2-difficulty/level");
const reduceYields_1 = require("@civ-clone/core-yield/lib/reduceYields");
/** Whether the city is building the Palace (`cities[city].building == -IMP_PALACE`). */
const buildingPalace = (city, cityBuildRegistry) => {
    var _a;
    try {
        const Item = (_a = cityBuildRegistry.getByCity(city).building()) === null || _a === void 0 ? void 0 : _a.item();
        return (Item !== undefined &&
            (Item === Palace_1.default || Item.prototype instanceof Palace_1.default));
    }
    catch (e) {
        return false;
    }
};
/**
 * Civilization II's corruption and waste (`lib/corruption`), measured from the nearest Palace and, for waste, along
 *  the road to it (`lib/capitalLink`).
 */
const getRules = (dependencies = {}) => {
    const { cityBuildRegistry = CityBuildRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, gameDifficultyRegistry = GameDifficultyRegistry_1.instance, pendingEffectRegistry = core_pending_effect_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, capitalLink = new capitalLink_1.default(dependencies), } = dependencies, 
    // `City#yields` hands its rules and costs the same array, so the nearest Palace is looked up once a call.
    capitals = new WeakMap(), capitalOf = (city, yields) => {
        if (!capitals.has(yields)) {
            capitals.set(yields, capitalLink.capital(city));
        }
        return capitals.get(yields);
    }, common = (city) => ({
        government: (0, government_1.default)(city.player(), playerGovernmentRegistry),
        human: (0, isHuman_1.default)(city.player(), clientRegistry),
        level: (0, level_1.levelOf)(gameDifficultyRegistry),
        capital: capitalLink.has(city, Palace_1.default),
        celebrating: (0, celebrating_1.default)(city, pendingEffectRegistry),
    });
    return [
        // `city_calc_trade_happiness`: corruption takes from the city's trade. Civ2 asks after its trade routes are added
        //  too; the Courthouse's halving is civ2-city-improvement's.
        new Yield_1.default('civ2-city:city/yield/corruption', new Priorities_1.High(), new Effect_1.default((city, yields) => {
            const { distance, nearest } = capitalOf(city, yields), input = common(city);
            return new Yields_1.Corruption((0, corruption_1.tradeCorruption)({
                ...input,
                amount: (0, reduceYields_1.reduceYield)(yields, Yields_1.Trade),
                distance,
            }), nearest === null && !input.capital ? 'no-capital' : String(distance));
        })),
        // `city_calc_shields_pollution`: waste takes from the city's shields, after the Factory's and the plants' bonuses
        //  (`YieldModifier`s) and its units' support (the other `Cost`s), so it comes last.
        new Cost_1.default('civ2-city:city/cost/waste', new Low_1.default(), new Effect_1.default((city, yields) => {
            const total = (include) => yields
                .filter(include)
                .reduce((sum, cityYield) => sum + cityYield.value(), 0), shields = total((cityYield) => cityYield instanceof Yields_1.Production &&
                !(cityYield instanceof UnitSupportProduction_1.default) &&
                !(cityYield instanceof Yields_1.Waste)), 
            // Support is a negative yield.
            support = -total((cityYield) => cityYield instanceof UnitSupportProduction_1.default), { distance, nearest, link } = capitalLink.of(city, capitalOf(city, yields)), waste = (0, corruption_1.shieldWaste)({
                ...common(city),
                courthouse: capitalLink.has(city, Courthouse_1.default),
                distance,
                shields,
                support,
                link,
                barbarian: (0, isBarbarian_1.default)(city.player()),
                buildingPalaceWithNoCapital: nearest === null && buildingPalace(city, cityBuildRegistry),
            });
            return waste > 0 ? [new Yields_1.Waste(waste, `link-${link}`)] : [];
        })),
        // The capital link's cost grids follow the land.
        new TerrainChanged_1.default('civ2-city:capital-link/terrain-changed', new Effect_1.default(() => capitalLink.invalidate())),
        // A Palace built, or a city with one captured or destroyed, changes the turn's capitals and links.
        new Created_1.default('civ2-city:capital-link/city-improvement-created', new Effect_1.default(() => capitalLink.invalidateCapitals())),
        new Captured_1.default('civ2-city:capital-link/captured', new Effect_1.default(() => capitalLink.invalidateCapitals())),
        new Destroyed_1.default('civ2-city:capital-link/destroyed', new Effect_1.default(() => capitalLink.invalidateCapitals())),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=corruption.js.map