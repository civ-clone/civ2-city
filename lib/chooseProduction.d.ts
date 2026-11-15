/** Civ2's improvement numbers (`IMP_*`, `src/include/enums.h`), which the scores are keyed by and ties go by. */
export declare enum ImprovementId {
  Palace = 1,
  Barracks = 2,
  Granary = 3,
  Temple = 4,
  Marketplace = 5,
  Library = 6,
  Courthouse = 7,
  CityWalls = 8,
  Aqueduct = 9,
  Bank = 10,
  Cathedral = 11,
  University = 12,
  MassTransit = 13,
  Colosseum = 14,
  Factory = 15,
  ManufacturingPlant = 16,
  SdiDefense = 17,
  RecyclingCenter = 18,
  PowerPlant = 19,
  HydroPlant = 20,
  NuclearPlant = 21,
  StockExchange = 22,
  SewerSystem = 23,
  Supermarket = 24,
  Superhighways = 25,
  ResearchLab = 26,
  SamBattery = 27,
  CoastalFortress = 28,
  SolarPlant = 29,
  Harbour = 30,
  OffshorePlatform = 31,
  Airport = 32,
  PoliceStation = 33,
  PortFacility = 34,
  SpaceshipStructural = 35,
}
/** The score of something the city doesn't want: `city_choose_production` starts every best score at this. */
export declare const UNWANTED = 999;
/** A base score of 400 or more becomes this in `city_choose_production_try_improvement` (`0x3fff`). */
export declare const OUT_OF_RANGE = 16383;
/** Above this, a city on Auto chooses nothing (`city_choose_production_final_choice`: `500 < choice_score`). */
export declare const CHOOSES_NOTHING_ABOVE = 500;
/** `DIFF_KING` (`src/include/enums.h`): 0 Chieftain to 5 Deity. */
export declare const KING = 3;
/** Another player, as `city_choose_production_sam_score` and `_coastal_fortress_score` count its units. */
export interface OtherPlayerThreat {
  /** Whether the city's player is at war with it (`TREATY_WAR`), or it has a vendetta against the city's player. */
  hostile: boolean;
  /** Its Cruise Missiles, Bombers, Helicopters and Stealth Bombers. */
  cruiseMissiles: number;
  bombers: number;
  helicopters: number;
  stealthBombers: number;
  /** Its Ironclads, Destroyers, Cruisers, AEGIS Cruisers and Battleships. */
  ironclads: number;
  destroyers: number;
  cruisers: number;
  aegisCruisers: number;
  battleships: number;
}
/** A human player, as `city_choose_production_walls_score` and the SAM and coastal scores loop over them. */
export interface HumanPlayer {
  /** Whether the city's player is at war with it or has a vendetta against it (`TREATY_VENDETTA | TREATY_WAR`). */
  atWar: boolean;
  /** Whether it has a city on the city's land mass (`continent_cities`). */
  citiesOnLandMass: boolean;
  /** Its reputation is worse than 4 (`reputation > 4`). */
  badReputation: boolean;
}
/** What `city_choose_production` surveys before it scores anything (its `ChooseProductionState`, `city_calc`, `cities[]`). */
export interface ChooseProductionState {
  /** The city's player is a person (`game.human_players`). */
  human: boolean;
  /** The game's level, 0 (Chieftain) to 5 (Deity). */
  difficulty: number;
  /** The player's government, in Civ2's order (civ2-rules' `governments`). */
  government: number;
  /** The leader's `civilize` and `attack` (@LEADERS: −1, 0 or 1). */
  civilize: number;
  attack: number;
  /** The player's `continent_policy` on the city's land mass, and whether that makes it `threatened`. */
  policy: number;
  threatened: boolean;
  /** `continent_flags & 0x10`: the AI has had to defend on the land mass. */
  defendedLandMass: boolean;
  /** The player's cities on the city's land mass (`continent_cities`). */
  citiesOnLandMass: number;
  size: number;
  /**
   * `cities[s->city2].size`: the Palace, the Granary and the Offshore Platform read the city the survey's loop counter
   *  left behind, one past the last city, whose slot is empty.
   */
  staleSize: number;
  /** Food less the citizens' and the settlers' upkeep. */
  foodSurplus: number;
  /** `city_calc.total_shields`: after the Factory and the plants, and after waste, before units' support. */
  totalShields: number;
  shieldWaste: number;
  shieldSupport: number;
  /** `city_calc.total_trade` and `trade_corruption`. */
  totalTrade: number;
  tradeCorruption: number;
  happy: number;
  unhappy: number;
  /** In disorder (`CITYF_DISORDER`). */
  disorder: boolean;
  /** Ocean squares among the city's 20, each worked one counting 4 (`city_choose_production_scan_tiles`). */
  oceanTiles: number;
  farmland: number;
  /** Cities with a Palace or building one, and the largest of them. */
  palaceCount: number;
  palaceSize: number;
  /** Barracks on the land mass (4 more with Sun Tzu), Airports and Port Facilities in the player's other cities there. */
  barracksCount: number;
  airportCount: number;
  portCount: number;
  hasPalace: boolean;
  hasBarracks: boolean;
  hasFactory: boolean;
  hasManufacturingPlant: boolean;
  /** Shakespeare's Theatre is in this city. */
  shakespeareHere: boolean;
  /** The player has these Wonders (`civ_has_wonder`). */
  greatWall: boolean;
  michelangelo: boolean;
  pyramids: boolean;
  womensSuffrage: boolean;
  /** The Manhattan Project has been built (`game.wonder_city[WONDER_MANHATTAN] != -1`). */
  manhattanBuilt: boolean;
  /** Anyone knows (`game.advance_known_by`). */
  roboticsKnown: boolean;
  advancedFlightKnown: boolean;
  rocketryKnown: boolean;
  /** The player knows Advanced Flight, and Space Flight. */
  knowsAdvancedFlight: boolean;
  knowsSpaceFlight: boolean;
  /** The player's science rate isn't 0. */
  science: boolean;
  /** `ai_spaceship_race_behind` + `spaceship_race_active`. */
  spaceRace: number;
  /** Adjacent to the ocean (`city_adjacent_to_body(city, 1)`). */
  coastal: boolean;
  /** `city_calc.aggressive_units`. */
  aggressiveUnits: number;
  /** `map_distance_diag` to the nearest of the player's cities with a Port Facility, 9999 with none. */
  nearestPortDistance: number;
  /** Naval superiority units in the city, and half its sea transports. */
  navalUnits: number;
  /** The best-ranked human player's units (`game.best_human_rank`). */
  bestHuman: OtherPlayerThreat;
  bestHumanNuclearMissiles: number;
  /** `civs[game.best_human_rank].subversion_count`. */
  bestHumanSubversion: number;
  /** Every other player but the barbarians, and every human player (the city's own among them when it's a person's). */
  others: OtherPlayerThreat[];
  humans: HumanPlayer[];
}
/** `int_clamp`. */
export declare const clamp: (
  value: number,
  low: number,
  high: number
) => number;
/** C's `/` on `int`s: towards 0. */
export declare const div: (a: number, b: number) => number;
/** `unrest_state`: 2 in disorder, 1 with as many happy citizens as unhappy ones (none of either included), else 0. */
export declare const unrestState: (s: ChooseProductionState) => number;
export declare const netTrade: (s: ChooseProductionState) => number;
export interface Scored {
  score: number;
  defensive: boolean;
}
/** `city_choose_production_walls_score` (~525). */
export declare const wallsScore: (
  s: ChooseProductionState,
  score: number
) => Scored;
/** `city_choose_production_sam_score` (~563). `CITYF_SAM_WANTED` (an AI flag) isn't kept, so it never takes 3 off. */
export declare const samScore: (s: ChooseProductionState) => Scored;
/** `city_choose_production_coastal_fortress_score` (~608). */
export declare const coastalFortressScore: (
  s: ChooseProductionState,
  score: number
) => Scored;
/**
 * `city_choose_production_improvement_score` (~727): how little the city needs `improvement`, before
 *  `tryImprovementScore` weighs it. 999 for anything it doesn't want, and for what isn't scored here: the Mass Transit,
 *  the Solar Plant, the spaceship (no spaceship yet: Civ2 gives a structural 999 without one too) and Capitalization.
 */
export declare const improvementScore: (
  improvement: ImprovementId,
  s: ChooseProductionState
) => Scored;
/**
 * `city_choose_production_try_improvement` (~1025): the base score, doubled unless it matches the player's
 *  `threatened` (×10 against ×20, then ×3), over the leader's `civilize` + 3; 0x3fff from 400 up. A city with Barracks
 *  adds a share of it, as does Shakespeare's Theatre's city. Lower is wanted more.
 */
export declare const tryImprovementScore: (
  { score, defensive }: Scored,
  s: ChooseProductionState
) => number;
/** The score `city_choose_production` compares an improvement by: lowest first. */
export declare const chooseImprovementScore: (
  improvement: ImprovementId,
  s: ChooseProductionState
) => number;
/**
 * core-city-build ranks the highest `BuildPriority` first and leaves out anything at 0 or below, where Civ2 picks the
 *  lowest score and nothing above 500: so the priority is 501 − the score, 0 for anything over 500. Civ2 keeps the first
 *  of equal scores in its improvements' order (a strict `<`), so a fraction under 1, larger for a lower number, breaks
 *  the tie the same way (core-city-build would prefer the cheaper).
 */
export declare const priorityOf: (
  score: number,
  improvement: ImprovementId
) => number;
export default chooseImprovementScore;
