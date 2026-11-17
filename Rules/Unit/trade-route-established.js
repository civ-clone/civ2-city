"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.tradeRouteGoods = exports.tradeRouteHome = void 0;
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const PlayerTreasuryRegistry_1 = require("@civ-clone/core-treasury/PlayerTreasuryRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TradeRouteRegistry_1 = require("@civ-clone/core-city/TradeRouteRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const addTradeRoute_1 = require("@civ-clone/base-city-trade-route/lib/addTradeRoute");
const tradeRoutes_1 = require("../../lib/tradeRoutes");
const Advance_1 = require("@civ-clone/core-science/Advance");
const Cost_1 = require("@civ-clone/core-science/Rules/Cost");
const mapSize_1 = require("@civ-clone/civ2-rules/lib/mapSize");
const Airport_1 = require("@civ-clone/base-city-improvement-airport/Airport");
const capitalLink_1 = require("../../lib/capitalLink");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Flight_1 = require("@civ-clone/base-science-advance-flight/Flight");
const Freight_1 = require("@civ-clone/base-unit-freight/Freight");
const Gold_1 = require("@civ-clone/base-city-yield-gold/Gold");
const Invention_1 = require("@civ-clone/base-science-advance-invention/Invention");
const Navigation_1 = require("@civ-clone/base-science-advance-navigation/Navigation");
const Railroad_1 = require("@civ-clone/base-science-advance-railroad/Railroad");
const Research_1 = require("@civ-clone/core-science/Yields/Research");
const Superhighways_1 = require("@civ-clone/base-city-improvement-superhighways/Superhighways");
const TradeRouteEstablished_1 = require("@civ-clone/base-unit-action-establish-trade-route/Rules/TradeRouteEstablished");
const relations_1 = require("@civ-clone/civ2-diplomacy/lib/relations");
const baseTrades_1 = require("../../lib/baseTrades");
const goods_1 = require("@civ-clone/base-city-trade-route/lib/goods");
const core_random_1 = require("@civ-clone/core-random");
const escape_1 = require("@civ-clone/base-unit-agent/lib/escape");
const tradeRouteLimit_1 = require("@civ-clone/base-city-trade-route/lib/tradeRouteLimit");
/**
 * The city a trade route runs from: the unit's home, or, with none, the deliverer's city nearest it
 *  (`unit_caravan_establish_trade`, `unit.cpp:694-699`), or `null` if it has none.
 */
const tradeRouteHome = (unit, cityRegistry = CityRegistry_1.instance) => { var _a; return (_a = unit.city()) !== null && _a !== void 0 ? _a : (0, escape_1.nearestCity)(unit, cityRegistry); };
exports.tradeRouteHome = tradeRouteHome;
/** The goods a unit carries: one of `lib/tradeRoutes`'s `goods`, picked by its id. */
const tradeRouteGoods = (unit) => (0, goods_1.goodsFor)(unit, tradeRoutes_1.goods);
exports.tradeRouteGoods = tradeRouteGoods;
/**
 * A Caravan or Freight arrives in a city to trade (`unit_caravan_establish_trade`, `unit.cpp:677-729`), for
 *  base-unit-action-establish-trade-route's `EstablishTradeRoute`, before the unit is used up. Its owner earns
 *  `deliveryBonus` (`lib/tradeRoutes`) in gold and as much again in research; each of the two players thinks better of
 *  the other by 10 (`civ_adjust_attitude`, −10 both ways, higher being worse); and the home city takes a route to the
 *  city, and the city one back (`city_add_trade_route` twice).
 *
 * Emits `unit:trade-route-established` with the player, the home city, the city, the goods and the bonus.
 */
const getRules = ({ capitalLink, baseTrades = new baseTrades_1.default(capitalLink), cityRegistry = CityRegistry_1.instance, engine = Engine_1.instance, interactionRegistry = InteractionRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerTreasuryRegistry = PlayerTreasuryRegistry_1.instance, randomNumberGenerator = core_random_1.instance, ruleRegistry = RuleRegistry_1.instance, tradeRouteRegistry = TradeRouteRegistry_1.instance, turn = Turn_1.instance, demanded = () => 0, }) => {
    const knows = (player, AdvanceType) => {
        try {
            return playerResearchRegistry
                .getByPlayer(player)
                .completed(AdvanceType);
        }
        catch (e) {
            return false;
        }
    }, 
    // `civ_research_cost`: what the next advance costs, asked of the `Cost` rules (civ2-science's is the same for
    //  every advance), as `PlayerResearch#cost()` is unset while nothing is being researched.
    researchCost = (player) => {
        var _a;
        try {
            const playerResearch = playerResearchRegistry.getByPlayer(player), costs = ruleRegistry
                .process(Cost_1.default, (_a = playerResearch.researching()) !== null && _a !== void 0 ? _a : Advance_1.default, playerResearch)
                .filter((cost) => Number.isFinite(cost));
            // The first finite answer, as `PlayerResearch#research` takes the first.
            return costs.length > 0 ? costs[0] : playerResearch.cost().value();
        }
        catch (e) {
            return Infinity;
        }
    }, airports = (city, other) => capitalLink.has(city, Airport_1.default) && capitalLink.has(other, Airport_1.default), 
    // `city_add_trade_route` (`city.cpp:1228-1290`): an empty slot is filled; in a full city the weakest route is
    //  replaced when it's worth no more than the new partner's base trade (unadjusted), the first on a tie. A route to
    //  a partner the city already trades with is dropped (the original allows a second one carrying other goods).
    addRoute = (holder, partner) => {
        (0, addTradeRoute_1.addTradeRoute)(holder, partner, {
            limit: (city) => (0, tradeRouteLimit_1.tradeRouteLimit)(city, ruleRegistry, tradeRoutes_1.tradeRoutesPerCity),
            replace: (city, routes, newPartner) => (0, addTradeRoute_1.replaceWeakest)((from, to) => to === newPartner
                ? baseTrades.of(to)
                : (0, tradeRoutes_1.routeWorth)({
                    partnerBase: baseTrades.of(to),
                    link: capitalLink.routeLink(from.player(), from.tile(), to.tile()),
                    airports: airports(from, to),
                    domestic: from.player() === to.player(),
                }), true)(city, routes, newPartner),
            tradeRouteRegistry,
        });
    }, adjustAttitude = (holder, toward) => {
        if (holder === toward) {
            return;
        }
        const attitudes = (0, relations_1.attitude)({ interactionRegistry, ruleRegistry, turn });
        // Only once they've met, which entering the city has made them.
        if (attitudes.get(holder, toward) === undefined) {
            return;
        }
        attitudes.adjust(holder, toward, -10, 'trade-route');
    };
    return [
        new TradeRouteEstablished_1.default('civ2-city:unit/trade-route-established/deliver', new Effect_1.default((unit, city) => {
            var _a;
            const home = (0, exports.tradeRouteHome)(unit, cityRegistry);
            // The original falls back on city 0, whoever's it is; a player with no city here earns nothing.
            if (home === null) {
                return;
            }
            const player = unit.player(), owner = city.player(), carried = (0, exports.tradeRouteGoods)(unit), 
            // Drawn every time, as the original draws it whatever the revenue (`unit.cpp:524`).
            roll = Math.floor(randomNumberGenerator() * 10), bonus = (0, tradeRoutes_1.deliveryBonus)({
                distance: (0, capitalLink_1.diagonalDistance)(home.tile(), city.tile()),
                mapSize: (0, mapSize_1.default)(city.tile().map().width() * city.tile().map().height()),
                destinationBase: baseTrades.fresh(city),
                homeBase: baseTrades.fresh(home),
                otherLandMass: capitalLink.landMass(home.tile()) !==
                    capitalLink.landMass(city.tile()),
                domestic: owner === player,
                freight: unit instanceof Freight_1.default,
                link: capitalLink.routeLink(player, city.tile(), home.tile()),
                airports: airports(city, home),
                destinationSuperhighways: capitalLink.has(city, Superhighways_1.default),
                homeSuperhighways: capitalLink.has(home, Superhighways_1.default),
                goodsIndex: tradeRoutes_1.goods.indexOf(carried),
                demanded: demanded(city, carried),
                turn: turn.value(),
                knowsInvention: knows(player, Invention_1.default),
                knowsNavigation: knows(player, Navigation_1.default),
                knowsRailroad: knows(player, Railroad_1.default),
                knowsFlight: knows(player, Flight_1.default),
                researchCost: researchCost(player),
                roll,
            });
            adjustAttitude(owner, player);
            adjustAttitude(player, owner);
            (_a = playerTreasuryRegistry
                .getByPlayer(player)
                .find((treasury) => treasury.yield() === Gold_1.default)) === null || _a === void 0 ? void 0 : _a.add(bonus);
            try {
                playerResearchRegistry
                    .getByPlayer(player)
                    .add(new Research_1.default(bonus, 'TradeRoute'));
            }
            catch (e) {
                // A player with no research (a Barbarian) has none to add to.
            }
            // The original would route a city to itself (a homeless unit whose nearest city is the one it enters); a route
            //  here always joins two cities.
            if (home !== city) {
                addRoute(home, city);
                addRoute(city, home);
            }
            engine.emit('unit:trade-route-established', player, home, city, carried, bonus);
        })),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=trade-route-established.js.map