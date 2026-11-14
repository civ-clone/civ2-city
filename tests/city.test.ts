import { Entertainer, Scientist, TaxCollector } from '../Specialists';
import { Food, Gold, Luxuries, Research } from '../Yields';
import { atLevel, instanceOf, playedBy } from './lib/stubs';
import {
  generateGenerator,
  generateWorld,
} from '@civ-clone/core-world/tests/lib/buildWorld';
import AvailableSpecialistRegistry from '@civ-clone/core-city/AvailableSpecialistRegistry';
import City from '@civ-clone/core-city/City';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Irrigation from '@civ-clone/base-tile-improvement-irrigation/Irrigation';
import { Land } from '@civ-clone/core-terrain/Types';
import Player from '@civ-clone/core-player/Player';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import Road from '@civ-clone/base-tile-improvement-road/Road';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Specialist from '@civ-clone/core-city/Specialist';
import SpecialistRegistry from '@civ-clone/core-city/SpecialistRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import WorkedTileRegistry from '@civ-clone/core-city/WorkedTileRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import canBeWorked from '../Rules/City/can-be-worked';
import created from '../Rules/City/created';
import { expect } from 'chai';
import foodStorage from '../Rules/City/food-storage';
import grow from '../Rules/City/grow';
import growthCost from '../Rules/City/growth-cost';
import registerAvailableSpecialists from '../registerAvailableSpecialists';
import shrink from '../Rules/City/shrink';
import tiles from '../Rules/City/tiles';
import yieldRules from '../Rules/City/yield';

describe('a city', (): void => {
  const setUp = async (level: number | null = null, human = false) => {
    const ruleRegistry = new RuleRegistry(),
      tileImprovementRegistry = new TileImprovementRegistry(),
      cityRegistry = new CityRegistry(),
      cityBuildRegistry = new CityBuildRegistry(),
      cityGrowthRegistry = new CityGrowthRegistry(),
      playerWorldRegistry = new PlayerWorldRegistry(),
      workedTileRegistry = new WorkedTileRegistry(ruleRegistry),
      specialistRegistry = new SpecialistRegistry(),
      availableSpecialistRegistry = new AvailableSpecialistRegistry(),
      player = new Player(ruleRegistry),
      difficulty =
        level === null ? ({ get: () => null } as any) : atLevel(level),
      clients = human ? playedBy(player) : playedBy();

    registerAvailableSpecialists(availableSpecialistRegistry);

    ruleRegistry.register(
      ...tiles(),
      ...canBeWorked(cityRegistry, undefined, workedTileRegistry),
      ...created(
        tileImprovementRegistry,
        cityBuildRegistry,
        cityGrowthRegistry,
        cityRegistry,
        playerWorldRegistry,
        ruleRegistry,
        undefined,
        undefined,
        workedTileRegistry,
        specialistRegistry,
        availableSpecialistRegistry
      ),
      ...foodStorage(ruleRegistry),
      ...grow(
        cityGrowthRegistry,
        playerWorldRegistry,
        workedTileRegistry,
        specialistRegistry,
        availableSpecialistRegistry,
        { emit: () => {} } as any
      ),
      ...shrink(workedTileRegistry, specialistRegistry, {
        emit: () => {},
      } as any),
      ...growthCost(difficulty, clients)
    );

    const world = await generateWorld(
      generateGenerator(9, 9, Land),
      ruleRegistry
    );

    playerWorldRegistry.register(new PlayerWorld(player, world));
    world
      .entries()
      .forEach((tile) =>
        playerWorldRegistry.getByPlayer(player).register(tile)
      );

    const city = new City(
      player,
      world.get(4, 4),
      'city',
      ruleRegistry,
      workedTileRegistry
    );

    return {
      city,
      cityGrowth: cityGrowthRegistry.getByCity(city),
      cityRegistry,
      cityBuildRegistry,
      tileImprovementRegistry,
      workedTileRegistry,
      specialistRegistry,
    };
  };

  it('is founded with its build, its growth, a road and irrigation, and works its centre and one square', async (): Promise<void> => {
    const {
      city,
      cityRegistry,
      cityBuildRegistry,
      tileImprovementRegistry,
      workedTileRegistry,
    } = await setUp();

    expect(cityRegistry.entries()).eql([city]);
    expect(cityBuildRegistry.getByCity(city).cleared()?.reason).equal(
      'created'
    );
    expect(
      tileImprovementRegistry
        .getByTile(city.tile())
        .map((improvement) => improvement.constructor)
    ).members([Irrigation, Road]);
    expect(city.tiles().length).equal(21);
    expect(workedTileRegistry.getByCity(city).length).equal(2);
    expect(workedTileRegistry.getByTile(city.tile())?.city()).equal(city);
  });

  it("grows once its box holds (size + 1) × 10, the human's rows", async (): Promise<void> => {
    const { cityGrowth, workedTileRegistry, city } = await setUp(5, true);

    expect(cityGrowth.cost().value()).equal(20);

    cityGrowth.add(new Food(19));
    cityGrowth.check();

    expect(cityGrowth.size()).equal(1);

    cityGrowth.add(new Food(1));
    cityGrowth.check();

    expect(cityGrowth.size()).equal(2);
    expect(cityGrowth.progress().value()).equal(0);
    expect(cityGrowth.cost().value()).equal(30);
    expect(workedTileRegistry.getByCity(city).length).equal(3);
  });

  it("grows a computer player's city by its level's rows: 15 on Chieftain, 10 at King (or no level), 8 on Deity", async (): Promise<void> => {
    expect((await setUp(0)).cityGrowth.cost().value()).equal(30);
    expect((await setUp(3)).cityGrowth.cost().value()).equal(20);
    expect((await setUp(null)).cityGrowth.cost().value()).equal(20);

    const { cityGrowth } = await setUp(5);

    expect(cityGrowth.cost().value()).equal(16);

    cityGrowth.grow();

    expect(cityGrowth.cost().value()).equal(24);

    cityGrowth.shrink();

    expect(cityGrowth.cost().value()).equal(16);
  });

  it('puts citizens past the squares it can work to work as specialists, and is destroyed when it shrinks to nothing', async (): Promise<void> => {
    const { city, cityGrowth, workedTileRegistry, specialistRegistry } =
      await setUp();

    while (cityGrowth.size() < 22) {
      cityGrowth.grow();
    }

    expect(workedTileRegistry.getByCity(city).length).equal(21);
    expect(specialistRegistry.getByCity(city).length).equal(2);
    expect(
      specialistRegistry
        .getByCity(city)
        .every((specialist) => specialist instanceof Entertainer)
    ).true;

    while (cityGrowth.size() > 2) {
      cityGrowth.shrink();
    }

    expect(
      workedTileRegistry.getByCity(city).length +
        specialistRegistry.getByCity(city).length
    ).equal(3);

    cityGrowth.shrink();
    cityGrowth.shrink();

    expect(city.destroyed()).true;
  });
});

describe('specialists', (): void => {
  it('offers Entertainers, Tax Collectors and Scientists, in that order, once', (): void => {
    const available = new AvailableSpecialistRegistry();

    registerAvailableSpecialists(available);
    registerAvailableSpecialists(available);

    expect(available.entries()).eql([Entertainer, TaxCollector, Scientist]);
  });

  it('yields 2 luxuries an Entertainer, 3 gold a Tax Collector and 3 research a Scientist', (): void => {
    const ruleRegistry = new RuleRegistry(),
      city = instanceOf(City),
      specialists: Specialist[] = [
        instanceOf(Entertainer),
        instanceOf(Entertainer),
        instanceOf(TaxCollector),
        instanceOf(Scientist),
      ];

    ruleRegistry.register(
      ...yieldRules(undefined, undefined, {
        getByCity: () => specialists,
      } as any).filter((rule) => rule.id()!.includes('/specialist/'))
    );

    const yields = ruleRegistry.process(YieldRule, city, []).flat() as Yield[],
      total = (Type: typeof Yield) =>
        yields
          .filter((cityYield) => cityYield instanceof Type)
          .reduce((sum, cityYield) => sum + cityYield.value(), 0);

    expect(total(Luxuries)).equal(4);
    expect(total(Gold)).equal(3);
    expect(total(Research)).equal(3);
  });
});
