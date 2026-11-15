import {
  ANARCHY,
  COMMUNISM,
  DEMOCRACY,
  DESPOTISM,
  FUNDAMENTALISM,
  MONARCHY,
  REPUBLIC,
} from '@civ-clone/civ2-rules/data/governments';
import { Corruption, Production, Trade, Waste } from '../Yields';
import { LEADER_CELEBRATION, celebrating } from '../lib/celebrating';
import { WasteInput, shieldWaste, tradeCorruption } from '../lib/corruption';
import { atLevel, governedBy, playedBy } from './lib/stubs';
import { Despotism, Monarchy } from '@civ-clone/civ2-government/Governments';
import City from '@civ-clone/core-city/City';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Cost from '@civ-clone/core-city/Rules/Cost';
import Courthouse from '@civ-clone/base-city-improvement-courthouse/Courthouse';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import LandMassRegistry from '@civ-clone/core-world/LandMassRegistry';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import {
  PendingEffect,
  PendingEffectRegistry,
} from '@civ-clone/core-pending-effect';
import Player from '@civ-clone/core-player/Player';
import ProcessYield from '@civ-clone/core-city/Rules/ProcessYield';
import Priority from '@civ-clone/core-rule/Priority';
import Road from '@civ-clone/base-tile-improvement-road/Road';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import UnitSupportProduction from '@civ-clone/base-city-yield-unit-support-production/UnitSupportProduction';
import Yield from '@civ-clone/core-yield/Yield';
import YieldModifier from '@civ-clone/core-city/Rules/YieldModifier';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import corruptionRules from '../Rules/City/corruption';
import { expect } from 'chai';
import mapWorld from './lib/mapWorld';
import processYield from '../Rules/City/process-yield';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';

// OpenCiv2 `city_calc_corruption` and `city_calc_shields_pollution` (`src/auto/city.cpp`), richardpenman/civ2@49f26ec.

describe('shieldWaste', (): void => {
  const waste = (input: Partial<WasteInput>): number =>
    shieldWaste({
      shields: 20,
      support: 2,
      link: 0,
      government: MONARCHY,
      distance: 10,
      human: false,
      level: 0,
      capital: false,
      barbarian: false,
      buildingPalaceWithNoCapital: false,
      ...input,
    });

  it('is corruption of shields less support, × (3 − link) / 3, over (government ÷ 2) + 1, each rounded down', (): void => {
    // 10 × 18 × 3 / (6 × 20) = 4 (4.5); × 3 / 3 = 4; / 2 = 2.
    expect(waste({ link: 0 })).equal(2);
    // × 2 / 3 = 2 (2.67); / 2 = 1.
    expect(waste({ link: 1 })).equal(1);
    // × 1 / 3 = 1 (1.33); / 2 = 0.
    expect(waste({ link: 2 })).equal(0);
  });

  it('divides by 1 under Anarchy and Despotism, 2 under Monarchy and Communism, 3 under the Republic', (): void => {
    // Distance 16 and 60 shields less none: 16 × 60 × 3 = 2,880.
    (
      [
        [ANARCHY, Math.trunc(2880 / 80)],
        [DESPOTISM, Math.trunc(2880 / 100)],
        [MONARCHY, Math.trunc(Math.trunc(2880 / 120) / 2)],
        [REPUBLIC, Math.trunc(Math.trunc(2880 / 160) / 3)],
      ] as [number, number][]
    ).forEach(([government, expected]) =>
      expect(
        waste({ government, distance: 16, shields: 60, support: 0 }),
        String(government)
      ).equal(expected)
    );

    // Communism: every city 1 away (@COSMIC), 1 × 100 × 3 / 140 = 2, / 2 = 1.
    expect(
      waste({ government: COMMUNISM, shields: 100, support: 0, distance: 30 })
    ).equal(1);
  });

  it('counts no distance past 16 (trade has no such limit), before the level is added', (): void => {
    // 16 × 30 × 3 / 100 = 14, where trade at 30 would lose 27.
    expect(
      waste({ government: DESPOTISM, distance: 30, shields: 30, support: 0 })
    ).equal(14);
    expect(
      tradeCorruption({
        amount: 30,
        government: DESPOTISM,
        distance: 30,
        human: false,
        level: 0,
        capital: false,
      })
    ).equal(27);
    // A person on Deity: 16 + 5 = 21, 21 × 30 × 3 / 100 = 18.
    expect(
      waste({
        government: DESPOTISM,
        distance: 30,
        shields: 30,
        support: 0,
        human: true,
        level: 5,
      })
    ).equal(18);
  });

  it('halves the corruption for the Palace or a Courthouse before the link and the government divide it', (): void => {
    // Anarchy, distance 8, 30 shields: 8 × 30 × 3 / 80 = 9, halved 4, × 2 / 3 = 2. Halving last would give 3.
    const input = {
      government: ANARCHY,
      distance: 8,
      shields: 30,
      support: 0,
      link: 1,
    };

    expect(waste(input)).equal(6);
    expect(waste({ ...input, courthouse: true })).equal(2);
    expect(waste({ ...input, capital: true })).equal(2);
    expect(waste({ ...input, capital: true, courthouse: true })).equal(2);
  });

  it('is none below 1, and none from shields their support uses up', (): void => {
    // Anarchy with no capital, the distance counting 16: 16 × 9 × 3 / 80 = 5; 16 × 1 × 3 / 80 = 0.
    expect(
      waste({ government: ANARCHY, distance: null, shields: 11, support: 2 })
    ).equal(5);
    expect(
      waste({ government: ANARCHY, distance: null, shields: 3, support: 2 })
    ).equal(0);
    expect(
      waste({ government: ANARCHY, distance: null, shields: 2, support: 2 })
    ).equal(0);
    expect(
      waste({ government: ANARCHY, distance: null, shields: 1, support: 4 })
    ).equal(0);
    // The code's other limit, shields − support − 1, can't be reached: the distance counts at most 16 + 5 (Deity), and
    //  21 × 3 / (4 × 20) is under 1 shield per shield.
  });

  it('is none for the barbarians, under Democracy or Fundamentalism, or while building the Palace with no capital', (): void => {
    expect(waste({ barbarian: true })).equal(0);
    expect(waste({ government: DEMOCRACY })).equal(0);
    expect(waste({ government: FUNDAMENTALISM })).equal(0);
    expect(waste({ buildingPalaceWithNoCapital: true })).equal(0);
  });

  it("uses the next government's divisor while celebrating, but its own after the link", (): void => {
    // Monarchy, distance 10, 40 shields: 10 × 40 × 3 = 1,200; / 120 = 10 → 5, celebrating / 140 = 8 → 4.
    expect(waste({ shields: 40, support: 0 })).equal(5);
    expect(waste({ shields: 40, support: 0, celebrating: true })).equal(4);
    // A celebrating Republic counts as Fundamentalism's step up, Democracy: the divisor is 8 either way.
    expect(
      waste({
        government: REPUBLIC,
        shields: 40,
        support: 0,
        celebrating: true,
      })
    ).equal(waste({ government: REPUBLIC, shields: 40, support: 0 }));
  });
});

describe('tradeCorruption while celebrating', (): void => {
  const corruption = (celebrating: boolean, government = MONARCHY) =>
    tradeCorruption({
      amount: 28,
      government,
      distance: 10,
      human: true,
      level: 3,
      capital: false,
      celebrating,
    });

  it("uses the next government's divisor", (): void => {
    // 10 × 28 × 3 = 840: / 120 = 7, celebrating / 140 = 6.
    expect(corruption(false)).equal(7);
    expect(corruption(true)).equal(6);
  });

  it("no longer adds a person's level under Despotism, which counts as Monarchy", (): void => {
    // (10 + 3) × 28 × 3 / 100 = 10; celebrating 10 × 28 × 3 / 120 = 7.
    expect(corruption(false, DESPOTISM)).equal(10);
    expect(corruption(true, DESPOTISM)).equal(7);
  });

  it('is still none under Democracy, even celebrating past the end of the divisors', (): void => {
    expect(corruption(true, DEMOCRACY)).equal(0);
    expect(corruption(true, REPUBLIC)).equal(
      Math.trunc((10 * 28 * 3) / (8 * 20))
    );
  });
});

describe('waste in a city', (): void => {
  const setUp = async (
    government = Monarchy,
    {
      palace = true,
      building = null,
    }: { palace?: boolean; building?: unknown } = {}
  ) => {
    const ruleRegistry = new RuleRegistry(),
      landMassRegistry = new LandMassRegistry(),
      cityRegistry = new CityRegistry(),
      cityImprovementRegistry = new CityImprovementRegistry(),
      tileImprovementRegistry = new TileImprovementRegistry(),
      pendingEffectRegistry = new PendingEffectRegistry(),
      water = '~'.repeat(60),
      world = await mapWorld(
        [
          water,
          water,
          water,
          water,
          water,
          '~~' + '.'.repeat(24) + '~'.repeat(34),
          water,
          water,
          water,
          water,
        ],
        ruleRegistry,
        landMassRegistry
      ),
      player = new Player(ruleRegistry),
      city = (x: number): City => {
        const built = new City(player, world.get(x, 5), 'city', ruleRegistry);

        cityRegistry.register(built);
        tileImprovementRegistry.register(
          new Road(world.get(x, 5), ruleRegistry)
        );

        return built;
      },
      capital = city(2),
      other = city(12),
      added: number[] = [];

    if (palace) {
      cityImprovementRegistry.register(new Palace(capital, ruleRegistry));
    }

    ruleRegistry.register(
      // 30 shields and 20 trade from the squares, a third more shields from a Factory-like modifier, and 2 shields'
      //  support.
      new YieldRule(
        'test:squares',
        new Priority(0),
        new Effect((): Yield[] => [new Production(30), new Trade(20)])
      ),
      new YieldModifier(
        'test:factory',
        new Effect(
          (city: City, yields: Yield[], base: Yield[]): Yield =>
            new Production(reduceYield(base, Production) >> 2)
        )
      ),
      new Cost(
        'test:support',
        new Criterion((city: City): boolean => city === other),
        new Effect((): Yield => new UnitSupportProduction(2))
      ),
      ...corruptionRules({
        cityImprovementRegistry,
        cityRegistry,
        landMassRegistry,
        tileImprovementRegistry,
        pendingEffectRegistry,
        playerGovernmentRegistry: governedBy(government),
        gameDifficultyRegistry: atLevel(0),
        clientRegistry: playedBy(),
        playerResearchRegistry: {
          getByPlayer: () => ({ completed: () => false }),
        } as any,
        unitRegistry: { getByTile: () => [] } as any,
        cityBuildRegistry: {
          getByCity: () => ({
            building: () =>
              building === null ? null : { item: () => building },
            add: (production: Yield) => added.push(production.value()),
            check: () => {},
          }),
        } as any,
      }),
      ...processYield(
        {
          getByCity: () => ({
            add: (production: Yield) => added.push(production.value()),
            check: () => {},
          }),
        } as any,
        undefined,
        undefined,
        ruleRegistry
      )
    );

    return {
      ruleRegistry,
      tileImprovementRegistry,
      cityImprovementRegistry,
      pendingEffectRegistry,
      world,
      capital,
      other,
      added,
    };
  };

  it('takes waste from the shields after the bonuses and the support, and the build gets the rest', async (): Promise<void> => {
    const { other, added, ruleRegistry } = await setUp(),
      yields = other.yields(),
      [wasted] = yields.filter((cityYield) => cityYield instanceof Waste);

    // 30 + 7 = 37 shields less 2: distance 10, 10 × 35 × 3 / 120 = 8; no link; / 2 = 4.
    expect(wasted.value()).equal(-4);
    expect(reduceYield(yields, Production)).equal(37 - 2 - 4);
    // Trade corruption as before: 10 × 20 × 3 / 120 = 5.
    expect(reduceYield(yields, Corruption)).equal(-5);
    expect(reduceYield(yields, Trade)).equal(15);

    const production = new Production(reduceYield(yields, Production));

    ruleRegistry.process(ProcessYield, production, other, yields);

    expect(added).eql([31]);
  });

  it('wastes less along a road to the capital', async (): Promise<void> => {
    const { other, tileImprovementRegistry, world } = await setUp();

    [3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((x) =>
      tileImprovementRegistry.register(new Road(world.get(x, 5)))
    );

    // 8 × 2 / 3 = 5, / 2 = 2.
    expect(reduceYield(other.yields(), Waste)).equal(-2);
  });

  it('wastes less with a Courthouse, halving before the link', async (): Promise<void> => {
    const { other, cityImprovementRegistry } = await setUp();

    cityImprovementRegistry.register(new Courthouse(other));

    // 8 halved 4, / 2 = 2.
    expect(reduceYield(other.yields(), Waste)).equal(-2);
  });

  it("uses the next government's divisor while the city celebrates (lib/celebrating)", async (): Promise<void> => {
    const { other, pendingEffectRegistry } = await setUp();

    pendingEffectRegistry.register(
      new PendingEffect(LEADER_CELEBRATION, other)
    );

    expect(celebrating(other, pendingEffectRegistry)).true;
    // 10 × 35 × 3 / 140 = 7, / 2 = 3; trade 10 × 20 × 3 / 140 = 4.
    expect(reduceYield(other.yields(), Waste)).equal(-3);
    expect(reduceYield(other.yields(), Corruption)).equal(-4);
  });

  it('has none in the capital itself, outside Communism', async (): Promise<void> => {
    const { capital } = await setUp(Despotism);

    expect(capital.yields().some((cityYield) => cityYield instanceof Waste))
      .false;
  });

  it('has none while a city builds the Palace with no capital to measure from, and 16 counted otherwise', async (): Promise<void> => {
    const building = await setUp(Monarchy, { palace: false, building: Palace });

    expect(reduceYield(building.other.yields(), Waste)).equal(0);

    // 16 × 35 × 3 / 120 = 14, / 2 = 7.
    const notBuilding = await setUp(Monarchy, { palace: false });

    expect(reduceYield(notBuilding.other.yields(), Waste)).equal(-7);
  });
});
