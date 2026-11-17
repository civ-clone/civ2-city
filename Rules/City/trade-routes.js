"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const TradeRouteRegistry_1 = require("@civ-clone/core-city/TradeRouteRegistry");
const baseTrade_1 = require("../../lib/baseTrade");
const tradeRoutes_1 = require("../../lib/tradeRoutes");
const Airport_1 = require("@civ-clone/base-city-improvement-airport/Airport");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Destroyed_1 = require("@civ-clone/core-city/Rules/Destroyed");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const ProcessYield_1 = require("@civ-clone/core-city/Rules/ProcessYield");
const Superhighways_1 = require("@civ-clone/base-city-improvement-superhighways/Superhighways");
const Yields_1 = require("../../Yields");
const TradeRouteLimit_1 = require("@civ-clone/base-city-trade-route/Rules/TradeRouteLimit");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const baseTrade_2 = require("@civ-clone/base-city-trade-route/lib/baseTrade");
const removeTradeRoutes_1 = require("@civ-clone/base-city-trade-route/lib/removeTradeRoutes");
const tradeRouteYields_1 = require("@civ-clone/base-city-trade-route/lib/tradeRouteYields");
/**
 * Civilization II's trade routes in a city (OpenCiv2 `src/auto/city.cpp`, richardpenman/civ2@e39fe7b): what each route
 *  gives every turn (`lib/tradeRoutes`'s `routeIncome`), three routes a city, each city's base trade kept at its
 *  processing (`lib/baseTrade`), and none left to or from a city that's gone. A captured city keeps its routes
 *  (`city_delete` alone clears them, `city.cpp:1335-1342`).
 */
const getRules = ({ capitalLink, pendingEffectRegistry = core_pending_effect_1.instance, tradeRouteRegistry = TradeRouteRegistry_1.instance, }) => [
    // `city_calc_trade_happiness` (`city.cpp:3667-3690`): each route adds trade worked out from this city's trade after
    //  corruption without its routes, worked out now, and its partner's as the partner kept it at its last processing
    //  (`base_trade`, `lib/baseTrade`), after the worked squares (`Priority(0)`) and before corruption (`High`), which
    //  the original works out again on the total. The link is walked each time, as `map_road_connection` is. Each
    //  yield's provider is the partner's id, which is how the renderer finds a route's trade. Left out while a
    //  `baseTrade` is being worked out, so cities routed to each other don't recurse.
    new Yield_1.default('civ2-city:city/yield/trade-routes', new Priority_1.default(500), new Criterion_1.default(() => !(0, baseTrade_2.computingBaseTrade)()), new Criterion_1.default((city) => tradeRouteRegistry.getByCity(city).length > 0), new Effect_1.default((city, yields) => {
        const base = (0, baseTrade_1.liveBaseTrade)(city), player = city.player();
        return (0, tradeRouteYields_1.tradeRouteYields)(city, yields, Yields_1.Trade, (partner) => (0, tradeRoutes_1.routeIncome)({
            base,
            partnerBase: (0, baseTrade_1.baseTradeOf)(partner, { pendingEffectRegistry }),
            link: capitalLink.connection(player, city.tile(), partner.tile()),
            airports: capitalLink.has(city, Airport_1.default) &&
                capitalLink.has(partner, Airport_1.default),
            superhighways: capitalLink.has(city, Superhighways_1.default),
            domestic: partner.player() === player,
        }), tradeRouteRegistry);
    })),
    // `city_process_turn`'s `city_recalc` (`city.cpp:4470`) keeps the city's `base_trade`: here, as its trade is
    //  processed at the start of its player's turn, and nowhere else.
    new ProcessYield_1.default('civ2-city:city/process-yield/base-trade', new Criterion_1.default((cityYield) => cityYield instanceof Yields_1.Trade), new Effect_1.default((cityYield, city) => {
        (0, baseTrade_1.storeBaseTrade)(city, { pendingEffectRegistry });
    })),
    new TradeRouteLimit_1.default('civ2-city:city/trade-route-limit', new Effect_1.default(() => tradeRoutes_1.tradeRoutesPerCity)),
    // `city_delete` (`city.cpp:1335-1342`): the routes held by a destroyed city and those held to it go, and so does
    //  its kept base trade.
    new Destroyed_1.default('civ2-city:city/destroyed/trade-routes', new Effect_1.default((city) => {
        (0, removeTradeRoutes_1.removeTradeRoutes)(city, tradeRouteRegistry);
        (0, baseTrade_1.forgetBaseTrade)(city, { pendingEffectRegistry });
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=trade-routes.js.map