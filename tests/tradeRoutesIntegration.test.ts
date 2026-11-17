import { BASE_TRADE, storedBaseTrade } from '../lib/baseTrade';
import { Corruption, Trade } from '../Yields';
import {
  PendingEffect,
  PendingEffectRegistry,
} from '@civ-clone/core-pending-effect';
import { atLevel, governedBy, playedBy } from './lib/stubs';
import CapitalLink from '../lib/capitalLink';
import City from '@civ-clone/core-city/City';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Effect from '@civ-clone/core-rule/Effect';
import LandMassRegistry from '@civ-clone/core-world/LandMassRegistry';
import { Monarchy } from '@civ-clone/civ2-government/Governments';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import Player from '@civ-clone/core-player/Player';
import Priority from '@civ-clone/core-rule/Priority';
import ProcessYield from '@civ-clone/core-city/Rules/ProcessYield';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import TradeRoute from '@civ-clone/core-city/TradeRoute';
import TradeRouteRegistry from '@civ-clone/core-city/TradeRouteRegistry';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import corruptionRules from '../Rules/City/corruption';
import { expect } from 'chai';
import mapWorld from './lib/mapWorld';
import { routeIncome } from '../lib/tradeRoutes';
import tradeRouteRules from '../Rules/City/trade-routes';

// Real cities routed to each other through a real rule registry, with civ2-city's corruption registered:
//  `city_calc_trade_happiness` (`src/auto/city.cpp:3660-3700`) and the `base_trade` kept by `city_process_turn`'s
//  `city_recalc` (`:4470`), richardpenman/civ2@e39fe7b.
describe('trade routes with corruption', (): void => {
  const setUp = async (pendingEffectRegistry = new PendingEffectRegistry()) => {
    const ruleRegistry = new RuleRegistry(),
      landMassRegistry = new LandMassRegistry(),
      cityRegistry = new CityRegistry(),
      cityImprovementRegistry = new CityImprovementRegistry(),
      tileImprovementRegistry = new TileImprovementRegistry(),
      tradeRouteRegistry = new TradeRouteRegistry(),
      turn = new Turn(),
      water = '~'.repeat(60),
      world = await mapWorld(
        [water, water, '~~' + '.'.repeat(30) + '~'.repeat(28), water, water],
        ruleRegistry,
        landMassRegistry
      ),
      player = new Player(ruleRegistry),
      rival = new Player(ruleRegistry),
      capital = new City(player, world.get(2, 2), 'capital', ruleRegistry),
      near = new City(player, world.get(12, 2), 'near', ruleRegistry),
      far = new City(rival, world.get(28, 2), 'far', ruleRegistry),
      capitalLink = new CapitalLink({
        cityImprovementRegistry,
        cityRegistry,
        landMassRegistry,
        tileImprovementRegistry,
        turn,
        playerResearchRegistry: {
          getByPlayer: () => ({ completed: () => false }),
        } as any,
        unitRegistry: { getByTile: () => [] } as any,
      }),
      squares = new Map<City, number>([
        [capital, 40],
        [near, 30],
        [far, 50],
      ]);

    cityRegistry.register(capital, near, far);
    cityImprovementRegistry.register(new Palace(capital, ruleRegistry));
    tradeRouteRegistry.register(
      new TradeRoute(near, far),
      new TradeRoute(far, near)
    );

    ruleRegistry.register(
      new YieldRule(
        'test:squares',
        new Priority(0),
        new Effect((city: City): Yield => new Trade(squares.get(city)!))
      ),
      ...corruptionRules({
        capitalLink,
        cityImprovementRegistry,
        cityRegistry,
        landMassRegistry,
        tileImprovementRegistry,
        pendingEffectRegistry,
        playerGovernmentRegistry: governedBy(Monarchy),
        gameDifficultyRegistry: atLevel(0),
        clientRegistry: playedBy(),
        turn,
        cityBuildRegistry: {
          getByCity: () => ({ building: () => null }),
        } as any,
      }),
      ...tradeRouteRules({
        capitalLink,
        pendingEffectRegistry,
        tradeRouteRegistry,
      })
    );

    const total = (yields: Yield[], Type: typeof Yield) =>
        yields
          .filter((cityYield) => cityYield instanceof Type)
          .reduce((sum, cityYield) => sum + cityYield.value(), 0),
      // What the city's routes add, by partner.
      routeTrade = (city: City): number[] =>
        city
          .yields()
          .filter((cityYield) =>
            cityYield
              .values()
              .some(([, provider]) =>
                [capital, near, far].some((other) => other.id() === provider)
              )
          )
          .map((cityYield) => cityYield.value()),
      // As `processCityYields` does at the start of the city's player's turn.
      processTrade = (city: City): void => {
        const yields = city.yields();

        ruleRegistry.process(
          ProcessYield,
          new Trade(total(yields, Trade), 'Consolidated'),
          city,
          yields
        );
      };

    return {
      capital,
      near,
      far,
      squares,
      total,
      routeTrade,
      processTrade,
      pendingEffectRegistry,
      tradeRouteRegistry,
      corruptionOf: (yields: Yield[]) => -total(yields, Corruption),
      // Without routes: tear them out, ask, and put them back.
      alone: (city: City): Yield[] => {
        const routes = tradeRouteRegistry.entries();

        tradeRouteRegistry.unregister(...routes);

        const yields = city.yields();

        tradeRouteRegistry.register(...routes);

        return yields;
      },
    };
  };

  it("work from each city's trade after corruption, and corruption is taken from the total with the routes", async (): Promise<void> => {
    const { near, far, total, alone, corruptionOf } = await setUp(),
      nearAlone = alone(near),
      farAlone = alone(far),
      nearBase = total(nearAlone, Trade),
      farBase = total(farAlone, Trade);

    const nearYields = near.yields(),
      routeYield = nearYields.filter((cityYield) =>
        cityYield.values().some(([, provider]) => provider === far.id())
      ),
      expected = routeIncome({
        base: nearBase,
        partnerBase: farBase,
        link: 0,
        airports: false,
        superhighways: false,
        domestic: false,
      });

    // 30 trade less 7 is 23 here, and the rival's 50 less 40 is 10 (it has no Palace); (23 + 10 + 4) >> 3 = 4.
    expect([nearBase, farBase, expected]).eql([23, 10, 4]);
    // Two real cities routed to each other: no recursion, one route yield worth the income.
    expect(routeYield.map((cityYield) => cityYield.value())).eql([expected]);
    // Corruption is worked out again on the total, the routes' trade included: on 34 trade, 8 is lost.
    expect([corruptionOf(nearAlone), corruptionOf(nearYields)]).eql([7, 8]);
    expect(total(nearYields, Trade)).equal(
      30 + expected - corruptionOf(nearYields)
    );
  });

  it("gives the same whether or not another city's yields were asked first, and asking keeps nothing", async (): Promise<void> => {
    const first = await setUp(),
      second = await setUp();

    const before = first.routeTrade(first.near);

    // Every city's yields asked, as the interface asks them, before the same city's.
    [second.capital, second.far, second.near, second.far].forEach((city) =>
      city.yields()
    );

    expect(second.routeTrade(second.near)).eql(before);
    expect(first.routeTrade(first.near)).eql(before);
    expect(second.pendingEffectRegistry.entries()).eql([]);
  });

  it("reads a partner's base trade as it was kept at the partner's processing, until it is processed again", async (): Promise<void> => {
    const {
      near,
      far,
      squares,
      routeTrade,
      processTrade,
      pendingEffectRegistry,
    } = await setUp();

    // Never processed: worked out when read.
    expect(storedBaseTrade(far, { pendingEffectRegistry })).null;
    expect(routeTrade(near)).eql([4]);

    processTrade(far);
    expect(storedBaseTrade(far, { pendingEffectRegistry })).equal(10);

    // The partner's trade rises during the turn: the route earns on the kept 10 until the partner is processed again.
    squares.set(far, 130);
    expect(routeTrade(near)).eql([4]);

    processTrade(far);
    // 130 less 104 (its corruption) is 26: (23 + 26 + 4) >> 3 = 6.
    expect(storedBaseTrade(far, { pendingEffectRegistry })).equal(26);
    expect(routeTrade(near)).eql([6]);
  });

  it('keeps the base trade as a saved pending effect, read back the same after a reload, and forgets it when the city goes', async (): Promise<void> => {
    const playing = await setUp();

    playing.processTrade(playing.far);

    const [record] = playing.pendingEffectRegistry.entries(),
      saved = JSON.parse(
        JSON.stringify({
          handler: record.handler(),
          data: record.data(),
        })
      );

    expect(saved).eql({ handler: BASE_TRADE, data: { value: '10' } });

    // A reloaded game: the same record, restored, and a raised partner, never processed since.
    const reloaded = await setUp();

    reloaded.pendingEffectRegistry.register(
      new PendingEffect(saved.handler, reloaded.far, saved.data)
    );
    playing.squares.set(playing.far, 130);
    reloaded.squares.set(reloaded.far, 130);

    expect(reloaded.routeTrade(reloaded.near)).eql(
      playing.routeTrade(playing.near)
    );

    playing.far.destroy(null as any);
    expect(playing.pendingEffectRegistry.entries()).eql([]);
    expect(playing.tradeRouteRegistry.entries()).eql([]);
  });
});
