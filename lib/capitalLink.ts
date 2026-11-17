import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  LandMassRegistry,
  instance as landMassRegistryInstance,
} from '@civ-clone/core-world/LandMassRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import RouteNetwork, {
  Link,
  NONE,
  RAILROAD,
  ROAD,
} from '@civ-clone/base-route-link/lib/RouteNetwork';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import LandMass from '@civ-clone/core-world/LandMass';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import Player from '@civ-clone/core-player/Player';
import Railroad from '@civ-clone/base-tile-improvement-railroad/Railroad';
import RailroadAdvance from '@civ-clone/base-science-advance-railroad/Railroad';
import Road from '@civ-clone/base-tile-improvement-road/Road';
import Tile from '@civ-clone/core-world/Tile';
import { isBarbarian } from '@civ-clone/base-civilization-barbarian/isBarbarian';
import { noCapitalDistance } from '../data/cityRules';

// Civilization II's link between a city and its capital, for shield waste, ported from OpenCiv2
//  (richardpenman/civ2@49f26ec): `city_calc_capital_link` (`src/auto/city.cpp`), `map_road_connection` and the
//  pathfinder it drives with `road_planning` set (`map_path_next_dir`, `map_path_flood`, `map_path_pick_dir`,
//  `src/auto/map.cpp`). Civ2's coordinates are half-tile columns and rows; its distances, written in the logical axes
//  of the grid (`ITopology.logicalDelta`: the square grid's own, the staggered isometric grid's `a` and `b`), are:
//  `map_distance` the longer gap (king's moves) and `map_distance_diag` the longer gap plus half the shorter, rounded
//  down.

export { Link, NONE, ROAD, RAILROAD };

/** `map_road_connection` gives up at this distance (`map_distance`) or more. */
export const linkDistance = 23;

/** `map_road_connection` gives up after more than this many squares. */
export const linkSteps = 50;

/** The pathfinder's cost grid is 48 × 48 around the goal: no square further than this from it (`map_path_flood`). */
export const floodRadius = 23;

/**
 * Civ2's eight directions in its own order (`dir_dx_table`/`dir_dy_table`, `src/data/gamedata.cpp`: (1, −1), (2, 0),
 *  (1, 1), (0, 2), (−1, 1), (−2, 0), (−1, −1), (0, −2)), as logical steps. The order breaks the pathfinder's ties.
 */
const directions: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

const logicalDelta = (from: Tile, to: Tile): [number, number] | null =>
  from.map().topology().logicalDelta(from.x(), from.y(), to.x(), to.y());

/** `map_distance_diag`: the longer logical gap plus half the shorter, rounded down. */
export const diagonalDistance = (from: Tile, to: Tile): number => {
  const delta = logicalDelta(from, to);

  // A grid without square axes (hexagons) has no such measure: its straight line, rounded, is the nearest thing.
  if (delta === null) {
    return Math.round(from.distanceFrom(to));
  }

  const a = Math.abs(delta[0]),
    b = Math.abs(delta[1]);

  return Math.max(a, b) + (Math.min(a, b) >> 1);
};

/** `map_distance`: the longer logical gap, the king's moves between the two. */
export const moveDistance = (from: Tile, to: Tile): number =>
  from.map().topology().steps(from.x(), from.y(), to.x(), to.y());

export interface CapitalLinkDependencies {
  cityImprovementRegistry?: CityImprovementRegistry;
  cityRegistry?: CityRegistry;
  landMassRegistry?: LandMassRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  unitRegistry?: UnitRegistry;
  /** The game's turn: Palaces and links are kept for the turn they were worked out in. */
  turn?: Turn;
  /**
   * Whether `player` has an alliance with `other` (`TREATY_ALLIANCE`): an ally's cities and units don't block the
   *  link. No one is allied unless given; civ2-city's corruption rules pass base-diplomacy's alliance.
   */
  allied?: (player: Player, other: Player) => boolean;
}

export type CapitalLinkResult = {
  /** `city_calc.capital_distance`: 0 in the Palace's city, else the nearest Palace's `diagonalDistance`, at most 32. */
  distance: number;
  /** `city_calc.capital_nearest`: the nearest other city of the player's with a Palace, or `null`. */
  nearest: City | null;
  /** `city_calc.capital_link`: 0, 1 (a road) or 2 (a railroad). */
  link: Link;
};

/**
 * Works out `city_calc_capital_link` for a city.
 *
 * Cost: the pathfinder's cost grid depends only on the goal (the capital's square) and on which squares are land, so
 *  it is flooded once per capital square (at most 47 × 47 squares) and kept until `invalidate()`, which civ2-city's
 *  `TerrainChanged` rule calls. Land masses are looked up once per square, until `invalidate()`.
 *
 * Each player's Palaces are found once a turn, and each city's link is walked (at most 50 squares, asking each for its
 *  city, its units and its grade) once a turn, until `invalidateCapitals()`. civ2-city's rules call that when a city is
 *  founded, captured or destroyed, a city improvement is built, a road or railroad is built, pillaged or removed, or a
 *  square's terrain changes, so the link follows them at once, as Civ2 works it out again on every `city_recalc`. Units
 *  are the one difference: one that moves onto or off the route is only seen when the link is next worked out.
 */
export class CapitalLink {
  private _allied: (player: Player, other: Player) => boolean;
  private _cityImprovementRegistry: CityImprovementRegistry;
  private _cityRegistry: CityRegistry;
  private _floods: WeakMap<Tile, Map<Tile, number>> = new WeakMap();
  private _landMasses: WeakMap<Tile, LandMass | null> = new WeakMap();
  private _landMassRegistry: LandMassRegistry;
  private _neighbours: WeakMap<Tile, (Tile | null)[]> = new WeakMap();
  private _playerResearchRegistry: PlayerResearchRegistry;
  private _routes: RouteNetwork;
  private _unitRegistry: UnitRegistry;
  private _turn: Turn;
  private _version = 0;
  private _palaces: { key: string; byPlayer: Map<Player, City[]> } | null =
    null;
  private _links: WeakMap<
    City,
    { key: string; nearest: City | null; distance: number; link: Link }
  > = new WeakMap();

  constructor({
    cityImprovementRegistry = cityImprovementRegistryInstance,
    cityRegistry = cityRegistryInstance,
    landMassRegistry = landMassRegistryInstance,
    playerResearchRegistry = playerResearchRegistryInstance,
    tileImprovementRegistry = tileImprovementRegistryInstance,
    unitRegistry = unitRegistryInstance,
    turn = turnInstance,
    allied = () => false,
  }: CapitalLinkDependencies = {}) {
    this._turn = turn;
    this._allied = allied;
    this._cityImprovementRegistry = cityImprovementRegistry;
    this._cityRegistry = cityRegistry;
    this._landMassRegistry = landMassRegistry;
    this._playerResearchRegistry = playerResearchRegistry;
    this._unitRegistry = unitRegistry;
    // Only `grade` is used: a square's own road or railroad, read from the registry each time. The network's labels
    //  (and so `routeNetworkRules`) aren't.
    this._routes = new RouteNetwork({
      Road,
      Railroad,
      tileImprovementRegistry,
    });
  }

  /** Forget the cost grids and land masses, after a square's terrain changes. */
  invalidate(): void {
    this._floods = new WeakMap();
    this._landMasses = new WeakMap();
    this.invalidateCapitals();
  }

  /** Forget the turn's Palaces and links, after a Palace may have been built or lost. */
  invalidateCapitals(): void {
    this._version++;
  }

  /**
   * What the turn's Palaces, capital links and route links are kept under: the turn, and how many times
   *  `invalidateCapitals()` (or `invalidate()`) has been called. A cache of anything that changes with them can key on it.
   */
  key(): string {
    return `${this._turn.value()}:${this._version}`;
  }

  // The route links asked for under `key()`: by player, then by the two squares.
  private _routeLinks: {
    key: string;
    links: Map<Player, Map<Tile, Map<Tile, Link>>>;
  } | null = null;

  /**
   * `connection(player, from, to)`, worked out once under `key()`: a trade route's link, asked each time its city's
   *  yields are. Like a city's capital link, it changes at once when a road or railroad is built, pillaged or removed,
   *  a city is founded, captured or destroyed, or terrain changes; a unit moving onto or off the route only counts
   *  when the link is next worked out.
   */
  routeLink(player: Player, from: Tile, to: Tile): Link {
    const key = this.key();

    if (this._routeLinks === null || this._routeLinks.key !== key) {
      this._routeLinks = { key, links: new Map() };
    }

    const byPlayer = this._routeLinks.links;

    if (!byPlayer.has(player)) {
      byPlayer.set(player, new Map());
    }

    const byFrom = byPlayer.get(player)!;

    if (!byFrom.has(from)) {
      byFrom.set(from, new Map());
    }

    const byTo = byFrom.get(from)!;

    if (!byTo.has(to)) {
      byTo.set(to, this.connection(player, from, to));
    }

    return byTo.get(to)!;
  }

  /** The cities with a standing Palace of each player, found once a turn. */
  private palaces(player: Player): City[] {
    const key = this.key();

    if (this._palaces === null || this._palaces.key !== key) {
      const byPlayer = new Map<Player, City[]>();

      this._cityImprovementRegistry
        .filter(
          (improvement: CityImprovement): boolean =>
            improvement instanceof Palace && !improvement.destroyed()
        )
        .forEach((palace: CityImprovement): void => {
          const city = palace.city(),
            owner = city.player();

          byPlayer.set(owner, [...(byPlayer.get(owner) ?? []), city]);
        });

      this._palaces = { key, byPlayer };
    }

    return this._palaces.byPlayer.get(player) ?? [];
  }

  has(city: City, Improvement: typeof CityImprovement): boolean {
    return this._cityImprovementRegistry.getByCity(city).some(
      (improvement: CityImprovement): boolean =>
        improvement instanceof Improvement &&
        // A Palace is destroyed when its city is captured, but stays registered.
        !improvement.destroyed()
    );
  }

  /**
   * The first half of `city_calc_capital_link`: how far the city is from its player's nearest Palace, and which city
   *  that is. Trade corruption needs only this.
   */
  capital(city: City): Omit<CapitalLinkResult, 'link'> {
    const player = city.player();

    let distance = this.has(city, Palace) ? 0 : noCapitalDistance,
      nearest: City | null = null;

    for (const other of this.palaces(player)) {
      if (other === city) {
        continue;
      }

      const otherDistance = diagonalDistance(city.tile(), other.tile());

      if (otherDistance < distance || nearest === null) {
        nearest = other;
      }

      if (otherDistance < distance) {
        distance = otherDistance;
      }
    }

    return { distance, nearest };
  }

  /** `city_calc_capital_link`. `capital` is `capital(city)`, if the caller has it already. */
  of(
    city: City,
    capital: Omit<CapitalLinkResult, 'link'> = this.capital(city)
  ): CapitalLinkResult {
    const player = city.player(),
      { distance, nearest } = capital,
      key = this.key(),
      cached = this._links.get(city);

    if (
      cached !== undefined &&
      cached.key === key &&
      cached.nearest === nearest &&
      cached.distance === distance
    ) {
      return { distance, nearest, link: cached.link };
    }

    let link: Link =
      distance === 0 ? (this.knowsRailroad(player) ? RAILROAD : ROAD) : NONE;

    if (nearest !== null) {
      const nearestCity: City = nearest;

      if (this.has(city, Airport) && this.has(nearestCity, Airport)) {
        link = ROAD;
      }

      // On the same land mass the road answer replaces the airports', even when it's none.
      if (this.landMass(city.tile()) === this.landMass(nearestCity.tile())) {
        link = this.connection(player, city.tile(), nearestCity.tile());
      }
    }

    this._links.set(city, { key, nearest, distance, link });

    return { distance, nearest, link };
  }

  /** `map_road_connection`: how the player's road from `from` reaches `to`, walked along the pathfinder's one route. */
  connection(player: Player, from: Tile, to: Tile): Link {
    if (
      this.landMass(from) !== this.landMass(to) ||
      moveDistance(to, from) >= linkDistance
    ) {
      return NONE;
    }

    const costs = this.flood(to);

    let current = from,
      railroad = true,
      steps = 0;

    while (true) {
      const next = this.next(current, to, costs);

      if (next === null) {
        return NONE;
      }

      current = next;

      if (current === to) {
        break;
      }

      const city = this._cityRegistry.getByTile(current);

      // Any city of the player's own ends the walk, as the target would.
      if (city !== null && city.player() === player) {
        break;
      }

      // Another player's city stops it, the barbarians' too; a unit of another player's does, but not a barbarian's
      //  (`tile_city_or_unit_owner` is above 0).
      if (city !== null && !this._allied(player, city.player())) {
        return NONE;
      }

      if (city === null) {
        const [unit] = this._unitRegistry.getByTile(current);

        if (
          unit !== undefined &&
          unit.player() !== player &&
          !isBarbarian(unit.player()) &&
          !this._allied(player, unit.player())
        ) {
          return NONE;
        }
      }

      const grade = this._routes.grade(current);

      if (grade === NONE) {
        return NONE;
      }

      if (grade !== RAILROAD) {
        railroad = false;
      }

      steps++;

      if (steps > linkSteps) {
        return NONE;
      }
    }

    return railroad ? RAILROAD : ROAD;
  }

  /** `tile_land_landmass`, remembered until `invalidate()`. */
  landMass(tile: Tile): LandMass | null {
    if (!this._landMasses.has(tile)) {
      this._landMasses.set(tile, this._landMassRegistry.getByTile(tile));
    }

    return this._landMasses.get(tile)!;
  }

  private knowsRailroad(player: Player): boolean {
    try {
      return this._playerResearchRegistry
        .getByPlayer(player)
        .completed(RailroadAdvance);
    } catch (e) {
      return false;
    }
  }

  /** `tile`'s neighbours in Civ2's direction order, `null` off a grid edge that doesn't wrap. */
  private neighbours(tile: Tile): (Tile | null)[] {
    if (!this._neighbours.has(tile)) {
      const topology = tile.map().topology(),
        neighbours: (Tile | null)[] = directions.map(() => null);

      topology.directions().forEach((direction: string): void => {
        const coordinates = topology.neighbour(tile.x(), tile.y(), direction);

        if (coordinates === null) {
          return;
        }

        const delta = topology.logicalDelta(
            tile.x(),
            tile.y(),
            coordinates[0],
            coordinates[1]
          ),
          index =
            delta === null
              ? -1
              : directions.findIndex(
                  ([a, b]) => a === delta[0] && b === delta[1]
                );

        if (index !== -1) {
          neighbours[index] = tile.map().get(coordinates[0], coordinates[1]);
        }
      });

      this._neighbours.set(tile, neighbours);
    }

    return this._neighbours.get(tile)!;
  }

  /**
   * `map_path_flood` with every step costing 1 (`road_planning`): a breadth-first fill over land from `goal` (cost 1),
   *  within 23 squares of it. A walk only ever steps to a lower cost, so filling past the start, as the original
   *  doesn't, changes nothing it reads.
   */
  private flood(goal: Tile): Map<Tile, number> {
    const known = this._floods.get(goal);

    if (known) {
      return known;
    }

    const costs = new Map<Tile, number>([[goal, 1]]),
      queue: Tile[] = [goal];

    for (let head = 0; head < queue.length; head++) {
      const tile = queue[head],
        cost = costs.get(tile)! + 1;

      this.neighbours(tile).forEach((neighbour: Tile | null): void => {
        if (
          neighbour === null ||
          !(neighbour.isLand() || neighbour === goal) ||
          moveDistance(goal, neighbour) > floodRadius
        ) {
          return;
        }

        const existing = costs.get(neighbour);

        if (existing === undefined || cost < existing) {
          costs.set(neighbour, cost);
          queue.push(neighbour);
        }
      });
    }

    this._floods.set(goal, costs);

    return costs;
  }

  /**
   * `map_path_pick_dir` with every step costing 1: the neighbour of lowest cost below this square's, ties going to the
   *  one nearer the goal (`diagonalDistance`), then to the first in Civ2's order.
   */
  private next(tile: Tile, goal: Tile, costs: Map<Tile, number>): Tile | null {
    const here = costs.get(tile) ?? 0;

    let best: Tile | null = null,
      bestCost = Infinity,
      bestDistance = Infinity;

    this.neighbours(tile).forEach((neighbour: Tile | null): void => {
      if (neighbour === null) {
        return;
      }

      const cost = costs.get(neighbour);

      if (cost === undefined || cost >= here) {
        return;
      }

      if (cost < bestCost) {
        best = neighbour;
        bestCost = cost;
        bestDistance = diagonalDistance(goal, neighbour);

        return;
      }

      if (cost === bestCost) {
        const distance = diagonalDistance(goal, neighbour);

        if (distance < bestDistance) {
          best = neighbour;
          bestDistance = distance;
        }
      }
    });

    return best;
  }
}

export default CapitalLink;
