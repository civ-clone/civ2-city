import {
  ANARCHY,
  COMMUNISM,
  DEMOCRACY,
  DESPOTISM,
  FUNDAMENTALISM,
  MONARCHY,
  REPUBLIC,
} from '@civ-clone/civ2-rules/data/governments';
import cosmic from '@civ-clone/civ2-rules/data/cosmic';

// Civilization II's city numbers that aren't in RULES.TXT, from OpenCiv2's reconstruction of the game
//  (richardpenman/civ2@49f26ec, `src/auto/city.cpp`), each by the function that holds it. Those that are in RULES.TXT
//  come from civ2-rules' `cosmic` (the effective @COSMIC values) and are named there.

/**
 * How many of a city's units it supports at no cost, by government (`city_count_unit_support`): as many as the city
 *  has citizens under Anarchy and Despotism, @COSMIC's free support under Monarchy, Communism and Fundamentalism, and
 *  none under the Republic and Democracy.
 */
export const freeUnitSupport: Readonly<Record<number, number | 'size'>> =
  Object.freeze({
    [ANARCHY]: 'size',
    [DESPOTISM]: 'size',
    [MONARCHY]: cosmic.monarchyFreeSupport,
    [COMMUNISM]: cosmic.communismFreeSupport,
    [FUNDAMENTALISM]: cosmic.fundamentalismFreeSupport,
    [REPUBLIC]: 0,
    [DEMOCRACY]: 0,
  });

/** The shields each unit past the free ones costs (`city_count_unit_support`). */
export const unitShieldCost = 1;

/**
 * The food a city's units that settle eat each, by government (`city_calc_food_box_rows`): @COSMIC's low figure up to
 *  Monarchy, its high one above.
 */
export const settlerFood = (government: number): number =>
  government > MONARCHY ? cosmic.settlerFoodHigh : cosmic.settlerFoodLow;

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
