"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priorityOf = exports.chooseImprovementScore = exports.tryImprovementScore = exports.improvementScore = exports.coastalFortressScore = exports.samScore = exports.wallsScore = exports.netTrade = exports.unrestState = exports.div = exports.clamp = exports.KING = exports.CHOOSES_NOTHING_ABOVE = exports.OUT_OF_RANGE = exports.UNWANTED = exports.ImprovementId = void 0;
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
// Civilization II's choice of what a city builds, for a city on Auto: the improvement side of OpenCiv2's
//  `city_choose_production` (`src/auto/city_production.cpp` ~2095, richardpenman/civ2@49f26ec), with
//  `city_choose_production_improvement_score` (~727) and its caller `city_choose_production_try_improvement` (~1025).
//  Pure: what the city and its player look like comes in as a `ChooseProductionState` (`lib/chooseProductionState`
//  gathers one from a game). Integer arithmetic as the C has it: `/` truncates towards 0, `>>` floors.
/** Civ2's improvement numbers (`IMP_*`, `src/include/enums.h`), which the scores are keyed by and ties go by. */
var ImprovementId;
(function (ImprovementId) {
    ImprovementId[ImprovementId["Palace"] = 1] = "Palace";
    ImprovementId[ImprovementId["Barracks"] = 2] = "Barracks";
    ImprovementId[ImprovementId["Granary"] = 3] = "Granary";
    ImprovementId[ImprovementId["Temple"] = 4] = "Temple";
    ImprovementId[ImprovementId["Marketplace"] = 5] = "Marketplace";
    ImprovementId[ImprovementId["Library"] = 6] = "Library";
    ImprovementId[ImprovementId["Courthouse"] = 7] = "Courthouse";
    ImprovementId[ImprovementId["CityWalls"] = 8] = "CityWalls";
    ImprovementId[ImprovementId["Aqueduct"] = 9] = "Aqueduct";
    ImprovementId[ImprovementId["Bank"] = 10] = "Bank";
    ImprovementId[ImprovementId["Cathedral"] = 11] = "Cathedral";
    ImprovementId[ImprovementId["University"] = 12] = "University";
    ImprovementId[ImprovementId["MassTransit"] = 13] = "MassTransit";
    ImprovementId[ImprovementId["Colosseum"] = 14] = "Colosseum";
    ImprovementId[ImprovementId["Factory"] = 15] = "Factory";
    ImprovementId[ImprovementId["ManufacturingPlant"] = 16] = "ManufacturingPlant";
    ImprovementId[ImprovementId["SdiDefense"] = 17] = "SdiDefense";
    ImprovementId[ImprovementId["RecyclingCenter"] = 18] = "RecyclingCenter";
    ImprovementId[ImprovementId["PowerPlant"] = 19] = "PowerPlant";
    ImprovementId[ImprovementId["HydroPlant"] = 20] = "HydroPlant";
    ImprovementId[ImprovementId["NuclearPlant"] = 21] = "NuclearPlant";
    ImprovementId[ImprovementId["StockExchange"] = 22] = "StockExchange";
    ImprovementId[ImprovementId["SewerSystem"] = 23] = "SewerSystem";
    ImprovementId[ImprovementId["Supermarket"] = 24] = "Supermarket";
    ImprovementId[ImprovementId["Superhighways"] = 25] = "Superhighways";
    ImprovementId[ImprovementId["ResearchLab"] = 26] = "ResearchLab";
    ImprovementId[ImprovementId["SamBattery"] = 27] = "SamBattery";
    ImprovementId[ImprovementId["CoastalFortress"] = 28] = "CoastalFortress";
    ImprovementId[ImprovementId["SolarPlant"] = 29] = "SolarPlant";
    ImprovementId[ImprovementId["Harbour"] = 30] = "Harbour";
    ImprovementId[ImprovementId["OffshorePlatform"] = 31] = "OffshorePlatform";
    ImprovementId[ImprovementId["Airport"] = 32] = "Airport";
    ImprovementId[ImprovementId["PoliceStation"] = 33] = "PoliceStation";
    ImprovementId[ImprovementId["PortFacility"] = 34] = "PortFacility";
    ImprovementId[ImprovementId["SpaceshipStructural"] = 35] = "SpaceshipStructural";
})(ImprovementId = exports.ImprovementId || (exports.ImprovementId = {}));
/** The score of something the city doesn't want: `city_choose_production` starts every best score at this. */
exports.UNWANTED = 999;
/** A base score of 400 or more becomes this in `city_choose_production_try_improvement` (`0x3fff`). */
exports.OUT_OF_RANGE = 0x3fff;
/** Above this, a city on Auto chooses nothing (`city_choose_production_final_choice`: `500 < choice_score`). */
exports.CHOOSES_NOTHING_ABOVE = 500;
/** `DIFF_KING` (`src/include/enums.h`): 0 Chieftain to 5 Deity. */
exports.KING = 3;
/** `int_clamp`. */
const clamp = (value, low, high) => value < low ? low : value > high ? high : value;
exports.clamp = clamp;
/** C's `/` on `int`s: towards 0. */
const div = (a, b) => Math.trunc(a / b);
exports.div = div;
/** `unrest_state`: 2 in disorder, 1 with as many happy citizens as unhappy ones (none of either included), else 0. */
const unrestState = (s) => s.disorder ? 2 : s.happy === s.unhappy ? 1 : 0;
exports.unrestState = unrestState;
const netTrade = (s) => s.totalTrade - s.tradeCorruption;
exports.netTrade = netTrade;
/** `city_choose_production_walls_score` (~525). */
const wallsScore = (s, score) => {
    if (s.greatWall) {
        return { score, defensive: false };
    }
    score = 10 - (s.size >> 1);
    s.humans.forEach((human) => {
        if (human.atWar) {
            score -= 2;
        }
        if (human.citiesOnLandMass) {
            score--;
        }
    });
    [s.roboticsKnown, s.advancedFlightKnown, s.rocketryKnown].forEach((known) => {
        if (known) {
            score += 2;
        }
    });
    score = (0, exports.clamp)(score, 1, 10);
    if (s.hasPalace) {
        score -= 4;
    }
    return { score, defensive: true };
};
exports.wallsScore = wallsScore;
// The SAM and coastal scores' "defensive": a human player with a bad reputation, or at war with the city's player,
//  makes it the player's `threatened`.
const defensiveAgainstHumans = (s) => s.humans.some(({ atWar, badReputation }) => atWar || badReputation)
    ? s.threatened
    : true;
/** `city_choose_production_sam_score` (~563). `CITYF_SAM_WANTED` (an AI flag) isn't kept, so it never takes 3 off. */
const samScore = (s) => {
    const air = (threat) => threat.cruiseMissiles +
        threat.bombers +
        threat.helicopters +
        threat.stealthBombers;
    let threatLevel = (s.bestHuman.stealthBombers * 2 +
        s.bestHuman.bombers * 2 +
        s.bestHuman.cruiseMissiles +
        s.bestHuman.helicopters) *
        2;
    if (s.human) {
        threatLevel = s.others.reduce((total, other) => total + (other.hostile ? air(other) : (0, exports.div)(air(other), 2)), 0);
    }
    return {
        score: (0, exports.clamp)(12 - threatLevel, 1, 12),
        defensive: defensiveAgainstHumans(s),
    };
};
exports.samScore = samScore;
/** `city_choose_production_coastal_fortress_score` (~608). */
const coastalFortressScore = (s, score) => {
    if (!s.coastal) {
        return { score, defensive: false };
    }
    let threatLevel = s.bestHuman.cruisers * 3 +
        s.bestHuman.aegisCruisers * 3 +
        s.bestHuman.battleships * 5 +
        s.bestHuman.ironclads +
        s.bestHuman.destroyers;
    if (s.human) {
        threatLevel = s.others.reduce((total, other) => {
            const sea = (other.ironclads >> 1) +
                (other.destroyers >> 1) +
                other.battleships * 2 +
                other.cruisers +
                other.aegisCruisers;
            return total + (other.hostile ? sea : (0, exports.div)(sea, 2));
        }, 0);
    }
    return {
        score: (0, exports.clamp)(12 - threatLevel, 1, 12),
        defensive: defensiveAgainstHumans(s),
    };
};
exports.coastalFortressScore = coastalFortressScore;
/**
 * `city_choose_production_improvement_score` (~727): how little the city needs `improvement`, before
 *  `tryImprovementScore` weighs it. 999 for anything it doesn't want, and for what isn't scored here: the Mass Transit,
 *  the Solar Plant, the spaceship (no spaceship yet: Civ2 gives a structural 999 without one too) and Capitalization.
 */
const improvementScore = (improvement, s) => {
    const unrest = (0, exports.unrestState)(s), trade = (0, exports.netTrade)(s), 
    // `ret`: half the food surplus, rounded down.
    halfFood = s.foodSurplus >> 1;
    let score = exports.UNWANTED, defensive = false;
    if (improvement < 1 || improvement > ImprovementId.SpaceshipStructural) {
        return { score, defensive };
    }
    switch (improvement) {
        case ImprovementId.Palace:
            if ((s.palaceCount === 0 || !s.human) &&
                (s.palaceCount === 0 ||
                    (s.palaceCount === 1 && s.palaceSize * 2 < s.staleSize)) &&
                (s.policy === 4 ||
                    s.policy === 5 ||
                    s.policy === 0 ||
                    s.shieldWaste > 3)) {
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
                if (s.difficulty === exports.KING) {
                    score = (0, exports.div)(score * 3, 2);
                }
                if (s.difficulty > exports.KING) {
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
            score = (0, exports.clamp)(10 - (trade >> 1), 1, 10);
            if (unrest === 1) {
                score--;
            }
            if (unrest === 2) {
                score = -4;
            }
            break;
        case ImprovementId.Library:
            score = (0, exports.clamp)(10 - (0, exports.div)(trade, 3), 1, 10);
            break;
        case ImprovementId.Courthouse:
            score = 14 - (s.shieldWaste * 2 + s.tradeCorruption);
            if (s.government === governments_1.DEMOCRACY) {
                if (unrest === 2) {
                    score = -1;
                }
            }
            else if (!s.human) {
                score -= (0, exports.div)(s.bestHumanSubversion, 2);
            }
            break;
        case ImprovementId.CityWalls:
            ({ score, defensive } = (0, exports.wallsScore)(s, score));
            break;
        case ImprovementId.Aqueduct:
            if (cosmic_1.default.aqueductSize - halfFood <= s.size) {
                score = (0, exports.clamp)(cosmic_1.default.aqueductSize + 4 - s.size - halfFood, 1, 20);
            }
            break;
        case ImprovementId.Bank:
            score = (0, exports.clamp)(10 - (0, exports.div)(trade, 3), 1, 10);
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
                score = (0, exports.clamp)(10 - (trade >> 2), 2, 10);
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
            score = (0, exports.clamp)(14 - s.totalShields, 1, 14);
            break;
        // `default:` in the C: the Manufacturing Plant, the Recycling Center and the Nuclear Plant.
        case ImprovementId.ManufacturingPlant:
        case ImprovementId.RecyclingCenter:
        case ImprovementId.NuclearPlant:
            score = (0, exports.clamp)(12 - (0, exports.div)(s.totalShields, 4), 2, 12);
            break;
        case ImprovementId.SdiDefense:
            if (unrest < 2) {
                score = (0, exports.div)((0, exports.clamp)(15 - s.size, 1, 15) + 1, 2);
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
            score = (0, exports.clamp)(12 - (0, exports.div)(s.totalShields, 5), 2, 14);
            break;
        case ImprovementId.StockExchange:
            if (unrest !== 0 || s.spaceRace < 2) {
                score = (0, exports.clamp)(11 - (trade >> 2), 2, 11);
                if (unrest === 1) {
                    score--;
                }
                if (unrest === 2) {
                    score = 0;
                }
            }
            break;
        case ImprovementId.SewerSystem:
            if (s.spaceRace < 2 && cosmic_1.default.sewerSize - halfFood <= s.size) {
                score = (0, exports.clamp)(cosmic_1.default.sewerSize + 4 - s.size - halfFood, 1, 20);
            }
            break;
        case ImprovementId.Supermarket:
            score = (0, exports.clamp)(14 - (s.size >> 1) - s.farmland * 2 + s.spaceRace * 2 + halfFood, 2, 14);
            break;
        case ImprovementId.Superhighways:
            score = (0, exports.clamp)(15 - (s.size >> 1) + s.spaceRace * 6, 2, 15);
            break;
        case ImprovementId.ResearchLab:
            if ((s.spaceRace === 0 || !s.knowsSpaceFlight) && s.science) {
                score = (0, exports.clamp)(11 - (trade >> 2), 2, 10);
            }
            break;
        case ImprovementId.SamBattery:
            ({ score, defensive } = (0, exports.samScore)(s));
            break;
        case ImprovementId.CoastalFortress:
            ({ score, defensive } = (0, exports.coastalFortressScore)(s, score));
            break;
        case ImprovementId.SolarPlant:
            break;
        case ImprovementId.Harbour:
            if (unrest < 2) {
                score = (0, exports.clamp)(16 - s.oceanTiles, 2, 16);
                if (s.foodSurplus < 1) {
                    score = (0, exports.div)(score, 2);
                }
            }
            break;
        case ImprovementId.OffshorePlatform:
            if (unrest < 2) {
                score = (0, exports.clamp)(16 - s.oceanTiles, 2, 16);
                if (score > 0) {
                    if (s.hasFactory) {
                        score = (0, exports.div)(score, 2);
                    }
                    if (s.hasManufacturingPlant) {
                        score = (0, exports.div)(score, 2);
                    }
                }
                if ((s.totalShields - s.shieldSupport <= (0, exports.div)(s.totalShields, 3) ||
                    s.totalShields < (0, exports.div)(s.staleSize, 2)) &&
                    (0, exports.div)(s.staleSize, 2) <= (0, exports.div)(s.oceanTiles, 4)) {
                    score -= 2;
                }
            }
            break;
        case ImprovementId.Airport:
            score = s.airportCount * 4 + 4 - s.attack;
            if (s.policy === 4) {
                score = (0, exports.div)(score, 2);
            }
            if (!s.knowsAdvancedFlight) {
                score = score << 1;
            }
            if ((s.citiesOnLandMass === 1 ||
                (s.defendedLandMass && s.airportCount === 0)) &&
                s.citiesOnLandMass < score) {
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
                if (s.government > governments_1.REPUBLIC) {
                    units = units << 1;
                }
                if (s.government > governments_1.FUNDAMENTALISM &&
                    units !== 0 &&
                    s.happy - s.unhappy < 2) {
                    units += 2;
                }
                score = 10 - units;
            }
            break;
        case ImprovementId.PortFacility:
            if (s.coastal) {
                const distance = s.nearestPortDistance > 39 ? 40 : s.nearestPortDistance;
                score = (0, exports.clamp)(11 -
                    (distance >> 2) -
                    s.navalUnits * 5 +
                    (s.portCount * 2 - s.attack) +
                    s.civilize, 2, 15);
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
exports.improvementScore = improvementScore;
/**
 * `city_choose_production_try_improvement` (~1025): the base score, doubled unless it matches the player's
 *  `threatened` (×10 against ×20, then ×3), over the leader's `civilize` + 3; 0x3fff from 400 up. A city with Barracks
 *  adds a share of it, as does Shakespeare's Theatre's city. Lower is wanted more.
 */
const tryImprovementScore = ({ score, defensive }, s) => {
    let result = score < 400
        ? (0, exports.div)((s.threatened === defensive ? 10 : 20) * score * 3, s.civilize + 3)
        : exports.OUT_OF_RANGE;
    if (s.hasBarracks) {
        result += (0, exports.div)(result, (s.barracksCount >> 1) + 3);
    }
    if (s.shakespeareHere) {
        result += (0, exports.div)(result, 3);
    }
    return result;
};
exports.tryImprovementScore = tryImprovementScore;
/** The score `city_choose_production` compares an improvement by: lowest first. */
const chooseImprovementScore = (improvement, s) => (0, exports.tryImprovementScore)((0, exports.improvementScore)(improvement, s), s);
exports.chooseImprovementScore = chooseImprovementScore;
/**
 * core-city-build ranks the highest `BuildPriority` first and leaves out anything at 0 or below, where Civ2 picks the
 *  lowest score and nothing above 500: so the priority is 501 − the score, 0 for anything over 500. Civ2 keeps the first
 *  of equal scores in its improvements' order (a strict `<`), so a fraction under 1, larger for a lower number, breaks
 *  the tie the same way (core-city-build would prefer the cheaper).
 */
const priorityOf = (score, improvement) => score > exports.CHOOSES_NOTHING_ABOVE
    ? 0
    : exports.CHOOSES_NOTHING_ABOVE + 1 - score + (100 - improvement) / 1000;
exports.priorityOf = priorityOf;
exports.default = exports.chooseImprovementScore;
//# sourceMappingURL=chooseProduction.js.map