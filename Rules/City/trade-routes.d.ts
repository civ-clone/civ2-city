import { TradeRouteRegistry } from '@civ-clone/core-city/TradeRouteRegistry';
import CapitalLink from '../../lib/capitalLink';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import TradeRouteLimit from '@civ-clone/base-city-trade-route/Rules/TradeRouteLimit';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
export interface TradeRouteRuleDependencies {
  /** The capital link to share with the corruption rules, whose rules keep it up to date. */
  capitalLink?: CapitalLink;
  tradeRouteRegistry?: TradeRouteRegistry;
}
/**
 * Civilization II's trade routes in a city (OpenCiv2 `src/auto/city.cpp`, richardpenman/civ2@e39fe7b): what each route
 *  gives every turn (`lib/tradeRoutes`'s `routeIncome`), three routes a city, and none left to or from a city that's
 *  gone. A captured city keeps its routes (`city_delete` alone clears them, `city.cpp:1335-1342`).
 */
export declare const getRules: ({
  capitalLink,
  tradeRouteRegistry,
}?: TradeRouteRuleDependencies) => (YieldRule | TradeRouteLimit | Destroyed)[];
export default getRules;
