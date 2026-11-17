import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  InteractionRegistry,
  instance as interactionRegistryInstance,
} from '@civ-clone/core-diplomacy/InteractionRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  PlayerTreasuryRegistry,
  instance as playerTreasuryRegistryInstance,
} from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TradeRouteRegistry,
  instance as tradeRouteRegistryInstance,
} from '@civ-clone/core-city/TradeRouteRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import {
  addTradeRoute,
  replaceWeakest,
} from '@civ-clone/base-city-trade-route/lib/addTradeRoute';
import {
  deliveryBonus,
  goods,
  routeWorth,
  tradeRoutesPerCity,
} from '../../lib/tradeRoutes';
import Advance from '@civ-clone/core-science/Advance';
import Cost from '@civ-clone/core-science/Rules/Cost';
import mapSize from '@civ-clone/civ2-rules/lib/mapSize';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import CapitalLink, { diagonalDistance } from '../../lib/capitalLink';
import City from '@civ-clone/core-city/City';
import Effect from '@civ-clone/core-rule/Effect';
import Flight from '@civ-clone/base-science-advance-flight/Flight';
import Freight from '@civ-clone/base-unit-freight/Freight';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import Invention from '@civ-clone/base-science-advance-invention/Invention';
import Navigation from '@civ-clone/base-science-advance-navigation/Navigation';
import Player from '@civ-clone/core-player/Player';
import Railroad from '@civ-clone/base-science-advance-railroad/Railroad';
import Research from '@civ-clone/core-science/Yields/Research';
import Superhighways from '@civ-clone/base-city-improvement-superhighways/Superhighways';
import { Trade } from '../../Yields';
import TradeRouteEstablished from '@civ-clone/base-unit-action-establish-trade-route/Rules/TradeRouteEstablished';
import Unit from '@civ-clone/core-unit/Unit';
import { attitude } from '@civ-clone/civ2-diplomacy/lib/relations';
import { baseTrade } from '@civ-clone/base-city-trade-route/lib/baseTrade';
import { goodsFor } from '@civ-clone/base-city-trade-route/lib/goods';
import { instance as rngInstance } from '@civ-clone/core-random';
import { nearestCity } from '@civ-clone/base-unit-agent/lib/escape';
import { tradeRouteLimit } from '@civ-clone/base-city-trade-route/lib/tradeRouteLimit';

export interface TradeRouteEstablishedDependencies {
  /** The capital link to share with the corruption rules, whose rules keep it up to date. */
  capitalLink?: CapitalLink;
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
export const tradeRouteHome = (
  unit: Unit,
  cityRegistry: CityRegistry = cityRegistryInstance
): City | null => unit.city() ?? nearestCity(unit, cityRegistry);

/** The goods a unit carries: one of `lib/tradeRoutes`'s `goods`, picked by its id. */
export const tradeRouteGoods = (unit: Unit): string => goodsFor(unit, goods);

/**
 * A Caravan or Freight arrives in a city to trade (`unit_caravan_establish_trade`, `unit.cpp:677-729`), for
 *  base-unit-action-establish-trade-route's `EstablishTradeRoute`, before the unit is used up. Its owner earns
 *  `deliveryBonus` (`lib/tradeRoutes`) in gold and as much again in research; each of the two players thinks better of
 *  the other by 10 (`civ_adjust_attitude`, −10 both ways, higher being worse); and the home city takes a route to the
 *  city, and the city one back (`city_add_trade_route` twice).
 *
 * Emits `unit:trade-route-established` with the player, the home city, the city, the goods and the bonus.
 */
export const getRules = ({
  capitalLink = new CapitalLink(),
  cityRegistry = cityRegistryInstance,
  engine = engineInstance,
  interactionRegistry = interactionRegistryInstance,
  playerResearchRegistry = playerResearchRegistryInstance,
  playerTreasuryRegistry = playerTreasuryRegistryInstance,
  randomNumberGenerator = rngInstance,
  ruleRegistry = ruleRegistryInstance,
  tradeRouteRegistry = tradeRouteRegistryInstance,
  turn = turnInstance,
  demanded = (): number => 0,
}: TradeRouteEstablishedDependencies = {}): TradeRouteEstablished[] => {
  const knows = (player: Player, AdvanceType: typeof Advance): boolean => {
      try {
        return playerResearchRegistry
          .getByPlayer(player)
          .completed(AdvanceType);
      } catch (e) {
        return false;
      }
    },
    // `civ_research_cost`: what the next advance costs, asked of the `Cost` rules (civ2-science's is the same for
    //  every advance), as `PlayerResearch#cost()` is unset while nothing is being researched.
    researchCost = (player: Player): number => {
      try {
        const playerResearch = playerResearchRegistry.getByPlayer(player),
          costs = ruleRegistry
            .process(
              Cost,
              playerResearch.researching() ?? Advance,
              playerResearch
            )
            .filter((cost: number): boolean => Number.isFinite(cost));

        return costs.length > 0
          ? Math.max(...costs)
          : playerResearch.cost().value();
      } catch (e) {
        return Infinity;
      }
    },
    airports = (city: City, other: City): boolean =>
      capitalLink.has(city, Airport) && capitalLink.has(other, Airport),
    // `city_add_trade_route` (`city.cpp:1228-1290`): an empty slot is filled; in a full city the weakest route is
    //  replaced when it's worth no more than the new partner's base trade (unadjusted), the first on a tie. A route to
    //  a partner the city already trades with is dropped (the original allows a second one carrying other goods).
    addRoute = (holder: City, partner: City): void => {
      addTradeRoute(holder, partner, {
        limit: (city: City): number =>
          tradeRouteLimit(city, ruleRegistry, tradeRoutesPerCity),
        replace: (city, routes, newPartner) =>
          replaceWeakest(
            (from: City, to: City): number =>
              to === newPartner
                ? baseTrade(to, Trade)
                : routeWorth({
                    partnerBase: baseTrade(to, Trade),
                    link: capitalLink.connection(
                      from.player(),
                      from.tile(),
                      to.tile()
                    ),
                    airports: airports(from, to),
                    domestic: from.player() === to.player(),
                  }),
            true
          )(city, routes, newPartner),
        tradeRouteRegistry,
      });
    },
    adjustAttitude = (holder: Player, toward: Player): void => {
      if (holder === toward) {
        return;
      }

      const attitudes = attitude({ interactionRegistry, ruleRegistry, turn });

      // Only once they've met, which entering the city has made them.
      if (attitudes.get(holder, toward) === undefined) {
        return;
      }

      attitudes.adjust(holder, toward, -10, 'trade-route');
    };

  return [
    new TradeRouteEstablished(
      'civ2-city:unit/trade-route-established/deliver',
      new Effect((unit: Unit, city: City): void => {
        const home = tradeRouteHome(unit, cityRegistry);

        // The original falls back on city 0, whoever's it is; a player with no city here earns nothing.
        if (home === null) {
          return;
        }

        const player = unit.player(),
          owner = city.player(),
          carried = tradeRouteGoods(unit),
          // Drawn every time, as the original draws it whatever the revenue (`unit.cpp:524`).
          roll = Math.floor(randomNumberGenerator() * 10),
          bonus = deliveryBonus({
            distance: diagonalDistance(home.tile(), city.tile()),
            mapSize: mapSize(
              city.tile().map().width() * city.tile().map().height()
            ),
            destinationBase: baseTrade(city, Trade),
            homeBase: baseTrade(home, Trade),
            otherLandMass:
              capitalLink.landMass(home.tile()) !==
              capitalLink.landMass(city.tile()),
            domestic: owner === player,
            freight: unit instanceof Freight,
            link: capitalLink.connection(player, city.tile(), home.tile()),
            airports: airports(city, home),
            destinationSuperhighways: capitalLink.has(city, Superhighways),
            homeSuperhighways: capitalLink.has(home, Superhighways),
            goodsIndex: goods.indexOf(carried),
            demanded: demanded(city, carried),
            turn: turn.value(),
            knowsInvention: knows(player, Invention),
            knowsNavigation: knows(player, Navigation),
            knowsRailroad: knows(player, Railroad),
            knowsFlight: knows(player, Flight),
            researchCost: researchCost(player),
            roll,
          });

        adjustAttitude(owner, player);
        adjustAttitude(player, owner);

        playerTreasuryRegistry
          .getByPlayer(player)
          .find((treasury) => treasury.yield() === Gold)
          ?.add(bonus);

        try {
          playerResearchRegistry
            .getByPlayer(player)
            .add(new Research(bonus, 'TradeRoute'));
        } catch (e) {
          // A player with no research (a Barbarian) has none to add to.
        }

        // The original would route a city to itself (a homeless unit whose nearest city is the one it enters); a route
        //  here always joins two cities.
        if (home !== city) {
          addRoute(home, city);
          addRoute(city, home);
        }

        engine.emit(
          'unit:trade-route-established',
          player,
          home,
          city,
          carried,
          bonus
        );
      })
    ),
  ];
};

export default getRules;
