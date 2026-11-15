"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureRules = exports.partisansPriority = exports.plunderPriority = exports.withCaptureDefaults = void 0;
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerRegistry_1 = require("@civ-clone/core-player/PlayerRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const PlayerTreasuryRegistry_1 = require("@civ-clone/core-treasury/PlayerTreasuryRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const UnitImprovementRegistry_1 = require("@civ-clone/core-unit-improvement/UnitImprovementRegistry");
const capture_1 = require("./capture");
const Airbase_1 = require("@civ-clone/base-tile-improvement-airbase/Airbase");
const Fortified_1 = require("@civ-clone/base-unit-action-fortify/Rules/Fortified");
const Captured_1 = require("@civ-clone/core-city/Rules/Captured");
const Communism_1 = require("@civ-clone/base-science-advance-communism/Communism");
const Governments_1 = require("../Governments");
const Conscription_1 = require("@civ-clone/base-science-advance-conscription/Conscription");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Roles_1 = require("@civ-clone/base-unit-role/Roles");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Fortified_2 = require("@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified");
const Fortress_1 = require("@civ-clone/base-tile-improvement-fortress/Fortress");
const Gold_1 = require("@civ-clone/base-city-yield-gold/Gold");
const GuerrillaWarfare_1 = require("@civ-clone/base-science-advance-guerrillawarfare/GuerrillaWarfare");
const Gunpowder_1 = require("@civ-clone/base-science-advance-gunpowder/Gunpowder");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const InciteRevolt_1 = require("@civ-clone/base-unit-action-incite-revolt/InciteRevolt");
const Partisan_1 = require("@civ-clone/base-unit-partisan/Partisan");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const Railroad_1 = require("@civ-clone/base-tile-improvement-railroad/Railroad");
const Road_1 = require("@civ-clone/base-tile-improvement-road/Road");
const SubvertCity_1 = require("@civ-clone/base-unit-action-incite-revolt/SubvertCity");
const Veteran_1 = require("@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran");
const destroyed_1 = require("@civ-clone/base-city-lifecycle/lib/destroyed");
const government_1 = require("./government");
const roleOf_1 = require("@civ-clone/base-unit-role/roleOf");
const isBarbarian_1 = require("@civ-clone/base-civilization-barbarian/isBarbarian");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const core_random_1 = require("@civ-clone/core-random");
const terrainTable_1 = require("@civ-clone/civ2-world/lib/terrainTable");
const terrain_1 = require("@civ-clone/civ2-world/data/terrain");
const withCaptureDefaults = ({ cityRegistry = CityRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerRegistry = PlayerRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerTreasuryRegistry = PlayerTreasuryRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitImprovementRegistry = UnitImprovementRegistry_1.instance, randomNumberGenerator = core_random_1.instance, reputation = () => 0, vendetta = () => false, } = {}) => ({
    cityRegistry,
    clientRegistry,
    playerGovernmentRegistry,
    playerRegistry,
    playerResearchRegistry,
    playerTreasuryRegistry,
    ruleRegistry,
    tileImprovementRegistry,
    unitImprovementRegistry,
    randomNumberGenerator,
    reputation,
    vendetta,
});
exports.withCaptureDefaults = withCaptureDefaults;
/**
 * After every `Normal` rule of a capture (civ2-city-improvement's Palace escape, which spends the loser's gold first,
 *  and civ2-science's stolen advance, which the Partisans' count reads) and before civ2-wonder's `Low` Leonardo's
 *  Workshop, which comes last in `city_capture_aftermath`. Plunder, then Partisans, as the original runs them.
 */
exports.plunderPriority = 2500;
exports.partisansPriority = 2600;
// The city as it was before any rule of its capture changed it, taken at `High`.
const snapshots = new WeakMap();
/**
 * Plunder, the units the city supported, and Partisans: OpenCiv2 `src/auto/city.cpp` `city_capture_aftermath`
 *  (0057b5df) and its `_announce`, `_rehome_units` and `_partisans` parts (richardpenman/civ2@49f26ec).
 */
const captureRules = (unitRegistry, cityGrowthRegistry, engine, { cityRegistry, clientRegistry, playerGovernmentRegistry, playerRegistry, playerResearchRegistry, playerTreasuryRegistry, ruleRegistry, tileImprovementRegistry, unitImprovementRegistry, randomNumberGenerator, reputation, vendetta, }) => {
    const goldOf = (player) => {
        var _a;
        return (_a = playerTreasuryRegistry
            .getByPlayer(player)
            .find((treasury) => treasury.yield() === Gold_1.default)) !== null && _a !== void 0 ? _a : null;
    }, sizeOf = (city) => cityGrowthRegistry.getByCity(city).size(), 
    // A Barbarian knows no advance (`civ_has_advance` answers 0 for civ 0).
    knows = (player, AdvanceType) => {
        if ((0, isBarbarian_1.default)(player)) {
            return false;
        }
        try {
            return playerResearchRegistry
                .getByPlayer(player)
                .completed(AdvanceType);
        }
        catch (e) {
            return false;
        }
    }, advancesOf = (player) => {
        try {
            return playerResearchRegistry.getByPlayer(player).complete().length;
        }
        catch (e) {
            return 0;
        }
    }, 
    // `game.first_discoverer`: anyone has found it.
    discovered = (AdvanceType) => playerRegistry
        .entries()
        .some((player) => knows(player, AdvanceType)), 
    // The city is the captor's when the rules run (`City#capture`); Civ2 still counts it as the loser's here.
    totalCitySize = (player, city, loser) => cityRegistry
        .getByPlayer(player)
        .filter((other) => other !== city)
        .reduce((total, other) => total + sizeOf(other), 0) +
        (player === loser ? sizeOf(city) : 0);
    return [
        // `city_treasury_share` is taken first, from the city's size and its owner's gold before anything changes. The
        //  power ranks are taken here too: Civ2's are from the start of the turn (`civ_update_power_ranks`), which
        //  nothing keeps, so this is the nearest moment.
        new Captured_1.default('civ2-city:city/captured/plunder-share', new Priorities_1.High(), new Effect_1.default((city, captor, loser) => {
            var _a, _b;
            const size = sizeOf(city), gold = (_b = (_a = goldOf(loser)) === null || _a === void 0 ? void 0 : _a.value()) !== null && _b !== void 0 ? _b : 0;
            snapshots.set(city, {
                share: (0, capture_1.treasuryShare)(size, gold, totalCitySize(loser, city, loser)),
                ranks: (0, capture_1.powerRanks)(playerRegistry
                    .entries()
                    .filter((player) => !(0, isBarbarian_1.default)(player))
                    .map((player) => {
                    var _a, _b;
                    return [
                        player,
                        (0, capture_1.power)(advancesOf(player), totalCitySize(player, city, loser), (_b = (_a = goldOf(player)) === null || _a === void 0 ? void 0 : _a.value()) !== null && _b !== void 0 ? _b : 0),
                    ];
                })),
            });
        })),
        // The share is clamped to what the loser has left (a computer player may have paid 1,000 for its Palace to
        //  escape) and moves to the captor. Barbarians take it from the loser but don't keep it (`if (civ != 0)`).
        new Captured_1.default('civ2-city:city/captured/plunder', new Priority_1.default(exports.plunderPriority), new Effect_1.default((city, captor, loser) => {
            var _a;
            const snapshot = snapshots.get(city), loserGold = goldOf(loser);
            if (!snapshot || loserGold === null) {
                return;
            }
            const amount = (0, capture_1.plunder)(snapshot.share, loserGold.value());
            loserGold.subtract(amount);
            if (!(0, isBarbarian_1.default)(captor)) {
                (_a = goldOf(captor)) === null || _a === void 0 ? void 0 : _a.add(amount);
            }
            if (amount !== 0) {
                engine.emit('city:plundered', city, captor, loser, amount);
            }
        })),
        // `_rehome_units` (:5114), after the city has shrunk and only if it's still there: of the units the city
        //  supported (not those that defected with an incited city, which are the captor's), Partisans lose their home and
        //  are kept; a computer player's unit with the Defend role that is the only one in another city it stands in is
        //  rehomed there; every other is disbanded. Civ2 looks at them from the newest down, starting again after each
        //  one it disbands, so a second defender in the same city is kept once the first is gone.
        new Captured_1.default('civ2-city:city/captured/rehome-units', new Effect_1.default((city, captor, loser) => {
            if (city.destroyed()) {
                return;
            }
            const human = (0, isHuman_1.default)(loser, clientRegistry), seen = new Set();
            for (;;) {
                const units = unitRegistry
                    .getByCity(city)
                    .filter((unit) => unit.player() === loser && !unit.destroyed() && !seen.has(unit));
                if (units.length === 0) {
                    return;
                }
                const unit = units[units.length - 1];
                seen.add(unit);
                if (unit instanceof Partisan_1.default) {
                    unit.setCity(null);
                    continue;
                }
                const standsIn = cityRegistry.getByTile(unit.tile());
                if (!human &&
                    standsIn !== null &&
                    standsIn !== city &&
                    standsIn.player() === loser &&
                    (0, roleOf_1.hasRole)(unit, Roles_1.DefendRole, ruleRegistry) &&
                    unitRegistry
                        .getByTile(unit.tile())
                        .filter((other) => (0, roleOf_1.hasRole)(other, Roles_1.DefendRole, ruleRegistry))
                        .length === 1) {
                    unit.setCity(standsIn);
                    continue;
                }
                (0, destroyed_1.destroyUnits)([unit]);
            }
        })),
        // `_partisans` (:5225), called when the city is still there, the loser has a city left (Barbarians always do:
        //  `civ_check_destroyed` answers 0 for them), the captor isn't the city's founder (a Spy's subverted city has
        //  just been made the captor's), and the loser is Communist or a Democracy, or knows Communism, or anyone has
        //  found Guerrilla Warfare. Checked in the `Effect`: every `Criterion` is evaluated before any `Effect` runs.
        new Captured_1.default('civ2-city:city/captured/partisans', new Priority_1.default(exports.partisansPriority), new Criterion_1.default((city, captor, loser, cause) => city.originalPlayer() !== captor && !(cause instanceof SubvertCity_1.default)), new Effect_1.default((city, captor, loser, cause) => {
            var _a, _b, _c;
            const snapshot = snapshots.get(city);
            snapshots.delete(city);
            if (city.destroyed() ||
                (!(0, isBarbarian_1.default)(loser) &&
                    cityRegistry.getByPlayer(loser).length === 0)) {
                return;
            }
            const loserGovernment = (0, government_1.governmentOf)(loser, playerGovernmentRegistry), communistOrDemocracy = [Governments_1.Communism, Governments_1.Democracy].includes(Governments_1.governments[loserGovernment]);
            if (!communistOrDemocracy &&
                !discovered(GuerrillaWarfare_1.default) &&
                !knows(loser, Communism_1.default)) {
                return;
            }
            const ranks = (_a = snapshot === null || snapshot === void 0 ? void 0 : snapshot.ranks) !== null && _a !== void 0 ? _a : new Map(), count = (0, capture_1.partisanCount)({
                size: sizeOf(city),
                loserGovernment,
                captorGovernment: (0, government_1.governmentOf)(captor, playerGovernmentRegistry),
                loserRank: (_b = ranks.get(loser)) !== null && _b !== void 0 ? _b : 0,
                captorRank: (_c = ranks.get(captor)) !== null && _c !== void 0 ? _c : 0,
                incited: cause instanceof InciteRevolt_1.default,
                loserKnows: {
                    conscription: knows(loser, Conscription_1.default),
                    guerrillaWarfare: knows(loser, GuerrillaWarfare_1.default),
                    communism: knows(loser, Communism_1.default),
                    gunpowder: knows(loser, Gunpowder_1.default),
                },
                captorKnowsGuerrillaWarfare: knows(captor, GuerrillaWarfare_1.default),
            }), odds = (0, capture_1.partisanVeteranOdds)(vendetta(loser, captor), reputation(captor)), squares = partisanSquares(city), taken = new Set(), created = [];
            for (let index = 0; index < count; index++) {
                let best = 0, bestTile = null;
                squares.forEach((tile) => {
                    var _a, _b;
                    if (tile.isWater() ||
                        taken.has(tile) ||
                        cityRegistry.getByTile(tile) !== null ||
                        unitRegistry.getByTile(tile).length > 0) {
                        return;
                    }
                    const improvements = tileImprovementRegistry.getByTile(tile), has = (Type) => improvements.some((improvement) => improvement instanceof Type), score = (0, capture_1.partisanSquareScore)((_b = (_a = terrain_1.terrains[(0, terrainTable_1.terrainIndex)(tile.terrain())]) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : 0, has(Road_1.default), has(Railroad_1.default), has(Fortress_1.default) && !has(Airbase_1.default));
                    if (best < score) {
                        best = score;
                        bestTile = tile;
                    }
                });
                if (bestTile === null) {
                    continue;
                }
                taken.add(bestTile);
                const partisan = new Partisan_1.default(null, loser, bestTile, ruleRegistry), home = homeFor(bestTile);
                // Homed after it's made, so no rule for a unit built in a city (a Barracks) sees it.
                if (home !== null && home.player() === loser) {
                    partisan.setCity(home);
                }
                partisan.setActive(false);
                partisan.setBusy(new Fortified_1.default(new Criterion_1.default(() => false)));
                unitImprovementRegistry.register(new Fortified_2.default(partisan));
                if ((0, capture_1.isVeteranPartisan)(odds, odds >= 1 ? randomNumberGenerator() : 0)) {
                    unitImprovementRegistry.register(new Veteran_1.default(partisan));
                }
                created.push(partisan);
            }
            if (created.length > 0) {
                engine.emit('city:partisans', city, loser, created, captor);
            }
        })),
    ];
    /**
     * The city's squares in Civ2's order (`partisanOffsets`), reached along the map's diagonals; on a grid where
     *  those don't land in the city's own squares, the rest of its squares follow in their own order.
     */
    function partisanSquares(city) {
        const own = city.tiles().entries(), centre = city.tile(), ordered = [];
        capture_1.partisanOffsets.forEach(([dx, dy]) => {
            try {
                const tile = (0, capture_1.offsetSteps)(dx, dy).reduce((from, direction) => from.getNeighbour(direction), centre);
                if (tile !== centre && own.includes(tile) && !ordered.includes(tile)) {
                    ordered.push(tile);
                }
            }
            catch (e) {
                // Off the edge of a world that doesn't wrap.
            }
        });
        own
            .filter((tile) => tile !== centre && !ordered.includes(tile))
            .forEach((tile) => ordered.push(tile));
        return ordered;
    }
    /**
     * `unit_create`'s home: the nearest city of anyone's (the last of equals), if it's the unit's owner's. Measured by
     *  the world's own distance rather than Civ2's `map_distance_diag`.
     */
    function homeFor(tile) {
        let nearest = null, nearestDistance = Infinity;
        cityRegistry.entries().forEach((city) => {
            if (city.destroyed()) {
                return;
            }
            const distance = tile.distanceFrom(city.tile());
            if (distance <= nearestDistance) {
                nearest = city;
                nearestDistance = distance;
            }
        });
        return nearest;
    }
};
exports.captureRules = captureRules;
exports.default = exports.captureRules;
//# sourceMappingURL=captureAftermath.js.map