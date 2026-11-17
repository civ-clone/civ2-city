import {
  TradeRouteRegistry,
  instance as tradeRouteRegistryInstance,
} from '@civ-clone/core-city/TradeRouteRegistry';
import BaseTrades from '../../lib/baseTrades';
import { computingBaseTrade } from '@civ-clone/base-city-trade-route/lib/baseTrade';
import { routeIncome, tradeRoutesPerCity } from '../../lib/tradeRoutes';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import CapitalLink from '../../lib/capitalLink';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import Effect from '@civ-clone/core-rule/Effect';
import Priority from '@civ-clone/core-rule/Priority';
import Superhighways from '@civ-clone/base-city-improvement-superhighways/Superhighways';
import { Trade } from '../../Yields';
import TradeRouteLimit from '@civ-clone/base-city-trade-route/Rules/TradeRouteLimit';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import { removeTradeRoutes } from '@civ-clone/base-city-trade-route/lib/removeTradeRoutes';
import { tradeRouteYields } from '@civ-clone/base-city-trade-route/lib/tradeRouteYields';

export interface TradeRouteRuleDependencies {
  /**
   * The capital link shared with the corruption rules (`Rules/City/corruption`), whose rules keep it up to date: one
   *  that no such rule invalidates would keep a turn's links all turn, whatever is built.
   */
  capitalLink: CapitalLink;
  /** The cities' kept base trade (`lib/baseTrades`); one is made on `capitalLink` otherwise. */
  baseTrades?: BaseTrades;
  tradeRouteRegistry?: TradeRouteRegistry;
}

/**
 * Civilization II's trade routes in a city (OpenCiv2 `src/auto/city.cpp`, richardpenman/civ2@e39fe7b): what each route
 *  gives every turn (`lib/tradeRoutes`'s `routeIncome`), three routes a city, and none left to or from a city that's
 *  gone. A captured city keeps its routes (`city_delete` alone clears them, `city.cpp:1335-1342`).
 */
export const getRules = ({
  capitalLink,
  baseTrades = new BaseTrades(capitalLink),
  tradeRouteRegistry = tradeRouteRegistryInstance,
}: TradeRouteRuleDependencies): (YieldRule | TradeRouteLimit | Destroyed)[] => [
  // `city_calc_trade_happiness` (`city.cpp:3667-3690`): each route adds trade worked out from both cities' trade after
  //  corruption without their routes (`base_trade`), after the worked squares (`Priority(0)`) and before corruption
  //  (`High`), which the original works out again on the total. This city's is worked out now (and kept); a partner's
  //  is the one it kept at its last recalculation (`lib/baseTrades`), as the original reads it. The link is worked out
  //  once a turn and again when the map changes (`CapitalLink#routeLink`). Each yield's provider is the partner's id,
  //  which is how the renderer finds a route's trade. Left out while a `baseTrade` is being worked out, so cities routed
  //  to each other don't recurse.
  new YieldRule(
    'civ2-city:city/yield/trade-routes',
    new Priority(500),
    new Criterion((): boolean => !computingBaseTrade()),
    new Criterion(
      (city: City): boolean => tradeRouteRegistry.getByCity(city).length > 0
    ),
    new Effect((city: City, yields: Yield[]): Yield[] => {
      const base = baseTrades.fresh(city),
        player = city.player();

      return tradeRouteYields(
        city,
        yields,
        Trade,
        (partner: City): number =>
          routeIncome({
            base,
            partnerBase: baseTrades.of(partner),
            link: capitalLink.routeLink(player, city.tile(), partner.tile()),
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

  new TradeRouteLimit(
    'civ2-city:city/trade-route-limit',
    new Effect((): number => tradeRoutesPerCity)
  ),

  // `city_delete` (`city.cpp:1335-1342`): the routes held by a destroyed city and those held to it go.
  new Destroyed(
    'civ2-city:city/destroyed/trade-routes',
    new Effect((city: City): void =>
      removeTradeRoutes(city, tradeRouteRegistry)
    )
  ),
];

export default getRules;
