import { Corruption, Trade } from '../Yields';
import { atLevel, governedBy, playedBy } from './lib/stubs';
import CapitalLink from '../lib/capitalLink';
import City from '@civ-clone/core-city/City';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Effect from '@civ-clone/core-rule/Effect';
import LandMassRegistry from '@civ-clone/core-world/LandMassRegistry';
import { Monarchy } from '@civ-clone/civ2-government/Governments';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import Player from '@civ-clone/core-player/Player';
import Priority from '@civ-clone/core-rule/Priority';
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

// Two real cities routed to each other through a real rule registry, with civ2-city's corruption registered:
//  `city_calc_trade_happiness` (`src/auto/city.cpp:3660-3700`, richardpenman/civ2@e39fe7b).
describe('trade routes with corruption', (): void => {
  it("work from each city's trade after corruption, and corruption is taken from the total with the routes", async (): Promise<void> => {
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
        pendingEffectRegistry: new PendingEffectRegistry(),
        playerGovernmentRegistry: governedBy(Monarchy),
        gameDifficultyRegistry: atLevel(0),
        clientRegistry: playedBy(),
        turn,
        cityBuildRegistry: {
          getByCity: () => ({ building: () => null }),
        } as any,
      }),
      ...tradeRouteRules({ capitalLink, tradeRouteRegistry })
    );

    const total = (yields: Yield[], Type: typeof Yield) =>
        yields
          .filter((cityYield) => cityYield instanceof Type)
          .reduce((sum, cityYield) => sum + cityYield.value(), 0),
      corruptionOf = (yields: Yield[]) => -total(yields, Corruption),
      // Without routes: tear them out, ask, and put them back.
      alone = (city: City): Yield[] => {
        const routes = tradeRouteRegistry.entries();

        tradeRouteRegistry.unregister(...routes);

        const yields = city.yields();

        tradeRouteRegistry.register(...routes);

        return yields;
      },
      nearAlone = alone(near),
      farAlone = alone(far),
      nearBase = total(nearAlone, Trade),
      farBase = total(farAlone, Trade);

    // The rival has no Palace, so its corruption counts the most distance.
    expect(corruptionOf(nearAlone)).greaterThan(0);
    expect(corruptionOf(farAlone)).greaterThan(0);

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

    // Two real cities routed to each other: no recursion, one route yield worth the income.
    expect(routeYield.map((cityYield) => cityYield.value())).eql([expected]);
    expect(expected).greaterThan(0);

    // Corruption is worked out again on the total, the routes' trade included.
    // 30 trade less 7 is 23 here, and the rival's 50 less 40 is 10; (23 + 10 + 4) >> 3 = 4. On 34 trade, 8 is lost.
    expect([nearBase, farBase, expected]).eql([23, 10, 4]);
    expect([corruptionOf(nearAlone), corruptionOf(nearYields)]).eql([7, 8]);
    expect(total(nearYields, Trade)).equal(
      30 + expected - corruptionOf(nearYields)
    );

    // Asked again, the same.
    expect(
      near
        .yields()
        .map((cityYield) => [cityYield.constructor.name, cityYield.value()])
    ).eql(
      nearYields.map((cityYield) => [
        cityYield.constructor.name,
        cityYield.value(),
      ])
    );
  });
});
