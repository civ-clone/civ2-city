import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { PlayerTreasuryRegistry } from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TradeRouteRegistry } from '@civ-clone/core-city/TradeRouteRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import CapitalLink from '../../lib/capitalLink';
import City from '@civ-clone/core-city/City';
import TradeRouteEstablished from '@civ-clone/base-unit-action-establish-trade-route/Rules/TradeRouteEstablished';
import Unit from '@civ-clone/core-unit/Unit';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
export interface TradeRouteEstablishedDependencies {
  /**
   * The capital link shared with the corruption rules (`Rules/City/corruption`), whose rules keep it up to date: one
   *  that no such rule invalidates would keep a turn's links all turn, whatever is built.
   */
  capitalLink: CapitalLink;
  /** Where each city's base trade is kept (`lib/baseTrade`), which the delivery only reads. */
  pendingEffectRegistry?: PendingEffectRegistry;
  cityRegistry?: CityRegistry;
  engine?: Engine;
  interactionRegistry?: InteractionRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  playerTreasuryRegistry?: PlayerTreasuryRegistry;
  randomNumberGenerator?: () => number;
  ruleRegistry?: RuleRegistry;
  tradeRouteRegistry?: TradeRouteRegistry;
  turn?: Turn;
  /**
   * How many of `city`'s three demands are for `goods` (`cities[].demands`). Goods are only names here (no supply and
   *  demand), so none unless given.
   */
  demanded?: (city: City, goods: string) => number;
}
/**
 * The city a trade route runs from: the unit's home, or, with none, the deliverer's city nearest it
 *  (`unit_caravan_establish_trade`, `unit.cpp:694-699`), or `null` if it has none.
 */
export declare const tradeRouteHome: (
  unit: Unit,
  cityRegistry?: CityRegistry
) => City | null;
/** The goods a unit carries: one of `lib/tradeRoutes`'s `goods`, picked by its id. */
export declare const tradeRouteGoods: (unit: Unit) => string;
/**
 * A Caravan or Freight arrives in a city to trade (`unit_caravan_establish_trade`, `unit.cpp:677-729`), for
 *  base-unit-action-establish-trade-route's `EstablishTradeRoute`, before the unit is used up. Its owner earns
 *  `deliveryBonus` (`lib/tradeRoutes`) in gold and as much again in research; each of the two players thinks better of
 *  the other by 10 (`civ_adjust_attitude`, −10 both ways, higher being worse); and the home city takes a route to the
 *  city, and the city one back (`city_add_trade_route` twice).
 *
 * Emits `unit:trade-route-established` with the player, the home city, the city, the goods and the bonus.
 */
export declare const getRules: ({
  capitalLink,
  pendingEffectRegistry,
  cityRegistry,
  engine,
  interactionRegistry,
  playerResearchRegistry,
  playerTreasuryRegistry,
  randomNumberGenerator,
  ruleRegistry,
  tradeRouteRegistry,
  turn,
  demanded,
}: TradeRouteEstablishedDependencies) => TradeRouteEstablished[];
export default getRules;
