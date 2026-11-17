import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  TradeRouteRegistry,
  instance as tradeRouteRegistryInstance,
} from '@civ-clone/core-city/TradeRouteRegistry';
import {
  baseTradeOf,
  forgetBaseTrade,
  liveBaseTrade,
  storeBaseTrade,
} from '../../lib/baseTrade';
import { routeIncome, tradeRoutesPerCity } from '../../lib/tradeRoutes';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import CapitalLink from '../../lib/capitalLink';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import Effect from '@civ-clone/core-rule/Effect';
import Priority from '@civ-clone/core-rule/Priority';
import ProcessYield from '@civ-clone/core-city/Rules/ProcessYield';
import Superhighways from '@civ-clone/base-city-improvement-superhighways/Superhighways';
import { Trade } from '../../Yields';
import TradeRouteLimit from '@civ-clone/base-city-trade-route/Rules/TradeRouteLimit';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import { computingBaseTrade } from '@civ-clone/base-city-trade-route/lib/baseTrade';
import { removeTradeRoutes } from '@civ-clone/base-city-trade-route/lib/removeTradeRoutes';
import { tradeRouteYields } from '@civ-clone/base-city-trade-route/lib/tradeRouteYields';

export interface TradeRouteRuleDependencies {
  /**
   * The capital link shared with the corruption rules (`Rules/City/corruption`), whose rules keep it up to date: one
   *  that no such rule invalidates would keep a turn's Palaces all turn, whatever is built.
   */
  capitalLink: CapitalLink;
  /** Where each city's base trade is kept (`lib/baseTrade`). */
  pendingEffectRegistry?: PendingEffectRegistry;
  tradeRouteRegistry?: TradeRouteRegistry;
}

/**
 * Civilization II's trade routes in a city (OpenCiv2 `src/auto/city.cpp`, richardpenman/civ2@e39fe7b): what each route
 *  gives every turn (`lib/tradeRoutes`'s `routeIncome`), three routes a city, each city's base trade kept at its
 *  processing (`lib/baseTrade`), and none left to or from a city that's gone. A captured city keeps its routes
 *  (`city_delete` alone clears them, `city.cpp:1335-1342`).
 */
export const getRules = ({
  capitalLink,
  pendingEffectRegistry = pendingEffectRegistryInstance,
  tradeRouteRegistry = tradeRouteRegistryInstance,
}: TradeRouteRuleDependencies): (
  | YieldRule
  | ProcessYield
  | TradeRouteLimit
  | Destroyed
)[] => [
  // `city_calc_trade_happiness` (`city.cpp:3667-3690`): each route adds trade worked out from this city's trade after
  //  corruption without its routes, worked out now, and its partner's as the partner kept it at its last processing
  //  (`base_trade`, `lib/baseTrade`), after the worked squares (`Priority(0)`) and before corruption (`High`), which
  //  the original works out again on the total. The link is walked each time, as `map_road_connection` is. Each
  //  yield's provider is the partner's id, which is how the renderer finds a route's trade. Left out while a
  //  `baseTrade` is being worked out, so cities routed to each other don't recurse.
  new YieldRule(
    'civ2-city:city/yield/trade-routes',
    new Priority(500),
    new Criterion((): boolean => !computingBaseTrade()),
    new Criterion(
      (city: City): boolean => tradeRouteRegistry.getByCity(city).length > 0
    ),
    new Effect((city: City, yields: Yield[]): Yield[] => {
      const base = liveBaseTrade(city),
        player = city.player();

      return tradeRouteYields(
        city,
        yields,
        Trade,
        (partner: City): number =>
          routeIncome({
            base,
            partnerBase: baseTradeOf(partner, { pendingEffectRegistry }),
            link: capitalLink.connection(player, city.tile(), partner.tile()),
            airports:
              capitalLink.has(city, Airport) &&
              capitalLink.has(partner, Airport),
            superhighways: capitalLink.has(city, Superhighways),
            domestic: partner.player() === player,
          }),
        tradeRouteRegistry
      );
    })
  ),

  // `city_process_turn`'s `city_recalc` (`city.cpp:4470`) keeps the city's `base_trade`: here, as its trade is
  //  processed at the start of its player's turn, and nowhere else.
  new ProcessYield(
    'civ2-city:city/process-yield/base-trade',
    new Criterion((cityYield: Yield): boolean => cityYield instanceof Trade),
    new Effect((cityYield: Yield, city: City): void => {
      storeBaseTrade(city, { pendingEffectRegistry });
    })
  ),

  new TradeRouteLimit(
    'civ2-city:city/trade-route-limit',
    new Effect((): number => tradeRoutesPerCity)
  ),

  // `city_delete` (`city.cpp:1335-1342`): the routes held by a destroyed city and those held to it go, and so does
  //  its kept base trade.
  new Destroyed(
    'civ2-city:city/destroyed/trade-routes',
    new Effect((city: City): void => {
      removeTradeRoutes(city, tradeRouteRegistry);
      forgetBaseTrade(city, { pendingEffectRegistry });
    })
  ),
];

export default getRules;
