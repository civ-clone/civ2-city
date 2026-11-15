import CapitalLink, {
  diagonalDistance,
  moveDistance,
} from '../lib/capitalLink';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import Barbarian from '@civ-clone/base-civilization-barbarian/Barbarian';
import City from '@civ-clone/core-city/City';
import CityImprovementRegistry from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import LandMassRegistry from '@civ-clone/core-world/LandMassRegistry';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import Player from '@civ-clone/core-player/Player';
import Railroad from '@civ-clone/base-tile-improvement-railroad/Railroad';
import Road from '@civ-clone/base-tile-improvement-road/Road';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import World from '@civ-clone/core-world/World';
import { expect } from 'chai';
import { instanceOf } from './lib/stubs';
import mapWorld from './lib/mapWorld';

// OpenCiv2 `city_calc_capital_link` (`src/auto/city.cpp`) and `map_road_connection` (`src/auto/map.cpp`),
//  richardpenman/civ2@49f26ec.

// Wide enough that no route is shorter the other way round the world, and with water around everything.
const width = 60,
  water = '~'.repeat(width),
  /** A row with land from `from` to `to`. */
  strip = (from: number, to: number): string =>
    '~'.repeat(from) + '.'.repeat(to - from + 1) + '~'.repeat(width - to - 1),
  /** Ten rows, water but for `rows` (by row number). */
  layout = (rows: { [row: number]: string }): string[] =>
    new Array(10).fill(0).map((_, y) => rows[y] ?? water),
  corridor = layout({ 5: strip(2, 25) });

describe('CapitalLink', (): void => {
  const setUp = async (
    rows: string[] = corridor,
    {
      railroadKnown = false,
      allied = false,
      topologyId = 'square',
    }: { railroadKnown?: boolean; allied?: boolean; topologyId?: string } = {}
  ) => {
    // Each `link.of` in these tests asks about the squares as they are then: a turn of its own (`nextTurn`).
    const turnValue = { value: 1 },
      nextTurn = (): void => {
        turnValue.value++;
      },
      ruleRegistry = new RuleRegistry(),
      landMassRegistry = new LandMassRegistry(),
      cityRegistry = new CityRegistry(),
      cityImprovementRegistry = new CityImprovementRegistry(),
      tileImprovementRegistry = new TileImprovementRegistry(),
      units: Unit[] = [],
      world: World = await mapWorld(rows, ruleRegistry, landMassRegistry, {
        topologyId,
      }),
      player = new Player(ruleRegistry),
      rival = new Player(ruleRegistry),
      barbarian = instanceOf(Player, {
        civilization: () => instanceOf(Barbarian),
      }),
      link = new CapitalLink({
        cityImprovementRegistry,
        cityRegistry,
        landMassRegistry,
        tileImprovementRegistry,
        playerResearchRegistry: {
          getByPlayer: () => ({ completed: () => railroadKnown }),
        } as any,
        unitRegistry: {
          getByTile: (tile: unknown) =>
            units.filter((unit) => unit.tile() === tile),
        } as any,
        allied: () => allied,
        turn: { value: () => turnValue.value } as any,
      }),
      city = (x: number, y: number, owner: Player = player): City => {
        const built = new City(owner, world.get(x, y), 'city', ruleRegistry);

        cityRegistry.register(built);
        // As civ2-city founds a city: with a road on its square.
        tileImprovementRegistry.register(
          new Road(world.get(x, y), ruleRegistry)
        );

        return built;
      },
      improve = (built: City, Improvement: typeof CityImprovement): void =>
        cityImprovementRegistry.register(new Improvement(built, ruleRegistry)),
      road = (y: number, ...xs: number[]): void =>
        xs.forEach((x) =>
          tileImprovementRegistry.register(
            new Road(world.get(x, y), ruleRegistry)
          )
        ),
      railroad = (y: number, ...xs: number[]): void =>
        xs.forEach((x) =>
          tileImprovementRegistry.register(
            new Railroad(world.get(x, y), ruleRegistry)
          )
        ),
      unit = (x: number, y: number, owner: Player): void => {
        units.push(
          instanceOf(Unit, {
            tile: () => world.get(x, y),
            player: () => owner,
          })
        );
      },
      range = (from: number, to: number): number[] =>
        new Array(to - from + 1).fill(0).map((_, i) => from + i);

    const of = link.of.bind(link);

    // Every expectation below changes the squares first; as Civ2 works the link out once a turn, each is a new turn.
    link.of = (...args: Parameters<CapitalLink['of']>) => {
      nextTurn();

      return of(...args);
    };

    return {
      world,
      player,
      rival,
      barbarian,
      link,
      of,
      nextTurn,
      city,
      improve,
      road,
      railroad,
      unit,
      range,
    };
  };

  describe('within a turn', (): void => {
    it('keeps each city’s link and each player’s Palaces until the next turn or `invalidateCapitals()`', async (): Promise<void> => {
      const { city, improve, link, of, road, railroad, nextTurn, range } =
          await setUp(),
        capital = city(2, 5),
        other = city(8, 5);

      improve(capital, Palace);
      road(5, ...range(3, 7));

      expect(of(other).link).equal(1);

      // A railroad built during the turn counts from the next.
      railroad(5, ...range(2, 8));

      expect(of(other).link).equal(1);

      nextTurn();

      expect(of(other).link).equal(2);

      // A new Palace counts at once (civ2-city calls `invalidateCapitals()` when an improvement is built).
      const nearer = city(6, 5);

      improve(nearer, Palace);

      expect(of(other).distance).equal(6);

      link.invalidateCapitals();

      expect(of(other).distance).equal(2);
    });
  });

  describe('distances', (): void => {
    it('measures map_distance_diag as the longer gap plus half the shorter, and map_distance as the longer', async (): Promise<void> => {
      const { world } = await setUp(layout({ 0: strip(0, 59) }));

      expect(diagonalDistance(world.get(2, 0), world.get(9, 0))).equal(7);
      expect(diagonalDistance(world.get(2, 5), world.get(9, 8))).equal(8);
      expect(diagonalDistance(world.get(2, 5), world.get(9, 9))).equal(9);
      expect(moveDistance(world.get(2, 5), world.get(9, 9))).equal(7);
    });
  });

  describe('the capital', (): void => {
    it('is linked 1 to itself, or 2 once its player knows Railroad (the advance, not the squares)', async (): Promise<void> => {
      const { city, improve, link } = await setUp(),
        capital = city(2, 5);

      improve(capital, Palace);

      expect(link.of(capital)).eql({ distance: 0, nearest: null, link: 1 });

      const railroad = await setUp(corridor, { railroadKnown: true }),
        capital2 = railroad.city(2, 5);

      railroad.improve(capital2, Palace);

      expect(railroad.link.of(capital2).link).equal(2);
    });

    it('is 32 away, with no link, when its player has no Palace', async (): Promise<void> => {
      const { city, link } = await setUp();

      expect(link.of(city(8, 5))).eql({ distance: 32, nearest: null, link: 0 });
    });
  });

  describe('a road to the capital', (): void => {
    it('is 1 when every square between has a road, 2 when every one has a railroad', async (): Promise<void> => {
      const { city, improve, road, railroad, link } = await setUp(),
        capital = city(2, 5),
        other = city(8, 5);

      improve(capital, Palace);
      road(5, 3, 4, 5, 6, 7);

      expect(link.of(other).distance).equal(6);
      expect(link.of(other).nearest === capital).true;
      expect(link.of(other).link).equal(1);

      railroad(5, 3, 4, 5, 6);

      expect(link.of(other).link).equal(1);

      railroad(5, 7);

      expect(link.of(other).link).equal(2);
    });

    it('is 0 at the first square without a road', async (): Promise<void> => {
      const { city, improve, road, link } = await setUp(),
        capital = city(2, 5),
        other = city(8, 5);

      improve(capital, Palace);
      road(5, 3, 4, 6, 7);

      expect(link.of(other).link).equal(0);
    });

    it('is 2 for two cities side by side, as no square between them is checked', async (): Promise<void> => {
      const { city, improve, link } = await setUp(),
        capital = city(2, 5),
        other = city(3, 5);

      improve(capital, Palace);

      expect(link.of(other).link).equal(2);
    });

    it("ends at the first of the player's own cities it reaches", async (): Promise<void> => {
      const { city, improve, road, link } = await setUp(),
        capital = city(2, 5),
        other = city(8, 5);

      improve(capital, Palace);
      city(5, 5);
      road(5, 6, 7);

      expect(link.of(other).link).equal(1);
    });

    it("is blocked by another player's city, the barbarians' too, unless allied", async (): Promise<void> => {
      for (const owner of ['rival', 'barbarian'] as const) {
        const set = await setUp(),
          capital = set.city(2, 5),
          other = set.city(8, 5);

        set.improve(capital, Palace);
        set.road(5, 3, 4, 6, 7);
        set.city(5, 5, set[owner]);

        expect(set.link.of(other).link, owner).equal(0);
      }

      const allied = await setUp(corridor, { allied: true }),
        capital = allied.city(2, 5),
        other = allied.city(8, 5);

      allied.improve(capital, Palace);
      allied.road(5, 3, 4, 6, 7);
      allied.city(5, 5, allied.rival);

      expect(allied.link.of(other).link).equal(1);
    });

    it("is blocked by another player's unit, but not by a barbarian's or an ally's", async (): Promise<void> => {
      const set = await setUp(),
        capital = set.city(2, 5),
        other = set.city(8, 5);

      set.improve(capital, Palace);
      set.road(5, 3, 4, 5, 6, 7);
      set.unit(5, 5, set.barbarian);
      set.unit(6, 5, set.player);

      expect(set.link.of(other).link).equal(1);

      set.unit(4, 5, set.rival);

      expect(set.link.of(other).link).equal(0);

      const allied = await setUp(corridor, { allied: true }),
        alliedCapital = allied.city(2, 5),
        alliedOther = allied.city(8, 5);

      allied.improve(alliedCapital, Palace);
      allied.road(5, 3, 4, 5, 6, 7);
      allied.unit(4, 5, allied.rival);

      expect(allied.link.of(alliedOther).link).equal(1);
    });

    it('gives up at a distance of 23', async (): Promise<void> => {
      const near = await setUp(),
        nearCapital = near.city(2, 5),
        nearOther = near.city(24, 5);

      near.improve(nearCapital, Palace);
      near.road(5, ...near.range(3, 23));

      expect(near.link.of(nearOther)).eql({
        distance: 22,
        nearest: nearCapital,
        link: 1,
      });

      const far = await setUp(layout({ 5: strip(2, 26) })),
        farCapital = far.city(2, 5),
        farOther = far.city(25, 5);

      far.improve(farCapital, Palace);
      far.road(5, ...far.range(3, 24));

      expect(far.link.of(farOther).link).equal(0);
    });

    it("takes the pathfinder's one route: ties go nearer the goal, then to the first of Civ2's directions", async (): Promise<void> => {
      // Open land: from (8, 5) to (2, 5) the walk goes (7, 6), (6, 6), (5, 6), (4, 6), (3, 6) (`map_path_pick_dir`),
      //  so a straight road along row 5 doesn't count.
      const open = layout({
        2: strip(2, 25),
        3: strip(2, 25),
        4: strip(2, 25),
        5: strip(2, 25),
        6: strip(2, 25),
        7: strip(2, 25),
      });

      const straight = await setUp(open),
        straightCapital = straight.city(2, 5),
        straightOther = straight.city(8, 5);

      straight.improve(straightCapital, Palace);
      straight.road(5, 3, 4, 5, 6, 7);

      expect(straight.link.of(straightOther).link).equal(0);

      const taken = await setUp(open),
        takenCapital = taken.city(2, 5),
        takenOther = taken.city(8, 5);

      taken.improve(takenCapital, Palace);
      taken.road(6, 3, 4, 5, 6, 7);

      expect(taken.link.of(takenOther).link).equal(1);
    });

    it('walks the same on a staggered isometric grid', async (): Promise<void> => {
      // Squares side by side in a row share a corner: a logical step of (1, −1), so (2, 5) to (8, 5) is 6 king's moves
      //  and 6 + 3 by map_distance_diag.
      const set = await setUp(corridor, { topologyId: 'staggered-iso' }),
        capital = set.city(2, 5),
        other = set.city(8, 5);

      set.improve(capital, Palace);
      set.road(5, 3, 4, 6, 7);

      expect(set.link.of(other).distance).equal(9);
      expect(set.link.of(other).link).equal(0);

      set.road(5, 5);

      expect(set.link.of(other).link).equal(1);
    });
  });

  describe('land masses and airports', (): void => {
    const split = layout({
      5: strip(2, 5).slice(0, 7) + strip(7, 25).slice(7),
    });

    it('is 0 to a capital on another land mass, or 1 with an airport at each end', async (): Promise<void> => {
      const set = await setUp(split),
        capital = set.city(2, 5),
        other = set.city(8, 5);

      set.improve(capital, Palace);
      set.road(5, 3, 4, 5, 7);

      expect(set.link.of(other).link).equal(0);

      set.improve(capital, Airport);
      set.improve(other, Airport);

      expect(set.link.of(other).link).equal(1);
    });

    it("on the same land mass, takes the road's answer over the airports', even when that's 0", async (): Promise<void> => {
      const set = await setUp(),
        capital = set.city(2, 5),
        other = set.city(8, 5);

      set.improve(capital, Palace);
      set.improve(capital, Airport);
      set.improve(other, Airport);

      expect(set.link.of(other).link).equal(0);
    });
  });
});
