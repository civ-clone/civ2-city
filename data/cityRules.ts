import {
  DEMOCRACY,
  FUNDAMENTALISM,
} from '@civ-clone/civ2-rules/data/governments';

// Civilization II's city numbers that aren't in RULES.TXT, from OpenCiv2's reconstruction of the game
//  (richardpenman/civ2@49f26ec, `src/auto/city.cpp`), each by the function that holds it. Those that are in RULES.TXT
//  come from civ2-rules' `cosmic` (the effective @COSMIC values), and the unit support tables by government from
//  civ2-government.

/**
 * The corruption divisor, by government (`city_corruption_divisor`): 4 under Anarchy, one more for each step up to
 *  Communism, Fundamentalism the same as Communism, and one more again for the Republic and Democracy.
 */
export const corruptionDivisor: readonly number[] = Object.freeze([
  4, 5, 6, 7, 7, 8, 8,
]);

/** The distance a city with no Palace to measure from counts as (`city_calc_capital_link`). */
export const noCapitalDistance = 32;

/** The furthest a distance counts, once the human's level is added to it (`city_calc_corruption`). */
export const maximumDistance = 32;

/** The furthest the distance counts for shield waste, before the level is added (`city_calc_shields_pollution` passes
 *  `clamp_distance`). */
export const wasteDistance = 16;

/** The governments without shield waste (`city_calc_shields_pollution`). */
export const noShieldWaste: readonly number[] = Object.freeze([
  FUNDAMENTALISM,
  DEMOCRACY,
]);

/** The governments without trade corruption (`city_calc_trade_happiness`). */
export const noTradeCorruption: readonly number[] = Object.freeze([
  FUNDAMENTALISM,
  DEMOCRACY,
]);

/**
 * What each specialist yields, before any improvement multiplies it (`city_split_trade`): an Entertainer 2 luxuries, a
 *  Tax Collector 3 gold and a Scientist 3 research.
 */
export const entertainerLuxuries = 2;
export const taxCollectorGold = 3;
export const scientistResearch = 3;
