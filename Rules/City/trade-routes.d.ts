import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { TradeRouteRegistry } from '@civ-clone/core-city/TradeRouteRegistry';
import CapitalLink from '../../lib/capitalLink';
import Captured from '@civ-clone/core-city/Rules/Captured';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import ProcessYield from '@civ-clone/core-city/Rules/ProcessYield';
import TradeRouteLimit from '@civ-clone/base-city-trade-route/Rules/TradeRouteLimit';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
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
export declare const getRules: ({
  capitalLink,
  pendingEffectRegistry,
  tradeRouteRegistry,
}: TradeRouteRuleDependencies) => (
  | YieldRule
  | ProcessYield
  | Captured
  | TradeRouteLimit
  | Destroyed
)[];
export default getRules;
