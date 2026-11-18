"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const core_game_1 = require("@civ-clone/core-game");
const auto_build_1 = require("./Rules/City/auto-build");
const build_priority_1 = require("./Rules/City/build-priority");
const building_cancelled_1 = require("./Rules/City/building-cancelled");
const building_complete_1 = require("./Rules/City/building-complete");
const build_1 = require("./Rules/City/build");
const building_held_1 = require("./Rules/City/building-held");
const can_be_worked_1 = require("./Rules/City/can-be-worked");
const captured_1 = require("./Rules/City/captured");
const corruption_1 = require("./Rules/City/corruption");
const cost_1 = require("./Rules/City/cost");
const created_1 = require("./Rules/City/created");
const destroyed_1 = require("./Rules/City/destroyed");
const food_exhausted_1 = require("./Rules/City/food-exhausted");
const food_storage_1 = require("./Rules/City/food-storage");
const grow_1 = require("./Rules/City/grow");
const growth_cost_1 = require("./Rules/City/growth-cost");
const process_yield_1 = require("./Rules/City/process-yield");
const renamed_1 = require("./Rules/City/renamed");
const shrink_1 = require("./Rules/City/shrink");
const tile_reassigned_1 = require("./Rules/City/tile-reassigned");
const tile_released_1 = require("./Rules/City/tile-released");
const tile_worked_1 = require("./Rules/City/tile-worked");
const specialist_available_1 = require("./Rules/City/specialist-available");
const tile_yield_1 = require("./Rules/City/tile-yield");
const tiles_1 = require("./Rules/City/tiles");
const trade_routes_1 = require("./Rules/City/trade-routes");
const capitalLink_1 = require("./lib/capitalLink");
const allied_1 = require("./lib/allied");
const incited_1 = require("./Rules/City/incited");
const dependenciesOf_1 = require("@civ-clone/civ2-diplomacy/lib/dependenciesOf");
const trade_route_established_1 = require("./Rules/Unit/trade-route-established");
const yield_1 = require("./Rules/City/yield");
const terms_1 = require("./Rules/Government/terms");
const action_1 = require("./Rules/Player/action");
const turn_start_1 = require("./Rules/Player/turn-start");
const registerAvailableSpecialists_1 = require("./registerAvailableSpecialists");
const defeated_1 = require("./Rules/Unit/defeated");
const moved_1 = require("./Rules/Unit/moved");
const unsupported_1 = require("./Rules/Unit/unsupported");
const register = (game) => {
    (0, registerAvailableSpecialists_1.default)(game.availableSpecialists);
    // One capital link for corruption and the trade routes: the corruption rules keep it up to date.
    const capitalLink = new capitalLink_1.default({
        cityImprovementRegistry: game.cityImprovements,
        cityRegistry: game.cities,
        landMassRegistry: game.landMasses,
        playerResearchRegistry: game.playerResearch,
        tileImprovementRegistry: game.tileImprovements,
        turn: game.turn,
        unitRegistry: game.units,
        allied: (0, allied_1.default)(game.interactions),
    });
    game.rules.register(...(0, building_cancelled_1.default)(game.engine), ...(0, building_complete_1.default)(game.engine), ...(0, building_held_1.default)(game.engine), ...(0, auto_build_1.default)({
        cityBuildRegistry: game.cityBuilds,
        cityRegistry: game.cities,
        pendingEffectRegistry: game.pendingEffects,
        ruleRegistry: game.rules,
    }), ...(0, build_priority_1.default)({
        cityBuildRegistry: game.cityBuilds,
        cityGrowthRegistry: game.cityGrowth,
        cityImprovementRegistry: game.cityImprovements,
        cityRegistry: game.cities,
        clientRegistry: game.clients,
        gameDifficultyRegistry: game.difficulty,
        interactionRegistry: game.interactions,
        landMassRegistry: game.landMasses,
        pendingEffectRegistry: game.pendingEffects,
        playerGovernmentRegistry: game.playerGovernments,
        playerRegistry: game.players,
        playerResearchRegistry: game.playerResearch,
        playerTradeRatesRegistry: game.playerTradeRates,
        ruleRegistry: game.rules,
        specialistRegistry: game.specialists,
        tileImprovementRegistry: game.tileImprovements,
        unitRegistry: game.units,
        wonderRegistry: game.wonders,
    }), ...(0, can_be_worked_1.default)(game.cities, game.units, game.workedTiles), ...(0, captured_1.default)(game.units, game.cityGrowth, game.cityBuilds, game.engine, game.playerWorlds, game.workedTiles, game.specialists, game.availableSpecialists, {
        cityRegistry: game.cities,
        clientRegistry: game.clients,
        playerGovernmentRegistry: game.playerGovernments,
        playerRegistry: game.players,
        playerResearchRegistry: game.playerResearch,
        playerTreasuryRegistry: game.playerTreasuries,
        ruleRegistry: game.rules,
        tileImprovementRegistry: game.tileImprovements,
        unitImprovementRegistry: game.unitImprovements,
        randomNumberGenerator: game.rng,
        pendingEffectRegistry: game.pendingEffects,
        turn: game.turn,
    }), ...(0, corruption_1.default)({
        capitalLink,
        cityBuildRegistry: game.cityBuilds,
        cityImprovementRegistry: game.cityImprovements,
        cityRegistry: game.cities,
        clientRegistry: game.clients,
        gameDifficultyRegistry: game.difficulty,
        interactionRegistry: game.interactions,
        landMassRegistry: game.landMasses,
        pendingEffectRegistry: game.pendingEffects,
        playerGovernmentRegistry: game.playerGovernments,
        playerResearchRegistry: game.playerResearch,
        tileImprovementRegistry: game.tileImprovements,
        turn: game.turn,
        unitRegistry: game.units,
    }), ...(0, incited_1.default)({
        diplomacy: (0, dependenciesOf_1.default)(game),
        engine: game.engine,
        randomNumberGenerator: game.rng,
    }), ...(0, cost_1.default)(game.cityGrowth, game.playerGovernments, game.units, game.rules), ...(0, created_1.default)(game.tileImprovements, game.cityBuilds, game.cityGrowth, game.cities, game.playerWorlds, game.rules, game.availableCityBuildItems, game.engine, game.workedTiles, game.specialists, game.availableSpecialists), ...(0, destroyed_1.default)(game.tileImprovements, game.engine, game.units, game.workedTiles, game.specialists, game.rules, game.pendingEffects), ...(0, food_exhausted_1.default)(game.engine), ...(0, food_storage_1.default)(game.rules), ...(0, grow_1.default)(game.cityGrowth, game.playerWorlds, game.workedTiles, game.specialists, game.availableSpecialists, game.engine), ...(0, growth_cost_1.default)(game.difficulty, game.clients, {
        cityImprovementRegistry: game.cityImprovements,
        playerRegistry: game.players,
        playerResearchRegistry: game.playerResearch,
        ruleRegistry: game.rules,
        turn: game.turn,
        wonderRegistry: game.wonders,
    }), ...(0, process_yield_1.default)(game.cityBuilds, game.cityGrowth, game.units, game.rules, game.playerTreasuries, game.playerGovernments), ...(0, build_1.default)(game.clients, game.difficulty, game.rules), ...(0, specialist_available_1.default)(game.cityGrowth), ...(0, renamed_1.default)(game.cityNames), ...(0, shrink_1.default)(game.workedTiles, game.specialists, game.engine), ...(0, tile_yield_1.default)(game.tileImprovements, game.playerGovernments, game.playerResearch, game.pendingEffects), ...(0, tiles_1.default)(), ...(0, trade_routes_1.default)({
        capitalLink,
        pendingEffectRegistry: game.pendingEffects,
        ruleRegistry: game.rules,
        tradeRouteRegistry: game.tradeRoutes,
    }), ...(0, tile_reassigned_1.default)(game.playerWorlds, game.cityGrowth, game.workedTiles, game.specialists, game.availableSpecialists), ...(0, tile_released_1.default)(game.engine), ...(0, tile_worked_1.default)(game.engine), ...(0, yield_1.default)(game.cityImprovements, game.playerGovernments, game.specialists, game.difficulty, game.clients), ...(0, action_1.default)(game.cityBuilds, game.cities, game.specialists), ...(0, turn_start_1.default)(game.cities, game.units, game.workedTiles, game.rules), ...(0, defeated_1.default)(game.engine), ...(0, trade_route_established_1.default)({
        capitalLink,
        cityRegistry: game.cities,
        engine: game.engine,
        interactionRegistry: game.interactions,
        pendingEffectRegistry: game.pendingEffects,
        playerResearchRegistry: game.playerResearch,
        playerTreasuryRegistry: game.playerTreasuries,
        randomNumberGenerator: game.rng,
        ruleRegistry: game.rules,
        tradeRouteRegistry: game.tradeRoutes,
        turn: game.turn,
    }), ...(0, moved_1.default)(game.rules, game.workedTiles), ...(0, unsupported_1.default)());
    // For players to compare governments by: asked by nothing here.
    game.rules.register(...(0, terms_1.default)());
};
exports.register = register;
// The plugin loader imports each package for this side effect. Until it passes a `Game` of its own, dropping it would
//  produce a game with silently absent rules: no error, just wrong behaviour.
(0, exports.register)(core_game_1.defaultGame);
exports.default = exports.register;
//# sourceMappingURL=registerRules.js.map