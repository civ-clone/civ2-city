import {
  DEMOCRACY,
  FUNDAMENTALISM,
  REPUBLIC,
} from '@civ-clone/civ2-rules/data/governments';
import cosmic from '@civ-clone/civ2-rules/data/cosmic';

// Civilization II's choice of what a city builds, for a city on Auto: the improvement side of OpenCiv2's
//  `city_choose_production` (`src/auto/city_production.cpp` ~2095, richardpenman/civ2@49f26ec), with
//  `city_choose_production_improvement_score` (~727) and its caller `city_choose_production_try_improvement` (~1025).
//  Pure: what the city and its player look like comes in as a `ChooseProductionState` (`lib/chooseProductionState`
//  gathers one from a game). Integer arithmetic as the C has it: `/` truncates towards 0, `>>` floors.

/** Civ2's improvement numbers (`IMP_*`, `src/include/enums.h`), which the scores are keyed by and ties go by. */
export enum ImprovementId {
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
export const UNWANTED = 999;

/** A base score of 400 or more becomes this in `city_choose_production_try_improvement` (`0x3fff`). */
export const OUT_OF_RANGE = 0x3fff;

/** Above this, a city on Auto chooses nothing (`city_choose_production_final_choice`: `500 < choice_score`). */
export const CHOOSES_NOTHING_ABOVE = 500;

/** `DIFF_KING` (`src/include/enums.h`): 0 Chieftain to 5 Deity. */
export const KING = 3;

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
export const clamp = (value: number, low: number, high: number): number =>
  value < low ? low : value > high ? high : value;

/** C's `/` on `int`s: towards 0. */
export const div = (a: number, b: number): number => Math.trunc(a / b);

/** `unrest_state`: 2 in disorder, 1 with as many happy citizens as unhappy ones (none of either included), else 0. */
export const unrestState = (s: ChooseProductionState): number =>
  s.disorder ? 2 : s.happy === s.unhappy ? 1 : 0;

export const netTrade = (s: ChooseProductionState): number =>
  s.totalTrade - s.tradeCorruption;

export interface Scored {
  score: number;
  defensive: boolean;
}

/** `city_choose_production_walls_score` (~525). */
export const wallsScore = (s: ChooseProductionState, score: number): Scored => {
  if (s.greatWall) {
    return { score, defensive: false };
  }

  score = 10 - (s.size >> 1);

  s.humans.forEach((human: HumanPlayer): void => {
    if (human.atWar) {
      score -= 2;
    }

    if (human.citiesOnLandMass) {
      score--;
    }
  });

  [s.roboticsKnown, s.advancedFlightKnown, s.rocketryKnown].forEach(
    (known: boolean): void => {
      if (known) {
        score += 2;
      }
    }
  );

  score = clamp(score, 1, 10);

  if (s.hasPalace) {
    score -= 4;
  }

  return { score, defensive: true };
};

// The SAM and coastal scores' "defensive": a human player with a bad reputation, or at war with the city's player,
//  makes it the player's `threatened`.
const defensiveAgainstHumans = (s: ChooseProductionState): boolean =>
  s.humans.some(({ atWar, badReputation }) => atWar || badReputation)
    ? s.threatened
    : true;

/** `city_choose_production_sam_score` (~563). `CITYF_SAM_WANTED` (an AI flag) isn't kept, so it never takes 3 off. */
export const samScore = (s: ChooseProductionState): Scored => {
  const air = (threat: OtherPlayerThreat): number =>
    threat.cruiseMissiles +
    threat.bombers +
    threat.helicopters +
    threat.stealthBombers;

  let threatLevel =
    (s.bestHuman.stealthBombers * 2 +
      s.bestHuman.bombers * 2 +
      s.bestHuman.cruiseMissiles +
      s.bestHuman.helicopters) *
    2;

  if (s.human) {
    threatLevel = s.others.reduce(
      (total: number, other: OtherPlayerThreat): number =>
        total + (other.hostile ? air(other) : div(air(other), 2)),
      0
    );
  }

  return {
    score: clamp(12 - threatLevel, 1, 12),
    defensive: defensiveAgainstHumans(s),
  };
};

/** `city_choose_production_coastal_fortress_score` (~608). */
export const coastalFortressScore = (
  s: ChooseProductionState,
  score: number
): Scored => {
  if (!s.coastal) {
    return { score, defensive: false };
  }

  let threatLevel =
    s.bestHuman.cruisers * 3 +
    s.bestHuman.aegisCruisers * 3 +
    s.bestHuman.battleships * 5 +
    s.bestHuman.ironclads +
    s.bestHuman.destroyers;

  if (s.human) {
    threatLevel = s.others.reduce(
      (total: number, other: OtherPlayerThreat): number => {
        const sea =
          (other.ironclads >> 1) +
          (other.destroyers >> 1) +
          other.battleships * 2 +
          other.cruisers +
          other.aegisCruisers;

        return total + (other.hostile ? sea : div(sea, 2));
      },
      0
    );
  }

  return {
    score: clamp(12 - threatLevel, 1, 12),
    defensive: defensiveAgainstHumans(s),
  };
};

/**
 * `city_choose_production_improvement_score` (~727): how little the city needs `improvement`, before
 *  `tryImprovementScore` weighs it. 999 for anything it doesn't want, and for what isn't scored here: the Mass Transit,
 *  the Solar Plant, the spaceship (no spaceship yet: Civ2 gives a structural 999 without one too) and Capitalization.
 */
export const improvementScore = (
  improvement: ImprovementId,
  s: ChooseProductionState
): Scored => {
  const unrest = unrestState(s),
    trade = netTrade(s),
    // `ret`: half the food surplus, rounded down.
    halfFood = s.foodSurplus >> 1;

  let score = UNWANTED,
    defensive = false;

  if (improvement < 1 || improvement > ImprovementId.SpaceshipStructural) {
    return { score, defensive };
  }

  switch (improvement) {
    case ImprovementId.Palace:
      if (
        (s.palaceCount === 0 || !s.human) &&
        (s.palaceCount === 0 ||
          (s.palaceCount === 1 && s.palaceSize * 2 < s.staleSize)) &&
        (s.policy === 4 ||
          s.policy === 5 ||
          s.policy === 0 ||
          s.shieldWaste > 3)
      ) {
        score = 2;

        if (s.staleSize > 9) {
          score = 1;
        }

        if (s.staleSize > 14) {
          score--;
        }

        if (s.shieldWaste > 3) {
          defensive = s.threatened;
        }
      }
      break;

    case ImprovementId.Barracks:
      score = s.civilize + s.barracksCount + 4 - s.attack;

      if ((s.attack < 0 || s.civilize > 0) && s.civilize + s.attack !== 0) {
        score += s.barracksCount;
      }

      defensive = true;

      if (s.human) {
        if (s.difficulty === KING) {
          score = div(score * 3, 2);
        }

        if (s.difficulty > KING) {
          score = score << 1;
        }
      }
      break;

    case ImprovementId.Granary:
      if (!s.pyramids) {
        score = s.totalShields < 3 ? 8 : 4;

        if (s.happy <= s.unhappy) {
          score += 2;
        }

        const short = s.difficulty + 4 - s.staleSize;

        if (s.human && short > 0) {
          score += short;
        }
      }
      break;

    case ImprovementId.Temple:
      if (unrest === 1) {
        score = 9;
      }

      if (unrest === 2) {
        score = -5;
      }
      break;

    case ImprovementId.Marketplace:
      score = clamp(10 - (trade >> 1), 1, 10);

      if (unrest === 1) {
        score--;
      }

      if (unrest === 2) {
        score = -4;
      }
      break;

    case ImprovementId.Library:
      score = clamp(10 - div(trade, 3), 1, 10);
      break;

    case ImprovementId.Courthouse:
      score = 14 - (s.shieldWaste * 2 + s.tradeCorruption);

      if (s.government === DEMOCRACY) {
        if (unrest === 2) {
          score = -1;
        }
      } else if (!s.human) {
        score -= div(s.bestHumanSubversion, 2);
      }
      break;

    case ImprovementId.CityWalls:
      ({ score, defensive } = wallsScore(s, score));
      break;

    case ImprovementId.Aqueduct:
      if (cosmic.aqueductSize - halfFood <= s.size) {
        score = clamp(cosmic.aqueductSize + 4 - s.size - halfFood, 1, 20);
      }
      break;

    case ImprovementId.Bank:
      score = clamp(10 - div(trade, 3), 1, 10);

      if (unrest === 1) {
        score--;
      }

      if (unrest === 2) {
        score = 0;
      }
      break;

    case ImprovementId.Cathedral:
      if (!s.michelangelo) {
        if (unrest === 1) {
          score = 8;
        }

        if (unrest === 2) {
          score = -3;
        }
      }
      break;

    case ImprovementId.University:
      if (s.science && (s.spaceRace === 0 || !s.knowsSpaceFlight)) {
        score = clamp(10 - (trade >> 2), 2, 10);
      }
      break;

    case ImprovementId.MassTransit:
      break;

    case ImprovementId.Colosseum:
      if (unrest === 2) {
        score = -2;
      }
      break;

    case ImprovementId.Factory:
    case ImprovementId.HydroPlant:
      score = clamp(14 - s.totalShields, 1, 14);
      break;

    // `default:` in the C: the Manufacturing Plant, the Recycling Center and the Nuclear Plant.
    case ImprovementId.ManufacturingPlant:
    case ImprovementId.RecyclingCenter:
    case ImprovementId.NuclearPlant:
      score = clamp(12 - div(s.totalShields, 4), 2, 12);
      break;

    case ImprovementId.SdiDefense:
      if (unrest < 2) {
        score = div(clamp(15 - s.size, 1, 15) + 1, 2);

        if (!s.manhattanBuilt) {
          score = score << 1;
        }

        if (s.bestHumanNuclearMissiles === 0) {
          score = score << 1;
        }

        if (s.size > 9) {
          score--;
        }

        if (s.hasPalace) {
          score = 0;
        }
      }

      defensive = true;
      break;

    case ImprovementId.PowerPlant:
      score = clamp(12 - div(s.totalShields, 5), 2, 14);
      break;

    case ImprovementId.StockExchange:
      if (unrest !== 0 || s.spaceRace < 2) {
        score = clamp(11 - (trade >> 2), 2, 11);

        if (unrest === 1) {
          score--;
        }

        if (unrest === 2) {
          score = 0;
        }
      }
      break;

    case ImprovementId.SewerSystem:
      if (s.spaceRace < 2 && cosmic.sewerSize - halfFood <= s.size) {
        score = clamp(cosmic.sewerSize + 4 - s.size - halfFood, 1, 20);
      }
      break;

    case ImprovementId.Supermarket:
      score = clamp(
        14 - (s.size >> 1) - s.farmland * 2 + s.spaceRace * 2 + halfFood,
        2,
        14
      );
      break;

    case ImprovementId.Superhighways:
      score = clamp(15 - (s.size >> 1) + s.spaceRace * 6, 2, 15);
      break;

    case ImprovementId.ResearchLab:
      if ((s.spaceRace === 0 || !s.knowsSpaceFlight) && s.science) {
        score = clamp(11 - (trade >> 2), 2, 10);
      }
      break;

    case ImprovementId.SamBattery:
      ({ score, defensive } = samScore(s));
      break;

    case ImprovementId.CoastalFortress:
      ({ score, defensive } = coastalFortressScore(s, score));
      break;

    case ImprovementId.SolarPlant:
      break;

    case ImprovementId.Harbour:
      if (unrest < 2) {
        score = clamp(16 - s.oceanTiles, 2, 16);

        if (s.foodSurplus < 1) {
          score = div(score, 2);
        }
      }
      break;

    case ImprovementId.OffshorePlatform:
      if (unrest < 2) {
        score = clamp(16 - s.oceanTiles, 2, 16);

        if (score > 0) {
          if (s.hasFactory) {
            score = div(score, 2);
          }

          if (s.hasManufacturingPlant) {
            score = div(score, 2);
          }
        }

        if (
          (s.totalShields - s.shieldSupport <= div(s.totalShields, 3) ||
            s.totalShields < div(s.staleSize, 2)) &&
          div(s.staleSize, 2) <= div(s.oceanTiles, 4)
        ) {
          score -= 2;
        }
      }
      break;

    case ImprovementId.Airport:
      score = s.airportCount * 4 + 4 - s.attack;

      if (s.policy === 4) {
        score = div(score, 2);
      }

      if (!s.knowsAdvancedFlight) {
        score = score << 1;
      }

      if (
        (s.citiesOnLandMass === 1 ||
          (s.defendedLandMass && s.airportCount === 0)) &&
        s.citiesOnLandMass < score
      ) {
        score = s.citiesOnLandMass;
      }

      if (s.hasPalace && score >= 0) {
        score = 0;
      }

      defensive = s.threatened;
      break;

    case ImprovementId.PoliceStation:
      if (!s.womensSuffrage) {
        let units = s.aggressiveUnits;

        if (s.government > REPUBLIC) {
          units = units << 1;
        }

        if (
          s.government > FUNDAMENTALISM &&
          units !== 0 &&
          s.happy - s.unhappy < 2
        ) {
          units += 2;
        }

        score = 10 - units;
      }
      break;

    case ImprovementId.PortFacility:
      if (s.coastal) {
        const distance =
          s.nearestPortDistance > 39 ? 40 : s.nearestPortDistance;

        score = clamp(
          11 -
            (distance >> 2) -
            s.navalUnits * 5 +
            (s.portCount * 2 - s.attack) +
            s.civilize,
          2,
          15
        );

        if (s.attack < 0) {
          score += s.portCount;
        }
      }
      break;

    case ImprovementId.SpaceshipStructural:
      // `city_choose_production_spaceship_score` starts from 999 and leaves it so with no spaceship to build.
      break;
  }

  return { score, defensive };
};

/**
 * `city_choose_production_try_improvement` (~1025): the base score, doubled unless it matches the player's
 *  `threatened` (×10 against ×20, then ×3), over the leader's `civilize` + 3; 0x3fff from 400 up. A city with Barracks
 *  adds a share of it, as does Shakespeare's Theatre's city. Lower is wanted more.
 */
export const tryImprovementScore = (
  { score, defensive }: Scored,
  s: ChooseProductionState
): number => {
  let result =
    score < 400
      ? div((s.threatened === defensive ? 10 : 20) * score * 3, s.civilize + 3)
      : OUT_OF_RANGE;

  if (s.hasBarracks) {
    result += div(result, (s.barracksCount >> 1) + 3);
  }

  if (s.shakespeareHere) {
    result += div(result, 3);
  }

  return result;
};

/** The score `city_choose_production` compares an improvement by: lowest first. */
export const chooseImprovementScore = (
  improvement: ImprovementId,
  s: ChooseProductionState
): number => tryImprovementScore(improvementScore(improvement, s), s);

/**
 * core-city-build ranks the highest `BuildPriority` first and leaves out anything at 0 or below, where Civ2 picks the
 *  lowest score and nothing above 500: so the priority is 501 − the score, 0 for anything over 500. Civ2 keeps the first
 *  of equal scores in its improvements' order (a strict `<`), so a fraction under 1, larger for a lower number, breaks
 *  the tie the same way (core-city-build would prefer the cheaper).
 */
export const priorityOf = (score: number, improvement: ImprovementId): number =>
  score > CHOOSES_NOTHING_ABOVE
    ? 0
    : CHOOSES_NOTHING_ABOVE + 1 - score + (100 - improvement) / 1000;

export default chooseImprovementScore;
