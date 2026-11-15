import { Food, Production, Trade } from '../Yields';
import {
  Forest,
  Glacier,
  Grassland,
  Hills,
  Mountains,
  Ocean,
  Plains,
} from '@civ-clone/civ2-world/Terrains';
import {
  Despotism,
  Monarchy,
  Republic,
} from '@civ-clone/civ2-government/Governments';
import {
  Irrigation,
  Mine,
  Pollution,
  Railroad,
  Road,
} from '@civ-clone/civ2-world/TileImprovements';
import { tileYieldPriority, tileYieldSteps } from '../lib/tileYieldPipeline';
import City from '@civ-clone/core-city/City';
import CityTileYield from '@civ-clone/core-city/Rules/CityTileYield';
import Effect from '@civ-clone/core-rule/Effect';
import Government from '@civ-clone/core-government/Government';
import { LEADER_CELEBRATION } from '../lib/celebrating';
import LandMassRegistry from '@civ-clone/core-world/LandMassRegistry';
import Player from '@civ-clone/core-player/Player';
import RailroadAdvance from '@civ-clone/base-science-advance-railroad/Railroad';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import TerrainFeatureRegistry from '@civ-clone/core-terrain-feature/TerrainFeatureRegistry';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import { expect } from 'chai';
import mapWorld from './lib/mapWorld';
import tileYield from '../Rules/City/tile-yield';
import worldTileYield from '@civ-clone/civ2-world/Rules/Tile/yield';
import worldYieldModifier from '@civ-clone/civ2-world/Rules/Tile/yield-modifier';

// OpenCiv2 `src/auto/city.cpp` `city_tile_yield` (richardpenman/civ2@49f26ec), worked by hand for each case.
describe('what a square gives its city', (): void => {
  const setUp = async (
    government: typeof Government = Despotism,
    {
      celebrating = false,
      knowsRailroad = false,
    }: { celebrating?: boolean; knowsRailroad?: boolean } = {}
  ) => {
    const ruleRegistry = new RuleRegistry(),
      tileImprovementRegistry = new TileImprovementRegistry(),
      terrainFeatureRegistry = new TerrainFeatureRegistry(),
      playerGovernmentRegistry = {
        getByPlayer: () => ({
          is: (...Types: (typeof Government)[]) =>
            Types.some((Type) => Type === government),
          get: () => new government(),
        }),
      } as any,
      playerResearchRegistry = {
        getByPlayer: () => ({
          completed: (Advance: unknown) =>
            knowsRailroad && Advance === RailroadAdvance,
        }),
      } as any,
      pendingEffects = {
        getByTarget: () =>
          celebrating ? [{ handler: () => LEADER_CELEBRATION }] : [],
      } as any,
      world = await mapWorld(
        ['.....', '.....', '.....', '.....', '.....'],
        ruleRegistry,
        new LandMassRegistry()
      ),
      player = new Player(ruleRegistry);

    ruleRegistry.register(
      ...worldTileYield(tileImprovementRegistry, terrainFeatureRegistry),
      ...worldYieldModifier(tileImprovementRegistry, playerGovernmentRegistry)
    );

    const centre = world.get(2, 2),
      city = new City(player, centre, 'Test', ruleRegistry),
      square = (
        x: number,
        y: number,
        TerrainType: typeof Terrain,
        ...Improvements: (typeof TileImprovement)[]
      ): Tile => {
        const tile = world.get(x, y);

        tile.setTerrain(new TerrainType());
        Improvements.forEach((Improvement) =>
          tileImprovementRegistry.register(new Improvement(tile))
        );
        tile.clearYieldCache(player);

        return tile;
      },
      addCityRules = () =>
        ruleRegistry.register(
          ...tileYield(
            tileImprovementRegistry,
            playerGovernmentRegistry,
            playerResearchRegistry,
            pendingEffects
          )
        ),
      totals = (yields: Yield[]): [number, number, number] =>
        [Food, Production, Trade].map((YieldType) =>
          yields
            .filter((tileYield) => tileYield instanceof YieldType)
            .reduce((total, tileYield) => total + tileYield.value(), 0)
        ) as [number, number, number],
      // A `CityTileYield` rule adding 1 of `YieldType` at `step`, as a building's or a Wonder's would.
      plusOne = (
        step: keyof typeof tileYieldSteps,
        YieldType: typeof Yield
      ): CityTileYield =>
        new CityTileYield(
          tileYieldPriority(step),
          new Effect((city: City, tile: Tile, yields: Yield[]) =>
            yields.push(new YieldType(1, step))
          )
        );

    return {
      addCityRules,
      centre,
      city,
      player,
      ruleRegistry,
      square,
      totals,
      plusOne,
    };
  };

  it('has 100 between steps, in the code’s order', (): void => {
    const values = Object.values(tileYieldSteps);

    expect(values).to.eql([...values].sort((a, b) => a - b));
    values.forEach((value, index) => expect(value).to.equal((index + 1) * 100));
  });

  it('gives what the square gives alone, with no building, Wonder or celebration', async (): Promise<void> => {
    for (const government of [Despotism, Monarchy, Republic]) {
      const { addCityRules, city, player, square, totals } = await setUp(
          government
        ),
        tiles = [
          square(0, 0, Grassland, Irrigation, Road),
          square(1, 0, Hills, Mine, Road, Railroad),
          square(2, 0, Plains, Irrigation, Road, Pollution),
          square(3, 0, Ocean),
          square(4, 0, Mountains, Mine, Railroad, Pollution),
        ],
        before = tiles.map((tile) => totals(tile.yields(player)));

      addCityRules();

      tiles.forEach((tile, index) =>
        expect(totals(city.tileYields(tile))).to.eql(before[index])
      );
    }
  });

  it('works the railroad, the Despotism penalty and pollution after a city’s +1', async (): Promise<void> => {
    const { addCityRules, city, ruleRegistry, square, totals, plusOne } =
        await setUp(Despotism),
      // Hills with a mine: 0 + 3 shields. King Richard's +1 makes 4, the railroad 4 + 2 = 6, Despotism 5. Without the
      //  city's step: 3 + 1 = 4, 3. The city gains 2, not 1.
      hills = square(1, 0, Hills, Mine, Road, Railroad);

    addCityRules();
    ruleRegistry.register(plusOne('kingRichards', Production));

    expect(totals(city.tileYields(hills))[1]).to.equal(5);

    // Plains with irrigation, a road and pollution: food 1 + 1 = 2, a Supermarket-like +1 at its step makes 3, Despotism
    //  2, pollution (2 + 1) >> 1 = 1. Shields 1 → 1. Trade 0 + 1 (road) = 1 → 1.
    const plains = square(2, 0, Plains, Irrigation, Road, Pollution);

    ruleRegistry.register(plusOne('supermarket', Food));

    expect(totals(city.tileYields(plains))).to.eql([1, 1, 1]);
  });

  it('takes no Despotism penalty off, and gives Monarchy the trade bonus, while celebrating', async (): Promise<void> => {
    const despotism = await setUp(Despotism, { celebrating: true }),
      // Grassland, irrigated, with a road: 2 + 1 food, 0 shields, 0 + 1 trade. Alone, Despotism takes the food to 2.
      grassland = despotism.square(0, 0, Grassland, Irrigation, Road);

    expect(despotism.totals(grassland.yields(despotism.player))).to.eql([
      2, 0, 1,
    ]);

    despotism.addCityRules();

    expect(despotism.totals(despotism.city.tileYields(grassland))).to.eql([
      3, 0, 1,
    ]);

    const monarchy = await setUp(Monarchy, { celebrating: true }),
      plains = monarchy.square(0, 0, Grassland, Irrigation, Road);

    monarchy.addCityRules();

    // Celebrating from Monarchy up gains the trade bonus: 1 + 1.
    expect(monarchy.totals(monarchy.city.tileYields(plains))).to.eql([3, 0, 2]);
  });

  it('adds the Colossus’ trade before the Republic’s bonus', async (): Promise<void> => {
    const { addCityRules, city, ruleRegistry, square, totals, plusOne } =
        await setUp(Republic),
      // Ocean: 1 food, 0 shields, 2 trade. Colossus +1 makes 3, the Republic +1 makes 4.
      ocean = square(3, 0, Ocean);

    addCityRules();
    ruleRegistry.register(plusOne('colossusOcean', Trade));

    expect(totals(city.tileYields(ocean))).to.eql([1, 0, 4]);
  });

  it('counts the city’s square as mined where it can’t be irrigated, and gives it at least 1 shield', async (): Promise<void> => {
    const glacier = await setUp(Monarchy);

    glacier.square(2, 2, Glacier, Irrigation, Road);
    glacier.addCityRules();

    // Glacier: nothing at all, and no irrigation bonus, so mined: +1 shield. (Mountains has an irrigation bonus of 1 in
    //  the terrain table, so its city square gets 1 food from the city's irrigation instead, and no mine.)
    expect(glacier.totals(glacier.city.tileYields(glacier.centre))).to.eql([
      0, 1, 0,
    ]);

    const grassland = await setUp(Monarchy);

    grassland.square(2, 2, Grassland, Irrigation, Road);
    grassland.addCityRules();

    // Grassland without its shield: 0 shields → 1.
    expect(
      grassland.totals(grassland.city.tileYields(grassland.centre))
    ).to.eql([3, 1, 1]);
  });

  it('gives the city’s square the railroad’s half again once Railroad is known', async (): Promise<void> => {
    const known = await setUp(Monarchy, { knowsRailroad: true });

    known.square(2, 2, Hills, Irrigation, Road);
    known.addCityRules();

    // Hills: 0 shields → the centre's minimum 1; half of 1 is 0.
    expect(known.totals(known.city.tileYields(known.centre))[1]).to.equal(1);

    const forest = await setUp(Monarchy, { knowsRailroad: true });

    forest.square(2, 2, Forest, Irrigation, Road);
    forest.addCityRules();

    // Forest: 2 shields, + 1.
    expect(forest.totals(forest.city.tileYields(forest.centre))[1]).to.equal(3);
  });
});
