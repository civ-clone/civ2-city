import {
  AirSuperiorityRole,
  DiplomacyRole,
  NavalSuperiorityRole,
  TradeRole,
  TransportRole,
} from '@civ-clone/base-unit-role/Roles';
import {
  ChooseProductionState,
  HumanPlayer,
  OtherPlayerThreat,
} from './chooseProduction';
import {
  CityBuildRegistry,
  instance as cityBuildRegistryInstance,
} from '@civ-clone/core-city-build/CityBuildRegistry';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  Corruption,
  Food,
  Production,
  Trade,
  UnitSupportProduction,
  Waste,
} from '../Yields';
import {
  GameDifficultyRegistry,
  instance as gameDifficultyRegistryInstance,
} from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import {
  InteractionRegistry,
  instance as interactionRegistryInstance,
} from '@civ-clone/core-diplomacy/InteractionRegistry';
import {
  LandMassRegistry,
  instance as landMassRegistryInstance,
} from '@civ-clone/core-world/LandMassRegistry';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  PlayerRegistry,
  instance as playerRegistryInstance,
} from '@civ-clone/core-player/PlayerRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  PlayerTradeRatesRegistry,
  instance as playerTradeRatesRegistryInstance,
} from '@civ-clone/core-trade-rate/PlayerTradeRatesRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  WonderRegistry,
  instance as wonderRegistryInstance,
} from '@civ-clone/core-wonder/WonderRegistry';
import { diagonalDistance, moveDistance } from './capitalLink';
import Advance from '@civ-clone/core-science/Advance';
import AdvancedFlight from '@civ-clone/base-science-advance-advancedflight/AdvancedFlight';
import Air from '@civ-clone/base-unit-type-air/Air';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import Battleship from '@civ-clone/base-unit-battleship/Battleship';
import Bomber from '@civ-clone/base-unit-bomber/Bomber';
import City from '@civ-clone/core-city/City';
import { founderOf } from './founder';
import CityImprovement from '@civ-clone/core-city-improvement/CityImprovement';
import {
  CitizenState,
  calculateCitizenState,
} from '@civ-clone/base-city-happiness/lib/calculateCitizenState';
import Civilized from '@civ-clone/base-leader-trait-militarism/Militarism/Civilized';
import Aggressive from '@civ-clone/base-leader-trait-aggression/Aggression/Aggressive';
import CruiseMissile from '@civ-clone/base-unit-cruisemissile/CruiseMissile';
import Cruiser from '@civ-clone/base-unit-cruiser/Cruiser';
import Destroyer from '@civ-clone/base-unit-destroyer/Destroyer';
import Factory from '@civ-clone/base-city-improvement-factory/Factory';
import Farmland from '@civ-clone/base-tile-improvement-farmland/Farmland';
import Fortress from '@civ-clone/base-tile-improvement-fortress/Fortress';
import Friendly from '@civ-clone/base-leader-trait-aggression/Aggression/Friendly';
import GreatWall from '@civ-clone/base-wonder-great-wall/GreatWall';
import Helicopter from '@civ-clone/base-unit-helicopter/Helicopter';
import Ironclad from '@civ-clone/base-unit-ironclad/Ironclad';
import {
  Fuel,
  Habitation,
  LifeSupport,
  Power,
  Propulsion,
  Structural,
} from './spaceshipParts';
import {
  SpaceshipRegistry,
  instance as spaceshipRegistryInstance,
} from '@civ-clone/core-spaceship/SpaceshipRegistry';
import ApolloProgram from '@civ-clone/base-wonder-apolloprogram/ApolloProgram';
import Part from '@civ-clone/core-spaceship/Part';
import SpaceFlight from '@civ-clone/base-science-advance-spaceflight/SpaceFlight';
import Spaceship from '@civ-clone/core-spaceship/Spaceship';
import ManhattanProject from '@civ-clone/base-wonder-manhattanproject/ManhattanProject';
import ManufacturingPlant from '@civ-clone/base-city-improvement-manufacturingplant/ManufacturingPlant';
import MichelangelosChapel from '@civ-clone/base-wonder-michelangeloschapel/MichelangelosChapel';
import Militaristic from '@civ-clone/base-leader-trait-militarism/Militarism/Militaristic';
import Nuclear from '@civ-clone/base-unit-nuclear/Nuclear';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import Player from '@civ-clone/core-player/Player';
import PortFacility from '@civ-clone/base-city-improvement-portfacility/PortFacility';
import Pyramids from '@civ-clone/base-wonder-pyramids/Pyramids';
import Research from '@civ-clone/base-trade-rate-research/Research';
import Robotics from '@civ-clone/base-science-advance-robotics/Robotics';
import Rocketry from '@civ-clone/base-science-advance-rocketry/Rocketry';
import ShakespearesTheatre from '@civ-clone/base-wonder-shakespearestheatre/ShakespearesTheatre';
import StealthBomber from '@civ-clone/base-unit-stealthbomber/StealthBomber';
import SunTzusWarAcademy from '@civ-clone/base-wonder-suntzuswaracademy/SunTzusWarAcademy';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import War from '@civ-clone/base-diplomacy-declaration-war/War';
import Wonder from '@civ-clone/core-wonder/Wonder';
import WomensSuffrage from '@civ-clone/base-wonder-womenssuffrage/WomensSuffrage';
import Yield from '@civ-clone/core-yield/Yield';
import { cityStatus } from '@civ-clone/base-city-happiness-status/lib/cityStatus';
import governmentOf from './government';
import { hasRole } from '@civ-clone/base-unit-role/roleOf';
import isBarbarian from '@civ-clone/base-civilization-barbarian/isBarbarian';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';
import { isA } from '@civ-clone/core-unit/traits';
import { levelOf } from '@civ-clone/civ2-difficulty/level';

/** civ2-city-happiness' status for a city in civil disorder (`CITYF_DISORDER`), named here as `lib/celebrating` names its. */
export const CIVIL_DISORDER = 'civ2-city-happiness:civil-disorder';

/** `continent_policy` with no AI assessment to say otherwise: 5, the land mass isn't crowded, nothing to attack or defend. */
export const DEFAULT_POLICY = 5;

/** A unit on a Fortress this close to one of its player's cities (`map_distance` < 4) isn't aggressive. */
export const FORTRESS_NEAR_CITY = 4;

export interface ChooseProductionDependencies {
  cityBuildRegistry?: CityBuildRegistry;
  cityGrowthRegistry?: CityGrowthRegistry;
  cityImprovementRegistry?: CityImprovementRegistry;
  cityRegistry?: CityRegistry;
  clientRegistry?: ClientRegistry;
  gameDifficultyRegistry?: GameDifficultyRegistry;
  interactionRegistry?: InteractionRegistry;
  landMassRegistry?: LandMassRegistry;
  pendingEffectRegistry?: PendingEffectRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  playerRegistry?: PlayerRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  playerTradeRatesRegistry?: PlayerTradeRatesRegistry;
  ruleRegistry?: RuleRegistry;
  spaceshipRegistry?: SpaceshipRegistry;
  specialistRegistry?: SpecialistRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  unitRegistry?: UnitRegistry;
  wonderRegistry?: WonderRegistry;
  /**
   * The player's `continent_policy` on the city's land mass (0 attack, 1 defend, 4 crowded, 5 expand), which the AI's
   *  `ai_civ_turn_assess` works out for every player each turn (`src/auto/ai.cpp`). No such assessment exists yet:
   *  `DEFAULT_POLICY` by default, for the AI (stage N) to supply.
   */
  continentPolicy?: (city: City) => number;
  /** `continent_flags & 0x10` for the city's land mass (the AI has had to defend there): none by default. */
  defendedLandMass?: (city: City) => boolean;
  /** The city's happy and unhappy citizens. base-city-happiness' unstaged count by default; pass Civ2's staged one. */
  citizens?: (
    city: City,
    yields: Yield[]
  ) => { happy: number; unhappy: number };
  /** `city_calc.aggressive_units`: the city's units that make its citizens unhappy away from home. */
  aggressiveUnits?: (city: City) => number;
  /** `game.best_human_rank`: the first human player by default (there are no power ranks yet). */
  bestHuman?: (player: Player) => Player | null;
}

const sum = (yields: Yield[], include: (cityYield: Yield) => boolean): number =>
  yields
    .filter(include)
    .reduce(
      (total: number, cityYield: Yield): number => total + cityYield.value(),
      0
    );

/** The leader's `attack`: 1 Aggressive, −1 Friendly (rational), 0 otherwise (as civ2-diplomacy reads it). */
export const attackOf = (player: Player): number => {
  const traits = player.civilization().leader()?.traits() ?? [];

  return traits.some((trait) => trait instanceof Aggressive)
    ? 1
    : traits.some((trait) => trait instanceof Friendly)
    ? -1
    : 0;
};

/** The leader's `civilize`: 1 Civilized, −1 Militaristic, 0 otherwise (as civ2-player reads it). */
export const civilizeOf = (player: Player): number => {
  const traits = player.civilization().leader()?.traits() ?? [];

  return traits.some((trait) => trait instanceof Civilized)
    ? 1
    : traits.some((trait) => trait instanceof Militaristic)
    ? -1
    : 0;
};

/**
 * What `city_choose_production` surveys (`src/auto/city_production.cpp` ~2095 and its parts `_scan_tiles`,
 *  `_survey_cities`, `_defense_need`; richardpenman/civ2@49f26ec), from a game. `yields` are the city's, worked out once
 *  for every item ranked.
 */
export const chooseProductionState = (
  city: City,
  yields: Yield[],
  dependencies: ChooseProductionDependencies = {}
): ChooseProductionState => {
  const {
      cityBuildRegistry = cityBuildRegistryInstance,
      cityGrowthRegistry = cityGrowthRegistryInstance,
      cityImprovementRegistry = cityImprovementRegistryInstance,
      cityRegistry = cityRegistryInstance,
      clientRegistry = clientRegistryInstance,
      gameDifficultyRegistry = gameDifficultyRegistryInstance,
      interactionRegistry = interactionRegistryInstance,
      landMassRegistry = landMassRegistryInstance,
      pendingEffectRegistry = pendingEffectRegistryInstance,
      playerGovernmentRegistry = playerGovernmentRegistryInstance,
      playerRegistry = playerRegistryInstance,
      playerResearchRegistry = playerResearchRegistryInstance,
      playerTradeRatesRegistry = playerTradeRatesRegistryInstance,
      ruleRegistry = ruleRegistryInstance,
      spaceshipRegistry = spaceshipRegistryInstance,
      specialistRegistry = specialistRegistryInstance,
      tileImprovementRegistry = tileImprovementRegistryInstance,
      unitRegistry = unitRegistryInstance,
      wonderRegistry = wonderRegistryInstance,
      continentPolicy = (): number => DEFAULT_POLICY,
      defendedLandMass = (): boolean => false,
      citizens = (city: City, yields: Yield[]) => {
        const state = calculateCitizenState(
          cityGrowthRegistry.getByCity(city),
          yields,
          specialistRegistry
        );

        return {
          happy: state.filter((citizen) => citizen === CitizenState.Happy)
            .length,
          unhappy: state.filter(
            (citizen) =>
              citizen === CitizenState.Unhappy || citizen === CitizenState.Angry
          ).length,
        };
      },
      aggressiveUnits = (city: City): number =>
        unitRegistry
          .getByCity(city)
          .filter((unit: Unit): boolean => isAggressive(unit)).length,
      bestHuman = (): Player | null =>
        playerRegistry
          .entries()
          .find((player: Player): boolean => isHuman(player, clientRegistry)) ??
        null,
    } = dependencies,
    player = city.player(),
    human = isHuman(player, clientRegistry),
    landMassOf = (tile: Tile) => landMassRegistry.getByTile(tile),
    landMass = landMassOf(city.tile()),
    onLandMass = (other: City): boolean =>
      landMassOf(other.tile()) === landMass,
    has = (target: City, Improvement: typeof CityImprovement): boolean =>
      cityImprovementRegistry
        .getByCity(target)
        .some((improvement) => improvement instanceof Improvement),
    building = (target: City, Item: typeof CityImprovement): boolean =>
      cityBuildRegistry.getByCity(target).building()?.item() === Item,
    ownsWonder = (Type: typeof Wonder): boolean =>
      wonderRegistry
        .getByPlayer(player)
        .some((wonder: Wonder): boolean => wonder instanceof Type),
    knows = (who: Player, AdvanceType: typeof Advance): boolean => {
      try {
        return playerResearchRegistry.getByPlayer(who).completed(AdvanceType);
      } catch (e) {
        return false;
      }
    },
    anyoneKnows = (AdvanceType: typeof Advance): boolean =>
      playerRegistry
        .entries()
        .some((other: Player): boolean => knows(other, AdvanceType)),
    atWar = (other: Player): boolean =>
      other !== player &&
      interactionRegistry
        .getByPlayers(player, other)
        .some(
          (interaction) => interaction instanceof War && interaction.active()
        ),
    count = (owner: Player, Type: typeof Unit): number =>
      unitRegistry
        .getByPlayer(owner)
        .filter((unit: Unit): boolean => unit instanceof Type).length,
    threatOf = (other: Player | null): OtherPlayerThreat => ({
      hostile: other !== null && atWar(other),
      cruiseMissiles: other === null ? 0 : count(other, CruiseMissile),
      bombers: other === null ? 0 : count(other, Bomber),
      helicopters: other === null ? 0 : count(other, Helicopter),
      stealthBombers: other === null ? 0 : count(other, StealthBomber),
      ironclads: other === null ? 0 : count(other, Ironclad),
      destroyers: other === null ? 0 : count(other, Destroyer),
      cruisers: other === null ? 0 : count(other, Cruiser),
      // No AEGIS Cruiser class exists yet.
      aegisCruisers: 0,
      battleships: other === null ? 0 : count(other, Battleship),
    }),
    // `city_calc_unit_support` (`src/auto/city.cpp` ~2735): an attack, a role below diplomacy, and an aircraft other
    //  than a fighter, or any other unit off every city's square and not on a Fortress near one of its player's cities.
    isAggressive = (unit: Unit): boolean => {
      if (
        unit.attack().value() <= 0 ||
        hasRole(unit, DiplomacyRole, ruleRegistry) ||
        hasRole(unit, TradeRole, ruleRegistry)
      ) {
        return false;
      }

      if (isA(unit, Air)) {
        return !hasRole(unit, AirSuperiorityRole, ruleRegistry);
      }

      const tile = unit.tile();

      if (cityRegistry.getByTile(tile) !== null) {
        return false;
      }

      return !(
        tileImprovementRegistry
          .getByTile(tile)
          .some((improvement) => improvement instanceof Fortress) &&
        cityRegistry
          .getByPlayer(unit.player())
          .some(
            (own: City): boolean =>
              moveDistance(own.tile(), tile) < FORTRESS_NEAR_CITY
          )
      );
    },
    ownCities = cityRegistry.getByPlayer(player),
    otherCitiesHere = ownCities.filter(
      (other: City): boolean => other !== city && onLandMass(other)
    ),
    palaces = ownCities.filter(
      (other: City): boolean => has(other, Palace) || building(other, Palace)
    ),
    // The city's 20 squares, without its own (`city_tile_dx_table`'s first 20).
    squares = city
      .tiles()
      .entries()
      .filter((tile: Tile): boolean => tile !== city.tile()),
    worked = city.tilesWorked().entries(),
    policy = continentPolicy(city),
    attack = attackOf(player),
    // A human player's cities taken from the player on this land mass, more than the leader's attack + 1, threaten it
    //  whatever the policy.
    lostCities = cityRegistry.entries().filter(
      (other: City): boolean =>
        founderOf(other, other.player(), {
          pendingEffectRegistry,
          playerRegistry,
        }) === player &&
        other.player() !== player &&
        onLandMass(other) &&
        isHuman(other.player(), clientRegistry)
    ).length,
    { happy, unhappy } = citizens(city, yields),
    best = bestHuman(player),
    ports = ownCities.filter((other: City): boolean =>
      has(other, PortFacility)
    ),
    cityUnits = unitRegistry.getByTile(city.tile()),
    others = playerRegistry
      .entries()
      .filter(
        (other: Player): boolean => other !== player && !isBarbarian(other)
      ),
    humans = playerRegistry
      .entries()
      .filter((other: Player): boolean => isHuman(other, clientRegistry))
      .map(
        (other: Player): HumanPlayer => ({
          atWar: atWar(other),
          citiesOnLandMass: cityRegistry.getByPlayer(other).some(onLandMass),
          // No reputation is kept yet.
          badReputation: false,
        })
      );

  // The space race (`spaceship_race_active`, `ai_spaceship_race_behind`, `ai.cpp:6695`): active once anyone has built the
  //  Apollo Program or a person knows Space Flight; a computer player is behind, above Chieftain and before its own
  //  launch, once a person's ship has launched or a person knowing Space Flight has put as much into parts as it has.
  //  Parts are counted at their groups' costs (structurals 80, components 160, modules 320). The game's being won isn't
  //  asked: a won game is over.
  const people = playerRegistry
      .entries()
      .filter((other: Player): boolean => isHuman(other, clientRegistry)),
    shipOf = (owner: Player): Spaceship | null =>
      spaceshipRegistry.getActiveByPlayer(owner),
    partsOf = (ship: Spaceship | null): Part[] =>
      ship === null ? [] : [...ship.activeParts(), ...ship.inactiveParts()],
    launched = (owner: Player): boolean =>
      spaceshipRegistry
        .getBy('player', owner)
        .some(
          (ship: Spaceship): boolean =>
            ship.launched() !== false && ship.successful() !== false
        ),
    exists = (owner: Player): boolean =>
      launched(owner) || partsOf(shipOf(owner)).length > 0,
    partsCost = (owner: Player): number =>
      partsOf(shipOf(owner)).reduce(
        (total: number, part: Part): number =>
          total +
          (part instanceof Structural
            ? 80
            : part instanceof Propulsion || part instanceof Fuel
            ? 160
            : part instanceof Habitation ||
              part instanceof LifeSupport ||
              part instanceof Power
            ? 320
            : 0),
        0
      ),
    raceActive =
      wonderRegistry
        .entries()
        .some((wonder: Wonder): boolean => wonder instanceof ApolloProgram) ||
      people.some((other: Player): boolean => knows(other, SpaceFlight)),
    shipLaunched = launched(player),
    humanLaunched = people.some(launched),
    behind =
      raceActive &&
      !shipLaunched &&
      levelOf(gameDifficultyRegistry) !== 0 &&
      !human &&
      (humanLaunched ||
        people.some(
          (other: Player): boolean =>
            other !== player &&
            knows(other, SpaceFlight) &&
            partsCost(player) <= partsCost(other)
        ));

  let science = true;

  try {
    science =
      playerTradeRatesRegistry.getByPlayer(player).get(Research).value() !== 0;
  } catch (e) {
    // A player with no trade rates (a test's) is taken to spend on science.
  }

  return {
    human,
    difficulty: levelOf(gameDifficultyRegistry),
    government: governmentOf(player, playerGovernmentRegistry),
    civilize: civilizeOf(player),
    attack,
    policy,
    threatened: policy === 0 || policy === 1 || lostCities > attack + 1,
    defendedLandMass: defendedLandMass(city),
    citiesOnLandMass: ownCities.filter(onLandMass).length,
    size: cityGrowthRegistry.getByCity(city).size(),
    // `cities[s->city2]` one past the last city: an empty slot.
    staleSize: 0,
    foodSurplus: sum(yields, (cityYield) => cityYield instanceof Food),
    totalShields: sum(
      yields,
      (cityYield) =>
        cityYield instanceof Production &&
        !(cityYield instanceof UnitSupportProduction)
    ),
    shieldWaste: -sum(yields, (cityYield) => cityYield instanceof Waste),
    shieldSupport: -sum(
      yields,
      (cityYield) => cityYield instanceof UnitSupportProduction
    ),
    totalTrade: sum(
      yields,
      (cityYield) =>
        cityYield instanceof Trade && !(cityYield instanceof Corruption)
    ),
    tradeCorruption: -sum(
      yields,
      (cityYield) => cityYield instanceof Corruption
    ),
    happy,
    unhappy,
    disorder: cityStatus(CIVIL_DISORDER, city, pendingEffectRegistry) !== null,
    oceanTiles: squares
      .filter((tile: Tile): boolean => tile.isWater())
      .reduce(
        (total: number, tile: Tile): number =>
          total + (worked.includes(tile) ? 4 : 1),
        0
      ),
    farmland: squares.filter((tile: Tile): boolean =>
      tileImprovementRegistry
        .getByTile(tile)
        .some((improvement) => improvement instanceof Farmland)
    ).length,
    palaceCount: palaces.length,
    palaceSize: palaces.reduce(
      (largest: number, other: City): number =>
        Math.max(largest, cityGrowthRegistry.getByCity(other).size()),
      0
    ),
    barracksCount:
      (ownsWonder(SunTzusWarAcademy) ? 4 : 0) +
      otherCitiesHere.filter((other: City): boolean => has(other, Barracks))
        .length +
      otherCitiesHere.filter((other: City): boolean =>
        building(other, Barracks)
      ).length,
    airportCount: otherCitiesHere.filter((other: City): boolean =>
      has(other, Airport)
    ).length,
    portCount: otherCitiesHere.filter((other: City): boolean =>
      has(other, PortFacility)
    ).length,
    hasPalace: has(city, Palace),
    hasBarracks: has(city, Barracks),
    hasFactory: has(city, Factory),
    hasManufacturingPlant: has(city, ManufacturingPlant),
    shakespeareHere: wonderRegistry
      .getByCity(city)
      .some((wonder) => wonder instanceof ShakespearesTheatre),
    greatWall: ownsWonder(GreatWall),
    michelangelo: ownsWonder(MichelangelosChapel),
    pyramids: ownsWonder(Pyramids),
    womensSuffrage: ownsWonder(WomensSuffrage),
    manhattanBuilt: wonderRegistry
      .entries()
      .some((wonder) => wonder instanceof ManhattanProject),
    roboticsKnown: anyoneKnows(Robotics),
    advancedFlightKnown: anyoneKnows(AdvancedFlight),
    rocketryKnown: anyoneKnows(Rocketry),
    knowsAdvancedFlight: knows(player, AdvancedFlight),
    knowsSpaceFlight: knows(player, SpaceFlight),
    science,
    spaceRace: (raceActive ? 1 : 0) + (behind ? 1 : 0),
    shipLaunched,
    structurals: partsOf(shipOf(player)).filter(
      (part: Part): boolean => part instanceof Structural
    ).length,
    humanShipExists: people.some(exists),
    humanLaunched,
    coastal: city
      .tile()
      .getNeighbours()
      .some((tile: Tile): boolean => tile.isWater()),
    aggressiveUnits: aggressiveUnits(city),
    nearestPortDistance: ports.reduce(
      (nearest: number, other: City): number =>
        Math.min(nearest, diagonalDistance(city.tile(), other.tile())),
      9999
    ),
    navalUnits:
      cityUnits.filter((unit: Unit): boolean =>
        hasRole(unit, NavalSuperiorityRole, ruleRegistry)
      ).length +
      (cityUnits.filter((unit: Unit): boolean =>
        hasRole(unit, TransportRole, ruleRegistry)
      ).length >>
        1),
    bestHuman: threatOf(best),
    bestHumanNuclearMissiles: best === null ? 0 : count(best, Nuclear),
    // No subversion is counted yet.
    bestHumanSubversion: 0,
    others: others.map(threatOf),
    humans,
  };
};

export default chooseProductionState;
