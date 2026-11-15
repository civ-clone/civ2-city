"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.totalOf = exports.laterSquareSteps = void 0;
const governmentTileYield_1 = require("@civ-clone/civ2-world/lib/governmentTileYield");
const Yields_1 = require("../../Yields");
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const terrainTable_1 = require("@civ-clone/civ2-world/lib/terrainTable");
const CityTileYield_1 = require("@civ-clone/core-city/Rules/CityTileYield");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Mine_1 = require("@civ-clone/base-tile-improvement-mine/Mine");
const Pollution_1 = require("@civ-clone/base-tile-improvement-pollution/Pollution");
const Railroad_1 = require("@civ-clone/base-tile-improvement-railroad/Railroad");
const Railroad_2 = require("@civ-clone/base-science-advance-railroad/Railroad");
const celebrating_1 = require("../../lib/celebrating");
const government_1 = require("../../lib/government");
const tileYieldPipeline_1 = require("../../lib/tileYieldPipeline");
/**
 * The providers of the yields civ2-world's square rules add after the road (`Rules/Tile/yield-modifier`): the railroad,
 *  the government's penalty and bonus, and pollution. A city takes them out and works them out again in its own place
 *  in the order, after its buildings' and Wonders' steps.
 */
exports.laterSquareSteps = [
    Railroad_1.default.name,
    governmentTileYield_1.DESPOTISM_PENALTY,
    governmentTileYield_1.TRADE_BONUS,
    Pollution_1.default.name,
];
/** What `yields` add up to of `YieldType`. */
const totalOf = (yields, YieldType) => yields.reduce((total, tileYield) => tileYield instanceof YieldType ? total + tileYield.value() : total, 0);
exports.totalOf = totalOf;
const has = (tile, Improvement, tileImprovementRegistry) => tileImprovementRegistry
    .getByTile(tile)
    .some((improvement) => improvement instanceof Improvement);
const knows = (city, AdvanceType, playerResearchRegistry) => {
    try {
        return playerResearchRegistry
            .getByPlayer(city.player())
            .completed(AdvanceType);
    }
    catch (e) {
        // A player with no research yet (one being set up) knows nothing.
        return false;
    }
};
const change = (yields, YieldType, value, provider) => {
    if (value !== 0) {
        yields.push(new YieldType(value, provider));
    }
};
/**
 * civ2-city's steps of what a square gives the city working it, each at its place in OpenCiv2 `src/auto/city.cpp`
 *  `city_tile_yield` (richardpenman/civ2@49f26ec, from line 2796; `lib/tileYieldPipeline` has the whole order and
 *  which package registers each step). civ2-world's square rules give a square's own yields, through its road and on
 *  to its railroad, government and pollution steps, for a square worked by no city. For a city, the first rule here
 *  takes those last steps out again, the city's buildings and Wonders add theirs (civ2-city-improvement, civ2-wonder),
 *  and the rules here then run the railroad, government and pollution steps on the result.
 */
const getRules = (tileImprovementRegistry = TileImprovementRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, pendingEffectRegistry = core_pending_effect_1.instance) => [
    // The square's own yields, up to its road (lines 2826–2888): without the railroad, government and pollution yields.
    new CityTileYield_1.default('civ2-city:city/tile-yield/square', (0, tileYieldPipeline_1.tileYieldPriority)('square'), new Effect_1.default((city, tile, yields) => {
        for (let index = yields.length - 1; index >= 0; index--) {
            const [first] = yields[index].values();
            if (first && exports.laterSquareSteps.includes(first[1])) {
                yields.splice(index, 1);
            }
        }
    })),
    // The city's own square counts as mined where its terrain has no irrigation bonus (lines 2863–2865: `TILE_CITY` and
    //  `irrigate_bonus == 0`), unless it has a mine already, which civ2-world's square rules count.
    new CityTileYield_1.default('civ2-city:city/tile-yield/centre-mine', (0, tileYieldPipeline_1.tileYieldPriority)('centreMine'), new Criterion_1.default((city, tile) => tile === city.tile()), new Criterion_1.default((city, tile) => {
        const index = (0, terrainTable_1.terrainIndex)(tile.terrain());
        return (index >= 0 &&
            (0, terrainTable_1.terrainRow)(index)[5][1] === 0 &&
            (0, terrainTable_1.terrainRow)(index)[6][1] > 0);
    }), new Criterion_1.default((city, tile) => !has(tile, Mine_1.default, tileImprovementRegistry)), new Effect_1.default((city, tile, yields) => change(yields, Yields_1.Production, (0, terrainTable_1.terrainRow)((0, terrainTable_1.terrainIndex)(tile.terrain()))[6][1], Mine_1.default.name))),
    // The city's own square gives at least 1 shield (lines 2873–2875: tile index 20 with no shields).
    new CityTileYield_1.default('civ2-city:city/tile-yield/centre-minimum', (0, tileYieldPipeline_1.tileYieldPriority)('centreMinimum'), new Criterion_1.default((city, tile) => tile === city.tile()), new Criterion_1.default((city, tile, yields) => (0, exports.totalOf)(yields, Yields_1.Production) === 0), new Effect_1.default((city, tile, yields) => change(yields, Yields_1.Production, 1, 'civ2-city:city-square'))),
    // Half again of the shields, rounded down, on a railroad, or on the city's square once its player knows Railroad
    //  (lines 2897–2907).
    new CityTileYield_1.default('civ2-city:city/tile-yield/railroad', (0, tileYieldPipeline_1.tileYieldPriority)('railroad'), new Criterion_1.default((city, tile) => has(tile, Railroad_1.default, tileImprovementRegistry) ||
        (tile === city.tile() &&
            knows(city, Railroad_2.default, playerResearchRegistry))), new Effect_1.default((city, tile, yields) => change(yields, Yields_1.Production, (0, exports.totalOf)(yields, Yields_1.Production) >> 1, Railroad_1.default.name))),
    // Below Monarchy, a yield over 2 loses 1, unless the city celebrates (lines 2909–2917).
    ...[Yields_1.Food, Yields_1.Production, Yields_1.Trade].map((YieldType) => new CityTileYield_1.default(`civ2-city:city/tile-yield/government-penalty/${YieldType.name}`, (0, tileYieldPipeline_1.tileYieldPriority)('governmentPenalty'), new Criterion_1.default((city) => (0, government_1.default)(city.player(), playerGovernmentRegistry) < governments_1.MONARCHY), new Criterion_1.default((city, tile, yields) => (0, exports.totalOf)(yields, YieldType) > 2), new Criterion_1.default((city) => !(0, celebrating_1.default)(city, pendingEffectRegistry)), new Effect_1.default((city, tile, yields) => change(yields, YieldType, -1, governmentTileYield_1.DESPOTISM_PENALTY)))),
    // Any trade gains 1 under the Republic and Democracy, or from Monarchy up while the city celebrates (lines
    //  2918–2925).
    new CityTileYield_1.default('civ2-city:city/tile-yield/trade-bonus', (0, tileYieldPipeline_1.tileYieldPriority)('tradeBonus'), new Criterion_1.default((city, tile, yields) => (0, exports.totalOf)(yields, Yields_1.Trade) !== 0), new Criterion_1.default((city) => (0, government_1.default)(city.player(), playerGovernmentRegistry) >=
        ((0, celebrating_1.default)(city, pendingEffectRegistry) ? governments_1.MONARCHY : governments_1.REPUBLIC)), new Effect_1.default((city, tile, yields) => change(yields, Yields_1.Trade, 1, governmentTileYield_1.TRADE_BONUS))),
    // Pollution halves each yield, rounded up (lines 2930–2936).
    ...[Yields_1.Food, Yields_1.Production, Yields_1.Trade].map((YieldType) => new CityTileYield_1.default(`civ2-city:city/tile-yield/pollution/${YieldType.name}`, (0, tileYieldPipeline_1.tileYieldPriority)('pollution'), new Criterion_1.default((city, tile) => has(tile, Pollution_1.default, tileImprovementRegistry)), new Effect_1.default((city, tile, yields) => {
        const total = (0, exports.totalOf)(yields, YieldType);
        change(yields, YieldType, ((total + 1) >> 1) - total, Pollution_1.default.name);
    }))),
    // Nothing below 0 (lines 2937–2939).
    ...[Yields_1.Food, Yields_1.Production, Yields_1.Trade].map((YieldType) => new CityTileYield_1.default(`civ2-city:city/tile-yield/floor/${YieldType.name}`, (0, tileYieldPipeline_1.tileYieldPriority)('floor'), new Criterion_1.default((city, tile, yields) => (0, exports.totalOf)(yields, YieldType) < 0), new Effect_1.default((city, tile, yields) => change(yields, YieldType, -(0, exports.totalOf)(yields, YieldType), 'civ2-city:floor')))),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=tile-yield.js.map