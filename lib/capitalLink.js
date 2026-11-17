"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapitalLink = exports.moveDistance = exports.diagonalDistance = exports.floodRadius = exports.linkSteps = exports.linkDistance = exports.RAILROAD = exports.ROAD = exports.NONE = void 0;
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const LandMassRegistry_1 = require("@civ-clone/core-world/LandMassRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const RouteNetwork_1 = require("@civ-clone/base-route-link/lib/RouteNetwork");
Object.defineProperty(exports, "NONE", { enumerable: true, get: function () { return RouteNetwork_1.NONE; } });
Object.defineProperty(exports, "RAILROAD", { enumerable: true, get: function () { return RouteNetwork_1.RAILROAD; } });
Object.defineProperty(exports, "ROAD", { enumerable: true, get: function () { return RouteNetwork_1.ROAD; } });
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const Airport_1 = require("@civ-clone/base-city-improvement-airport/Airport");
const Palace_1 = require("@civ-clone/base-city-improvement-palace/Palace");
const Railroad_1 = require("@civ-clone/base-tile-improvement-railroad/Railroad");
const Railroad_2 = require("@civ-clone/base-science-advance-railroad/Railroad");
const Road_1 = require("@civ-clone/base-tile-improvement-road/Road");
const isBarbarian_1 = require("@civ-clone/base-civilization-barbarian/isBarbarian");
const cityRules_1 = require("../data/cityRules");
/** `map_road_connection` gives up at this distance (`map_distance`) or more. */
exports.linkDistance = 23;
/** `map_road_connection` gives up after more than this many squares. */
exports.linkSteps = 50;
/** The pathfinder's cost grid is 48 × 48 around the goal: no square further than this from it (`map_path_flood`). */
exports.floodRadius = 23;
/**
 * Civ2's eight directions in its own order (`dir_dx_table`/`dir_dy_table`, `src/data/gamedata.cpp`: (1, −1), (2, 0),
 *  (1, 1), (0, 2), (−1, 1), (−2, 0), (−1, −1), (0, −2)), as logical steps. The order breaks the pathfinder's ties.
 */
const directions = [
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
];
const logicalDelta = (from, to) => from.map().topology().logicalDelta(from.x(), from.y(), to.x(), to.y());
/** `map_distance_diag`: the longer logical gap plus half the shorter, rounded down. */
const diagonalDistance = (from, to) => {
    const delta = logicalDelta(from, to);
    // A grid without square axes (hexagons) has no such measure: its straight line, rounded, is the nearest thing.
    if (delta === null) {
        return Math.round(from.distanceFrom(to));
    }
    const a = Math.abs(delta[0]), b = Math.abs(delta[1]);
    return Math.max(a, b) + (Math.min(a, b) >> 1);
};
exports.diagonalDistance = diagonalDistance;
/** `map_distance`: the longer logical gap, the king's moves between the two. */
const moveDistance = (from, to) => from.map().topology().steps(from.x(), from.y(), to.x(), to.y());
exports.moveDistance = moveDistance;
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
class CapitalLink {
    constructor({ cityImprovementRegistry = CityImprovementRegistry_1.instance, cityRegistry = CityRegistry_1.instance, landMassRegistry = LandMassRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, turn = Turn_1.instance, allied = () => false, } = {}) {
        this._floods = new WeakMap();
        this._landMasses = new WeakMap();
        this._neighbours = new WeakMap();
        this._version = 0;
        this._palaces = null;
        this._links = new WeakMap();
        // The route links asked for under `key()`: by player, then by the two squares.
        this._routeLinks = null;
        this._turn = turn;
        this._allied = allied;
        this._cityImprovementRegistry = cityImprovementRegistry;
        this._cityRegistry = cityRegistry;
        this._landMassRegistry = landMassRegistry;
        this._playerResearchRegistry = playerResearchRegistry;
        this._unitRegistry = unitRegistry;
        // Only `grade` is used: a square's own road or railroad, read from the registry each time. The network's labels
        //  (and so `routeNetworkRules`) aren't.
        this._routes = new RouteNetwork_1.default({
            Road: Road_1.default,
            Railroad: Railroad_1.default,
            tileImprovementRegistry,
        });
    }
    /** Forget the cost grids and land masses, after a square's terrain changes. */
    invalidate() {
        this._floods = new WeakMap();
        this._landMasses = new WeakMap();
        this.invalidateCapitals();
    }
    /** Forget the turn's Palaces and links, after a Palace may have been built or lost. */
    invalidateCapitals() {
        this._version++;
    }
    /**
     * What the turn's Palaces, capital links and route links are kept under: the turn, and how many times
     *  `invalidateCapitals()` (or `invalidate()`) has been called. A cache of anything that changes with them can key on it.
     */
    key() {
        return `${this._turn.value()}:${this._version}`;
    }
    /**
     * `connection(player, from, to)`, worked out once under `key()`: a trade route's link, asked each time its city's
     *  yields are. Like a city's capital link, it changes at once when a road or railroad is built, pillaged or removed,
     *  a city is founded, captured or destroyed, or terrain changes; a unit moving onto or off the route only counts
     *  when the link is next worked out.
     */
    routeLink(player, from, to) {
        const key = this.key();
        if (this._routeLinks === null || this._routeLinks.key !== key) {
            this._routeLinks = { key, links: new Map() };
        }
        const byPlayer = this._routeLinks.links;
        if (!byPlayer.has(player)) {
            byPlayer.set(player, new Map());
        }
        const byFrom = byPlayer.get(player);
        if (!byFrom.has(from)) {
            byFrom.set(from, new Map());
        }
        const byTo = byFrom.get(from);
        if (!byTo.has(to)) {
            byTo.set(to, this.connection(player, from, to));
        }
        return byTo.get(to);
    }
    /** The cities with a standing Palace of each player, found once a turn. */
    palaces(player) {
        var _a;
        const key = this.key();
        if (this._palaces === null || this._palaces.key !== key) {
            const byPlayer = new Map();
            this._cityImprovementRegistry
                .filter((improvement) => improvement instanceof Palace_1.default && !improvement.destroyed())
                .forEach((palace) => {
                var _a;
                const city = palace.city(), owner = city.player();
                byPlayer.set(owner, [...((_a = byPlayer.get(owner)) !== null && _a !== void 0 ? _a : []), city]);
            });
            this._palaces = { key, byPlayer };
        }
        return (_a = this._palaces.byPlayer.get(player)) !== null && _a !== void 0 ? _a : [];
    }
    has(city, Improvement) {
        return this._cityImprovementRegistry.getByCity(city).some((improvement) => improvement instanceof Improvement &&
            // A Palace is destroyed when its city is captured, but stays registered.
            !improvement.destroyed());
    }
    /**
     * The first half of `city_calc_capital_link`: how far the city is from its player's nearest Palace, and which city
     *  that is. Trade corruption needs only this.
     */
    capital(city) {
        const player = city.player();
        let distance = this.has(city, Palace_1.default) ? 0 : cityRules_1.noCapitalDistance, nearest = null;
        for (const other of this.palaces(player)) {
            if (other === city) {
                continue;
            }
            const otherDistance = (0, exports.diagonalDistance)(city.tile(), other.tile());
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
    of(city, capital = this.capital(city)) {
        const player = city.player(), { distance, nearest } = capital, key = this.key(), cached = this._links.get(city);
        if (cached !== undefined &&
            cached.key === key &&
            cached.nearest === nearest &&
            cached.distance === distance) {
            return { distance, nearest, link: cached.link };
        }
        let link = distance === 0 ? (this.knowsRailroad(player) ? RouteNetwork_1.RAILROAD : RouteNetwork_1.ROAD) : RouteNetwork_1.NONE;
        if (nearest !== null) {
            const nearestCity = nearest;
            if (this.has(city, Airport_1.default) && this.has(nearestCity, Airport_1.default)) {
                link = RouteNetwork_1.ROAD;
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
    connection(player, from, to) {
        if (this.landMass(from) !== this.landMass(to) ||
            (0, exports.moveDistance)(to, from) >= exports.linkDistance) {
            return RouteNetwork_1.NONE;
        }
        const costs = this.flood(to);
        let current = from, railroad = true, steps = 0;
        while (true) {
            const next = this.next(current, to, costs);
            if (next === null) {
                return RouteNetwork_1.NONE;
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
                return RouteNetwork_1.NONE;
            }
            if (city === null) {
                const [unit] = this._unitRegistry.getByTile(current);
                if (unit !== undefined &&
                    unit.player() !== player &&
                    !(0, isBarbarian_1.isBarbarian)(unit.player()) &&
                    !this._allied(player, unit.player())) {
                    return RouteNetwork_1.NONE;
                }
            }
            const grade = this._routes.grade(current);
            if (grade === RouteNetwork_1.NONE) {
                return RouteNetwork_1.NONE;
            }
            if (grade !== RouteNetwork_1.RAILROAD) {
                railroad = false;
            }
            steps++;
            if (steps > exports.linkSteps) {
                return RouteNetwork_1.NONE;
            }
        }
        return railroad ? RouteNetwork_1.RAILROAD : RouteNetwork_1.ROAD;
    }
    /** `tile_land_landmass`, remembered until `invalidate()`. */
    landMass(tile) {
        if (!this._landMasses.has(tile)) {
            this._landMasses.set(tile, this._landMassRegistry.getByTile(tile));
        }
        return this._landMasses.get(tile);
    }
    knowsRailroad(player) {
        try {
            return this._playerResearchRegistry
                .getByPlayer(player)
                .completed(Railroad_2.default);
        }
        catch (e) {
            return false;
        }
    }
    /** `tile`'s neighbours in Civ2's direction order, `null` off a grid edge that doesn't wrap. */
    neighbours(tile) {
        if (!this._neighbours.has(tile)) {
            const topology = tile.map().topology(), neighbours = directions.map(() => null);
            topology.directions().forEach((direction) => {
                const coordinates = topology.neighbour(tile.x(), tile.y(), direction);
                if (coordinates === null) {
                    return;
                }
                const delta = topology.logicalDelta(tile.x(), tile.y(), coordinates[0], coordinates[1]), index = delta === null
                    ? -1
                    : directions.findIndex(([a, b]) => a === delta[0] && b === delta[1]);
                if (index !== -1) {
                    neighbours[index] = tile.map().get(coordinates[0], coordinates[1]);
                }
            });
            this._neighbours.set(tile, neighbours);
        }
        return this._neighbours.get(tile);
    }
    /**
     * `map_path_flood` with every step costing 1 (`road_planning`): a breadth-first fill over land from `goal` (cost 1),
     *  within 23 squares of it. A walk only ever steps to a lower cost, so filling past the start, as the original
     *  doesn't, changes nothing it reads.
     */
    flood(goal) {
        const known = this._floods.get(goal);
        if (known) {
            return known;
        }
        const costs = new Map([[goal, 1]]), queue = [goal];
        for (let head = 0; head < queue.length; head++) {
            const tile = queue[head], cost = costs.get(tile) + 1;
            this.neighbours(tile).forEach((neighbour) => {
                if (neighbour === null ||
                    !(neighbour.isLand() || neighbour === goal) ||
                    (0, exports.moveDistance)(goal, neighbour) > exports.floodRadius) {
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
    next(tile, goal, costs) {
        var _a;
        const here = (_a = costs.get(tile)) !== null && _a !== void 0 ? _a : 0;
        let best = null, bestCost = Infinity, bestDistance = Infinity;
        this.neighbours(tile).forEach((neighbour) => {
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
                bestDistance = (0, exports.diagonalDistance)(goal, neighbour);
                return;
            }
            if (cost === bestCost) {
                const distance = (0, exports.diagonalDistance)(goal, neighbour);
                if (distance < bestDistance) {
                    best = neighbour;
                    bestDistance = distance;
                }
            }
        });
        return best;
    }
}
exports.CapitalLink = CapitalLink;
exports.default = CapitalLink;
//# sourceMappingURL=capitalLink.js.map