"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseProductionState = exports.civilizeOf = exports.attackOf = exports.FORTRESS_NEAR_CITY = exports.DEFAULT_POLICY = exports.CIVIL_DISORDER = void 0;
const Roles_1 = require("@civ-clone/base-unit-role/Roles");
const CityBuildRegistry_1 = require("@civ-clone/core-city-build/CityBuildRegistry");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Yields_1 = require("../Yields");
const GameDifficultyRegistry_1 = require("@civ-clone/core-difficulty/GameDifficultyRegistry");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const LandMassRegistry_1 = require("@civ-clone/core-world/LandMassRegistry");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const PlayerRegistry_1 = require("@civ-clone/core-player/PlayerRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const PlayerTradeRatesRegistry_1 = require("@civ-clone/core-trade-rate/PlayerTradeRatesRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const WonderRegistry_1 = require("@civ-clone/core-wonder/WonderRegistry");
const capitalLink_1 = require("./capitalLink");
const AdvancedFlight_1 = require("@civ-clone/base-science-advance-advancedflight/AdvancedFlight");
const Air_1 = require("@civ-clone/base-unit-type-air/Air");
const Airport_1 = require("@civ-clone/base-city-improvement-airport/Airport");
const Barracks_1 = require("@civ-clone/base-city-improvement-barracks/Barracks");
const Battleship_1 = require("@civ-clone/base-unit-battleship/Battleship");
const Bomber_1 = require("@civ-clone/base-unit-bomber/Bomber");
const calculateCitizenState_1 = require("@civ-clone/base-city-happiness/lib/calculateCitizenState");
const Civilized_1 = require("@civ-clone/base-leader-trait-militarism/Militarism/Civilized");
const Aggressive_1 = require("@civ-clone/base-leader-trait-aggression/Aggression/Aggressive");
const CruiseMissile_1 = require("@civ-clone/base-unit-cruisemissile/CruiseMissile");
const Cruiser_1 = require("@civ-clone/base-unit-cruiser/Cruiser");
const Destroyer_1 = require("@civ-clone/base-unit-destroyer/Destroyer");
const Factory_1 = require("@civ-clone/base-city-improvement-factory/Factory");
const Farmland_1 = require("@civ-clone/base-tile-improvement-farmland/Farmland");
const Fortress_1 = require("@civ-clone/base-tile-improvement-fortress/Fortress");
const Friendly_1 = require("@civ-clone/base-leader-trait-aggression/Aggression/Friendly");
const GreatWall_1 = require("@civ-clone/base-wonder-great-wall/GreatWall");
const Helicopter_1 = require("@civ-clone/base-unit-helicopter/Helicopter");
const Ironclad_1 = require("@civ-clone/base-unit-ironclad/Ironclad");
const ManhattanProject_1 = require("@civ-clone/base-wonder-manhattanproject/ManhattanProject");
const ManufacturingPlant_1 = require("@civ-clone/base-city-improvement-manufacturingplant/ManufacturingPlant");
const MichelangelosChapel_1 = require("@civ-clone/base-wonder-michelangeloschapel/MichelangelosChapel");
const Militaristic_1 = require("@civ-clone/base-leader-trait-militarism/Militarism/Militaristic");
const Nuclear_1 = require("@civ-clone/base-unit-nuclear/Nuclear");
const Palace_1 = require("@civ-clone/base-city-improvement-palace/Palace");
const PortFacility_1 = require("@civ-clone/base-city-improvement-portfacility/PortFacility");
const Pyramids_1 = require("@civ-clone/base-wonder-pyramids/Pyramids");
const Research_1 = require("@civ-clone/base-trade-rate-research/Research");
const Robotics_1 = require("@civ-clone/base-science-advance-robotics/Robotics");
const Rocketry_1 = require("@civ-clone/base-science-advance-rocketry/Rocketry");
const ShakespearesTheatre_1 = require("@civ-clone/base-wonder-shakespearestheatre/ShakespearesTheatre");
const StealthBomber_1 = require("@civ-clone/base-unit-stealthbomber/StealthBomber");
const SunTzusWarAcademy_1 = require("@civ-clone/base-wonder-suntzuswaracademy/SunTzusWarAcademy");
const War_1 = require("@civ-clone/base-diplomacy-declaration-war/War");
const WomensSuffrage_1 = require("@civ-clone/base-wonder-womenssuffrage/WomensSuffrage");
const cityStatus_1 = require("@civ-clone/base-city-happiness-status/lib/cityStatus");
const government_1 = require("./government");
const roleOf_1 = require("@civ-clone/base-unit-role/roleOf");
const isBarbarian_1 = require("@civ-clone/base-civilization-barbarian/isBarbarian");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
const traits_1 = require("@civ-clone/core-unit/traits");
const level_1 = require("@civ-clone/civ2-difficulty/level");
/** civ2-city-happiness' status for a city in civil disorder (`CITYF_DISORDER`), named here as `lib/celebrating` names its. */
exports.CIVIL_DISORDER = 'civ2-city-happiness:civil-disorder';
/** `continent_policy` with no AI assessment to say otherwise: 5, the land mass isn't crowded, nothing to attack or defend. */
exports.DEFAULT_POLICY = 5;
/** A unit on a Fortress this close to one of its player's cities (`map_distance` < 4) isn't aggressive. */
exports.FORTRESS_NEAR_CITY = 4;
const sum = (yields, include) => yields
    .filter(include)
    .reduce((total, cityYield) => total + cityYield.value(), 0);
/** The leader's `attack`: 1 Aggressive, −1 Friendly (rational), 0 otherwise (as civ2-diplomacy reads it). */
const attackOf = (player) => {
    var _a, _b;
    const traits = (_b = (_a = player.civilization().leader()) === null || _a === void 0 ? void 0 : _a.traits()) !== null && _b !== void 0 ? _b : [];
    return traits.some((trait) => trait instanceof Aggressive_1.default)
        ? 1
        : traits.some((trait) => trait instanceof Friendly_1.default)
            ? -1
            : 0;
};
exports.attackOf = attackOf;
/** The leader's `civilize`: 1 Civilized, −1 Militaristic, 0 otherwise (as civ2-player reads it). */
const civilizeOf = (player) => {
    var _a, _b;
    const traits = (_b = (_a = player.civilization().leader()) === null || _a === void 0 ? void 0 : _a.traits()) !== null && _b !== void 0 ? _b : [];
    return traits.some((trait) => trait instanceof Civilized_1.default)
        ? 1
        : traits.some((trait) => trait instanceof Militaristic_1.default)
            ? -1
            : 0;
};
exports.civilizeOf = civilizeOf;
/**
 * What `city_choose_production` surveys (`src/auto/city_production.cpp` ~2095 and its parts `_scan_tiles`,
 *  `_survey_cities`, `_defense_need`; richardpenman/civ2@49f26ec), from a game. `yields` are the city's, worked out once
 *  for every item ranked.
 */
const chooseProductionState = (city, yields, dependencies = {}) => {
    const { cityBuildRegistry = CityBuildRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance, cityRegistry = CityRegistry_1.instance, clientRegistry = ClientRegistry_1.instance, gameDifficultyRegistry = GameDifficultyRegistry_1.instance, interactionRegistry = InteractionRegistry_1.instance, landMassRegistry = LandMassRegistry_1.instance, pendingEffectRegistry = core_pending_effect_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, playerRegistry = PlayerRegistry_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance, playerTradeRatesRegistry = PlayerTradeRatesRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, wonderRegistry = WonderRegistry_1.instance, continentPolicy = () => exports.DEFAULT_POLICY, defendedLandMass = () => false, citizens = (city, yields) => {
        const state = (0, calculateCitizenState_1.calculateCitizenState)(cityGrowthRegistry.getByCity(city), yields, specialistRegistry);
        return {
            happy: state.filter((citizen) => citizen === calculateCitizenState_1.CitizenState.Happy)
                .length,
            unhappy: state.filter((citizen) => citizen === calculateCitizenState_1.CitizenState.Unhappy || citizen === calculateCitizenState_1.CitizenState.Angry).length,
        };
    }, aggressiveUnits = (city) => unitRegistry
        .getByCity(city)
        .filter((unit) => isAggressive(unit)).length, bestHuman = () => {
        var _a;
        return (_a = playerRegistry
            .entries()
            .find((player) => (0, isHuman_1.default)(player, clientRegistry))) !== null && _a !== void 0 ? _a : null;
    }, } = dependencies, player = city.player(), human = (0, isHuman_1.default)(player, clientRegistry), landMassOf = (tile) => landMassRegistry.getByTile(tile), landMass = landMassOf(city.tile()), onLandMass = (other) => landMassOf(other.tile()) === landMass, has = (target, Improvement) => cityImprovementRegistry
        .getByCity(target)
        .some((improvement) => improvement instanceof Improvement), building = (target, Item) => { var _a; return ((_a = cityBuildRegistry.getByCity(target).building()) === null || _a === void 0 ? void 0 : _a.item()) === Item; }, ownsWonder = (Type) => wonderRegistry
        .getByPlayer(player)
        .some((wonder) => wonder instanceof Type), knows = (who, AdvanceType) => {
        try {
            return playerResearchRegistry.getByPlayer(who).completed(AdvanceType);
        }
        catch (e) {
            return false;
        }
    }, anyoneKnows = (AdvanceType) => playerRegistry
        .entries()
        .some((other) => knows(other, AdvanceType)), atWar = (other) => other !== player &&
        interactionRegistry
            .getByPlayers(player, other)
            .some((interaction) => interaction instanceof War_1.default && interaction.active()), count = (owner, Type) => unitRegistry
        .getByPlayer(owner)
        .filter((unit) => unit instanceof Type).length, threatOf = (other) => ({
        hostile: other !== null && atWar(other),
        cruiseMissiles: other === null ? 0 : count(other, CruiseMissile_1.default),
        bombers: other === null ? 0 : count(other, Bomber_1.default),
        helicopters: other === null ? 0 : count(other, Helicopter_1.default),
        stealthBombers: other === null ? 0 : count(other, StealthBomber_1.default),
        ironclads: other === null ? 0 : count(other, Ironclad_1.default),
        destroyers: other === null ? 0 : count(other, Destroyer_1.default),
        cruisers: other === null ? 0 : count(other, Cruiser_1.default),
        // No AEGIS Cruiser class exists yet.
        aegisCruisers: 0,
        battleships: other === null ? 0 : count(other, Battleship_1.default),
    }), 
    // `city_calc_unit_support` (`src/auto/city.cpp` ~2735): an attack, a role below diplomacy, and an aircraft other
    //  than a fighter, or any other unit off every city's square and not on a Fortress near one of its player's cities.
    isAggressive = (unit) => {
        if (unit.attack().value() <= 0 ||
            (0, roleOf_1.hasRole)(unit, Roles_1.DiplomacyRole, ruleRegistry) ||
            (0, roleOf_1.hasRole)(unit, Roles_1.TradeRole, ruleRegistry)) {
            return false;
        }
        if ((0, traits_1.isA)(unit, Air_1.default)) {
            return !(0, roleOf_1.hasRole)(unit, Roles_1.AirSuperiorityRole, ruleRegistry);
        }
        const tile = unit.tile();
        if (cityRegistry.getByTile(tile) !== null) {
            return false;
        }
        return !(tileImprovementRegistry
            .getByTile(tile)
            .some((improvement) => improvement instanceof Fortress_1.default) &&
            cityRegistry
                .getByPlayer(unit.player())
                .some((own) => (0, capitalLink_1.moveDistance)(own.tile(), tile) < exports.FORTRESS_NEAR_CITY));
    }, ownCities = cityRegistry.getByPlayer(player), otherCitiesHere = ownCities.filter((other) => other !== city && onLandMass(other)), palaces = ownCities.filter((other) => has(other, Palace_1.default) || building(other, Palace_1.default)), 
    // The city's 20 squares, without its own (`city_tile_dx_table`'s first 20).
    squares = city
        .tiles()
        .entries()
        .filter((tile) => tile !== city.tile()), worked = city.tilesWorked().entries(), policy = continentPolicy(city), attack = (0, exports.attackOf)(player), 
    // A human player's cities taken from the player on this land mass, more than the leader's attack + 1, threaten it
    //  whatever the policy.
    lostCities = cityRegistry
        .entries()
        .filter((other) => other.originalPlayer() === player &&
        other.player() !== player &&
        onLandMass(other) &&
        (0, isHuman_1.default)(other.player(), clientRegistry)).length, { happy, unhappy } = citizens(city, yields), best = bestHuman(player), ports = ownCities.filter((other) => has(other, PortFacility_1.default)), cityUnits = unitRegistry.getByTile(city.tile()), others = playerRegistry
        .entries()
        .filter((other) => other !== player && !(0, isBarbarian_1.default)(other)), humans = playerRegistry
        .entries()
        .filter((other) => (0, isHuman_1.default)(other, clientRegistry))
        .map((other) => ({
        atWar: atWar(other),
        citiesOnLandMass: cityRegistry.getByPlayer(other).some(onLandMass),
        // No reputation is kept yet.
        badReputation: false,
    }));
    let science = true;
    try {
        science =
            playerTradeRatesRegistry.getByPlayer(player).get(Research_1.default).value() !== 0;
    }
    catch (e) {
        // A player with no trade rates (a test's) is taken to spend on science.
    }
    return {
        human,
        difficulty: (0, level_1.levelOf)(gameDifficultyRegistry),
        government: (0, government_1.default)(player, playerGovernmentRegistry),
        civilize: (0, exports.civilizeOf)(player),
        attack,
        policy,
        threatened: policy === 0 || policy === 1 || lostCities > attack + 1,
        defendedLandMass: defendedLandMass(city),
        citiesOnLandMass: ownCities.filter(onLandMass).length,
        size: cityGrowthRegistry.getByCity(city).size(),
        // `cities[s->city2]` one past the last city: an empty slot.
        staleSize: 0,
        foodSurplus: sum(yields, (cityYield) => cityYield instanceof Yields_1.Food),
        totalShields: sum(yields, (cityYield) => cityYield instanceof Yields_1.Production &&
            !(cityYield instanceof Yields_1.UnitSupportProduction)),
        shieldWaste: -sum(yields, (cityYield) => cityYield instanceof Yields_1.Waste),
        shieldSupport: -sum(yields, (cityYield) => cityYield instanceof Yields_1.UnitSupportProduction),
        totalTrade: sum(yields, (cityYield) => cityYield instanceof Yields_1.Trade && !(cityYield instanceof Yields_1.Corruption)),
        tradeCorruption: -sum(yields, (cityYield) => cityYield instanceof Yields_1.Corruption),
        happy,
        unhappy,
        disorder: (0, cityStatus_1.cityStatus)(exports.CIVIL_DISORDER, city, pendingEffectRegistry) !== null,
        oceanTiles: squares
            .filter((tile) => tile.isWater())
            .reduce((total, tile) => total + (worked.includes(tile) ? 4 : 1), 0),
        farmland: squares.filter((tile) => tileImprovementRegistry
            .getByTile(tile)
            .some((improvement) => improvement instanceof Farmland_1.default)).length,
        palaceCount: palaces.length,
        palaceSize: palaces.reduce((largest, other) => Math.max(largest, cityGrowthRegistry.getByCity(other).size()), 0),
        barracksCount: (ownsWonder(SunTzusWarAcademy_1.default) ? 4 : 0) +
            otherCitiesHere.filter((other) => has(other, Barracks_1.default))
                .length +
            otherCitiesHere.filter((other) => building(other, Barracks_1.default)).length,
        airportCount: otherCitiesHere.filter((other) => has(other, Airport_1.default)).length,
        portCount: otherCitiesHere.filter((other) => has(other, PortFacility_1.default)).length,
        hasPalace: has(city, Palace_1.default),
        hasBarracks: has(city, Barracks_1.default),
        hasFactory: has(city, Factory_1.default),
        hasManufacturingPlant: has(city, ManufacturingPlant_1.default),
        shakespeareHere: wonderRegistry
            .getByCity(city)
            .some((wonder) => wonder instanceof ShakespearesTheatre_1.default),
        greatWall: ownsWonder(GreatWall_1.default),
        michelangelo: ownsWonder(MichelangelosChapel_1.default),
        pyramids: ownsWonder(Pyramids_1.default),
        womensSuffrage: ownsWonder(WomensSuffrage_1.default),
        manhattanBuilt: wonderRegistry
            .entries()
            .some((wonder) => wonder instanceof ManhattanProject_1.default),
        roboticsKnown: anyoneKnows(Robotics_1.default),
        advancedFlightKnown: anyoneKnows(AdvancedFlight_1.default),
        rocketryKnown: anyoneKnows(Rocketry_1.default),
        knowsAdvancedFlight: knows(player, AdvancedFlight_1.default),
        // No spaceship yet: `spaceRace` is 0, so Space Flight is never asked.
        knowsSpaceFlight: false,
        science,
        spaceRace: 0,
        coastal: city
            .tile()
            .getNeighbours()
            .some((tile) => tile.isWater()),
        aggressiveUnits: aggressiveUnits(city),
        nearestPortDistance: ports.reduce((nearest, other) => Math.min(nearest, (0, capitalLink_1.diagonalDistance)(city.tile(), other.tile())), 9999),
        navalUnits: cityUnits.filter((unit) => (0, roleOf_1.hasRole)(unit, Roles_1.NavalSuperiorityRole, ruleRegistry)).length +
            (cityUnits.filter((unit) => (0, roleOf_1.hasRole)(unit, Roles_1.TransportRole, ruleRegistry)).length >>
                1),
        bestHuman: threatOf(best),
        bestHumanNuclearMissiles: best === null ? 0 : count(best, Nuclear_1.default),
        // No subversion is counted yet.
        bestHumanSubversion: 0,
        others: others.map(threatOf),
        humans,
    };
};
exports.chooseProductionState = chooseProductionState;
exports.default = exports.chooseProductionState;
//# sourceMappingURL=chooseProductionState.js.map