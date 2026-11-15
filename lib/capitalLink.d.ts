import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { LandMassRegistry } from '@civ-clone/core-world/LandMassRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  Link,
  NONE,
  RAILROAD,
  ROAD,
} from '@civ-clone/base-route-link/lib/RouteNetwork';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import City from '@civ-clone/core-city/City';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import LandMass from '@civ-clone/core-world/LandMass';
import Player from '@civ-clone/core-player/Player';
import Tile from '@civ-clone/core-world/Tile';
export { Link, NONE, ROAD, RAILROAD };
/** `map_road_connection` gives up at this distance (`map_distance`) or more. */
export declare const linkDistance = 23;
/** `map_road_connection` gives up after more than this many squares. */
export declare const linkSteps = 50;
/** The pathfinder's cost grid is 48 × 48 around the goal: no square further than this from it (`map_path_flood`). */
export declare const floodRadius = 23;
/** `map_distance_diag`: the longer logical gap plus half the shorter, rounded down. */
export declare const diagonalDistance: (from: Tile, to: Tile) => number;
/** `map_distance`: the longer logical gap, the king's moves between the two. */
export declare const moveDistance: (from: Tile, to: Tile) => number;
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
   * Whether `player` has an alliance with `other` (`TREATY_ALLIANCE`). Civ2 in civ-clone has no alliances yet, so by
   *  default no one has.
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
 *  `TerrainChanged` rule calls. Each link then walks at most 50 squares, asking each for its city, its units and its
 *  grade afresh, as units come and go. Land masses are looked up once per square, until `invalidate()`.
 *
 * Each player's Palaces are found once a turn, and each city's link is worked out once a turn (Civ2 works it out as the
 *  city is processed, `city_calc_capital_link`), until `invalidateCapitals()`, which civ2-city's rules call when a city
 *  improvement is built, a city is captured or destroyed, or a square's terrain changes.
 */
export declare class CapitalLink {
  private _allied;
  private _cityImprovementRegistry;
  private _cityRegistry;
  private _floods;
  private _landMasses;
  private _landMassRegistry;
  private _neighbours;
  private _playerResearchRegistry;
  private _routes;
  private _unitRegistry;
  private _turn;
  private _version;
  private _palaces;
  private _links;
  constructor({
    cityImprovementRegistry,
    cityRegistry,
    landMassRegistry,
    playerResearchRegistry,
    tileImprovementRegistry,
    unitRegistry,
    turn,
    allied,
  }?: CapitalLinkDependencies);
  /** Forget the cost grids and land masses, after a square's terrain changes. */
  invalidate(): void;
  /** Forget the turn's Palaces and links, after a Palace may have been built or lost. */
  invalidateCapitals(): void;
  private key;
  /** The cities with a standing Palace of each player, found once a turn. */
  private palaces;
  has(city: City, Improvement: typeof CityImprovement): boolean;
  /**
   * The first half of `city_calc_capital_link`: how far the city is from its player's nearest Palace, and which city
   *  that is. Trade corruption needs only this.
   */
  capital(city: City): Omit<CapitalLinkResult, 'link'>;
  /** `city_calc_capital_link`. `capital` is `capital(city)`, if the caller has it already. */
  of(city: City, capital?: Omit<CapitalLinkResult, 'link'>): CapitalLinkResult;
  /** `map_road_connection`: how the player's road from `from` reaches `to`, walked along the pathfinder's one route. */
  connection(player: Player, from: Tile, to: Tile): Link;
  /** `tile_land_landmass`, remembered until `invalidate()`. */
  landMass(tile: Tile): LandMass | null;
  private knowsRailroad;
  /** `tile`'s neighbours in Civ2's direction order, `null` off a grid edge that doesn't wrap. */
  private neighbours;
  /**
   * `map_path_flood` with every step costing 1 (`road_planning`): a breadth-first fill over land from `goal` (cost 1),
   *  within 23 squares of it. A walk only ever steps to a lower cost, so filling past the start, as the original
   *  doesn't, changes nothing it reads.
   */
  private flood;
  /**
   * `map_path_pick_dir` with every step costing 1: the neighbour of lowest cost below this square's, ties going to the
   *  one nearer the goal (`diagonalDistance`), then to the first in Civ2's order.
   */
  private next;
}
export default CapitalLink;
