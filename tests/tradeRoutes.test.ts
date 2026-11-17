import {
  DeliveryBonusInput,
  deliveryBonus,
  demandBonus,
  goods,
  routeIncome,
  routeWorth,
} from '../lib/tradeRoutes';
import { Corruption, Trade } from '../Yields';
import City from '@civ-clone/core-city/City';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import Freight from '@civ-clone/base-unit-freight/Freight';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import Rule from '@civ-clone/core-rule/Rule';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TradeRoute from '@civ-clone/core-city/TradeRoute';
import TradeRouteEstablished from '@civ-clone/base-unit-action-establish-trade-route/Rules/TradeRouteEstablished';
import TradeRouteLimit from '@civ-clone/base-city-trade-route/Rules/TradeRouteLimit';
import TradeRouteRegistry from '@civ-clone/core-city/TradeRouteRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import Yield from '@civ-clone/core-yield/Yield';
import { expect } from 'chai';
import { instanceOf } from './lib/stubs';
import tradeRouteEstablished, {
  tradeRouteHome,
} from '../Rules/Unit/trade-route-established';
import tradeRoutes from '../Rules/City/trade-routes';

// OpenCiv2 `src/auto/city.cpp` (`city_calc_trade_happiness`, `city_add_trade_route`) and `src/auto/unit.cpp`
//  (`unit_caravan_trade_revenue`, `unit_caravan_establish_trade`), richardpenman/civ2@e39fe7b.

const byId = <T extends Rule<any, any>>(rules: T[], id: string): T =>
  rules.find((rule) => rule.id() === id)!;

describe('routeIncome (city.cpp:3670-3690)', (): void => {
  const income = (input: Partial<Parameters<typeof routeIncome>[0]>) =>
    routeIncome({
      base: 0,
      partnerBase: 0,
      link: 0,
      airports: false,
      superhighways: false,
      domestic: false,
      ...input,
    });

  it('is (both base trades + 4) >> 3, rounding down at each eighth', (): void => {
    expect(income({ base: 0, partnerBase: 3 })).equal(0);
    expect(income({ base: 0, partnerBase: 4 })).equal(1);
    expect(income({ base: 5, partnerBase: 6 })).equal(1);
    expect(income({ base: 6, partnerBase: 6 })).equal(2);
  });

  it('adds link × value / 2: a road half again, a railroad double', (): void => {
    expect(income({ base: 20, partnerBase: 20, link: 1 })).equal(5 + 2);
    expect(income({ base: 20, partnerBase: 20, link: 2 })).equal(10);
  });

  it('counts Airports in both as at least a road, never more', (): void => {
    expect(income({ base: 20, partnerBase: 20, airports: true })).equal(7);
    expect(
      income({ base: 20, partnerBase: 20, airports: true, link: 2 })
    ).equal(10);
  });

  it("adds 1 to the link for this city's Superhighways", (): void => {
    expect(income({ base: 20, partnerBase: 20, superhighways: true })).equal(7);
    expect(
      income({ base: 20, partnerBase: 20, superhighways: true, link: 2 })
    ).equal(5 + 7);
    expect(
      income({
        base: 20,
        partnerBase: 20,
        superhighways: true,
        airports: true,
      })
    ).equal(10);
  });

  it('halves a domestic route, after the link', (): void => {
    expect(income({ base: 20, partnerBase: 20, domestic: true })).equal(2);
    expect(
      income({ base: 20, partnerBase: 20, link: 1, domestic: true })
    ).equal(3);
    expect(income({ base: 4, partnerBase: 4, domestic: true })).equal(0);
  });
});

describe('routeWorth (city.cpp:1258-1275)', (): void => {
  it("is the partner's base trade, with the link and Airports but not Superhighways, halved if domestic", (): void => {
    const worth = (input: Partial<Parameters<typeof routeWorth>[0]>) =>
      routeWorth({
        partnerBase: 10,
        link: 0,
        airports: false,
        domestic: false,
        ...input,
      });

    expect(worth({})).equal(10);
    expect(worth({ link: 1 })).equal(15);
    expect(worth({ link: 2 })).equal(20);
    expect(worth({ airports: true })).equal(15);
    expect(worth({ airports: true, link: 2 })).equal(20);
    expect(worth({ domestic: true })).equal(5);
    expect(worth({ partnerBase: 11, link: 1, domestic: true })).equal(8);
  });
});

describe('demandBonus (unit.cpp:487-505)', (): void => {
  it("gives half, all, one and a half or twice the revenue by the goods' number, else none", (): void => {
    expect(goods.length).equal(16);
    expect(
      goods.map((name: string, index: number) => [name, demandBonus(index, 11)])
    ).eql([
      ['Hides', 0],
      ['Wool', 0],
      ['Beads', 0],
      ['Cloth', 5],
      ['Salt', 0],
      ['Coal', 5],
      ['Copper', 0],
      ['Dye', 0],
      ['Wine', 5],
      ['Silk', 11],
      ['Silver', 5],
      ['Spice', 11],
      ['Gems', 11],
      ['Gold', 11],
      ['Oil', 16],
      ['Uranium', 22],
    ]);
  });
});

describe('deliveryBonus (unit.cpp:434-532)', (): void => {
  const plain: DeliveryBonusInput = {
      distance: 14,
      mapSize: 'normal',
      destinationBase: 12,
      homeBase: 12,
      otherLandMass: false,
      domestic: false,
      freight: false,
      link: 0,
      airports: false,
      destinationSuperhighways: false,
      homeSuperhighways: false,
      goodsIndex: 0,
      demanded: 0,
      turn: 250,
      knowsInvention: false,
      knowsNavigation: false,
      knowsRailroad: false,
      knowsFlight: false,
      researchCost: 3000,
      roll: 0,
    },
    bonus = (input: Partial<DeliveryBonusInput>): number =>
      deliveryBonus({ ...plain, ...input });

  it('is (both base trades) × (distance + 10) / 24', (): void => {
    expect(bonus({})).equal(24);
    expect(bonus({ distance: 0, destinationBase: 11, homeBase: 0 })).equal(4);
    expect(bonus({ distance: 1, destinationBase: 11, homeBase: 0 })).equal(5);
  });

  it('scales the distance by 4/5 on a large map and 5/4 on a small one', (): void => {
    expect(bonus({ distance: 9, mapSize: 'large' })).equal(17); // 9 → 7
    expect(bonus({ distance: 9, mapSize: 'small' })).equal(21); // 9 → 11
  });

  it('doubles across land masses, halves for an own city, then Freight half again', (): void => {
    expect(bonus({ otherLandMass: true })).equal(48);
    expect(bonus({ domestic: true })).equal(12);
    expect(bonus({ freight: true })).equal(36);
    expect(bonus({ domestic: true, destinationBase: 13 })).equal(12);
  });

  it('adds link × value / 2: Airports +1 on one land mass, +2 across, and +1 for Superhighways in each city', (): void => {
    expect(bonus({ link: 1 })).equal(36);
    expect(bonus({ link: 2 })).equal(48);
    expect(bonus({ airports: true })).equal(36);
    expect(bonus({ airports: true, otherLandMass: true })).equal(96);
    expect(bonus({ destinationSuperhighways: true })).equal(36);
    expect(
      bonus({ destinationSuperhighways: true, homeSuperhighways: true })
    ).equal(48);
  });

  it('adds the demand bonus: the revenue × 2 + the bonus, at home or abroad (unit.cpp:510)', (): void => {
    // Silk (9): the bonus is the revenue, 24; an own city's revenue is 12.
    expect(bonus({ goodsIndex: 9, demanded: 1 })).equal(72);
    expect(bonus({ goodsIndex: 9, demanded: 1, domestic: true })).equal(36);
    expect(bonus({ goodsIndex: 9, demanded: 2 })).equal(168);
    expect(bonus({ goodsIndex: 0, demanded: 1 })).equal(48);
  });

  it('doubles before turn 200 without Invention or Navigation', (): void => {
    expect(bonus({ turn: 199 })).equal(48);
    expect(bonus({ turn: 200 })).equal(24);
    expect(bonus({ turn: 199, knowsInvention: true })).equal(24);
    expect(bonus({ turn: 199, knowsNavigation: true })).equal(24);
  });

  it('takes a third off for Railroad and another for Flight', (): void => {
    expect(bonus({ knowsRailroad: true })).equal(16);
    expect(bonus({ knowsRailroad: true, knowsFlight: true })).equal(11);
    expect(bonus({ knowsFlight: true, destinationBase: 13 })).equal(17);
  });

  it('caps at two thirds of the research cost, held between 200 + the roll and 30000', (): void => {
    const big = { destinationBase: 2000, homeBase: 2000, distance: 50 };

    expect(bonus({ ...big, researchCost: 3000 })).equal(2000);
    expect(bonus({ ...big, researchCost: 3001 })).equal(2000);
    expect(bonus({ ...big, researchCost: 3002 })).equal(2001);
    expect(bonus({ ...big, researchCost: 30, roll: 0 })).equal(200);
    expect(bonus({ ...big, researchCost: 30, roll: 9 })).equal(209);
    expect(bonus({ ...big, researchCost: Infinity })).equal(10000);
    expect(
      bonus({ ...big, otherLandMass: true, link: 2, researchCost: 90000 })
    ).equal(30000);
    expect(bonus({ destinationBase: 0, homeBase: 0 })).equal(0);
  });
});

/** A city with `trade` trade after `corruption`, of `player`, on `tile`. */
const cityOf = (
  name: string,
  player: object,
  trade: number,
  corruption: number = 0,
  tile: object = {}
): City =>
  instanceOf(City, {
    id: () => name,
    player: () => player,
    tile: () => tile,
    yields: (): Yield[] => [new Trade(trade), new Corruption(corruption)],
  });

/** A capital link answering `link` for every pair, with `improved` cities holding `improvements`. */
const linkOf = (
  link: 0 | 1 | 2,
  improvements: Map<City, Function[]> = new Map(),
  landMasses: Map<object, object> = new Map()
) =>
  ({
    connection: () => link,
    routeLink: () => link,
    key: () => 'turn',
    has: (city: City, Improvement: Function) =>
      (improvements.get(city) ?? []).includes(Improvement),
    landMass: (tile: object) => landMasses.get(tile) ?? null,
  } as any);

describe('civ2-city:city/yield/trade-routes', (): void => {
  it("adds one Trade per route, tagged with the partner's id, worked from both cities' trade after corruption", (): void => {
    const me = {},
      them = {},
      city = cityOf('home', me, 30, 6),
      foreign = cityOf('far', them, 20),
      domestic = cityOf('near', me, 20),
      tradeRouteRegistry = new TradeRouteRegistry();

    tradeRouteRegistry.register(
      new TradeRoute(city, foreign),
      new TradeRoute(city, domestic)
    );

    const rule = byId(
        tradeRoutes({ capitalLink: linkOf(1), tradeRouteRegistry }),
        'civ2-city:city/yield/trade-routes'
      ) as YieldRule,
      yields = rule.process(city, [new Trade(30)]) as Yield[];

    // (24 + 20 + 4) >> 3 = 6, + 3 for the road; the domestic one halved.
    expect(
      yields.map((routeYield: Yield) => [
        routeYield.constructor,
        routeYield.value(),
        routeYield.values().map(([, provider]) => provider),
      ])
    ).eql([
      [Trade, 9, ['far']],
      [Trade, 4, ['near']],
    ]);
  });

  it('holds three routes a city', (): void => {
    expect(
      (
        byId(
          tradeRoutes({ capitalLink: linkOf(0) }),
          'civ2-city:city/trade-route-limit'
        ) as TradeRouteLimit
      ).process(instanceOf(City))
    ).equal(3);
  });

  it("clears a destroyed city's routes both ways, and leaves the rest", (): void => {
    const me = {},
      a = cityOf('a', me, 1),
      b = cityOf('b', me, 1),
      c = cityOf('c', me, 1),
      tradeRouteRegistry = new TradeRouteRegistry(),
      kept = new TradeRoute(b, c);

    tradeRouteRegistry.register(
      new TradeRoute(a, b),
      new TradeRoute(b, a),
      kept
    );

    (
      byId(
        tradeRoutes({ capitalLink: linkOf(0), tradeRouteRegistry }),
        'civ2-city:city/destroyed/trade-routes'
      ) as Destroyed
    ).process(a, me as any);

    expect(tradeRouteRegistry.entries()).eql([kept]);
  });
});

describe('civ2-city:unit/trade-route-established/deliver', (): void => {
  const setUp = ({
    unitType = Unit as typeof Unit,
    homeTrade = 12,
    cityTrade = 12,
    held = [] as [string, number][],
    sameOwner = false,
    homeless = false,
  } = {}) => {
    const me = { name: 'me' },
      them = { name: 'them' },
      tile = (x: number, y: number): any => ({
        x: () => x,
        y: () => y,
        distanceFrom: (other: any) => Math.abs(other.x() - x),
        map: () => ({
          width: () => 50,
          height: () => 80,
          topology: () => ({
            logicalDelta: (x1: number, y1: number, x2: number, y2: number) => [
              x2 - x1,
              y2 - y1,
            ],
          }),
        }),
      }),
      home = cityOf('home', me, homeTrade, 0, tile(0, 0)),
      city = cityOf('city', sameOwner ? me : them, cityTrade, 0, tile(14, 0)),
      tradeRouteRegistry = new TradeRouteRegistry(),
      gold: number[] = [],
      research: number[] = [],
      attitudes: [object, object, number][] = [],
      events: unknown[][] = [],
      partners = held.map(([name, trade]) => cityOf(name, them, trade));

    partners.forEach((partner) =>
      tradeRouteRegistry.register(new TradeRoute(home, partner))
    );

    const unit = instanceOf(unitType, {
        id: () => 'Caravan-0',
        player: () => me,
        city: () => (homeless ? null : home),
        tile: () => tile(1, 0),
      }),
      rule = byId(
        tradeRouteEstablished({
          capitalLink: linkOf(0),
          cityRegistry: { getByPlayer: () => [home] } as any,
          engine: { emit: (...args: unknown[]) => events.push(args) } as any,
          interactionRegistry: {
            getByPlayers: () => [],
            getByPlayer: () => [],
            filter: () => [],
            register: () => {},
          } as any,
          playerResearchRegistry: {
            getByPlayer: () => ({
              completed: () => false,
              researching: () => null,
              cost: () => ({ value: () => 3000 }),
              add: (value: Yield) => research.push(value.value()),
            }),
          } as any,
          playerTreasuryRegistry: {
            getByPlayer: () => [
              { yield: () => Gold, add: (value: number) => gold.push(value) },
            ],
          } as any,
          randomNumberGenerator: () => 0,
          ruleRegistry: new RuleRegistry(),
          tradeRouteRegistry,
          turn: { value: () => 250 } as any,
        }),
        'civ2-city:unit/trade-route-established/deliver'
      ) as TradeRouteEstablished;

    return {
      deliver: () => rule.process(unit, city),
      home,
      city,
      gold,
      research,
      events,
      routes: () =>
        tradeRouteRegistry
          .entries()
          .map((route: TradeRoute) => [route.from().id(), route.to().id()]),
    };
  };

  it('pays the bonus into gold and research, and adds a route each way', (): void => {
    const { deliver, gold, research, events, routes, home, city } = setUp();

    deliver();

    // `diagonalDistance` of (0, 0) to (14, 0) is 14: (12 + 12) × 24 / 24.
    expect(gold).eql([24]);
    expect(research).eql([24]);
    expect(routes()).eql([
      ['home', 'city'],
      ['city', 'home'],
    ]);
    expect(events).eql([
      ['unit:trade-route-established', { name: 'me' }, home, city, 'Hides', 24],
    ]);
  });

  it('pays half again for Freight, and half for an own city', (): void => {
    const freight = setUp({ unitType: Freight as unknown as typeof Unit }),
      own = setUp({ sameOwner: true });

    freight.deliver();
    own.deliver();

    expect(freight.gold).eql([36]);
    expect(own.gold).eql([12]);
  });

  it('runs a homeless unit from the nearest city of its owner', (): void => {
    const { deliver, routes } = setUp({ homeless: true });

    deliver();

    expect(routes()).eql([
      ['home', 'city'],
      ['city', 'home'],
    ]);
  });

  it('in a full city replaces the weakest route when worth no more than the new partner, the first on a tie', (): void => {
    const tie = setUp({
        held: [
          ['a', 12],
          ['b', 30],
          ['c', 12],
        ],
      }),
      weaker = setUp({
        held: [
          ['a', 13],
          ['b', 30],
          ['c', 14],
        ],
      });

    tie.deliver();
    weaker.deliver();

    expect(tie.routes()).eql([
      ['home', 'city'],
      ['home', 'b'],
      ['home', 'c'],
      ['city', 'home'],
    ]);
    expect(weaker.routes()).eql([
      ['home', 'a'],
      ['home', 'b'],
      ['home', 'c'],
      ['city', 'home'],
    ]);
  });

  it('finds no home for a unit whose player has no city', (): void => {
    expect(
      tradeRouteHome(
        instanceOf(Unit, {
          city: () => null,
          player: () => ({}),
          tile: () => ({}),
        }),
        { getByPlayer: () => [] } as any
      )
    ).null;
  });
});
