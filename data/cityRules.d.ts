/**
 * How many of a city's units it supports at no cost, by government (`city_count_unit_support`): as many as the city
 *  has citizens under Anarchy and Despotism, @COSMIC's free support under Monarchy, Communism and Fundamentalism, and
 *  none under the Republic and Democracy.
 */
export declare const freeUnitSupport: Readonly<Record<number, number | 'size'>>;
/** The shields each unit past the free ones costs (`city_count_unit_support`). */
export declare const unitShieldCost = 1;
/**
 * The food a city's units that settle eat each, by government (`city_calc_food_box_rows`): @COSMIC's low figure up to
 *  Monarchy, its high one above.
 */
export declare const settlerFood: (government: number) => number;
/**
 * The corruption divisor, by government (`city_corruption_divisor`): 4 under Anarchy, one more for each step up to
 *  Communism, Fundamentalism the same as Communism, and one more again for the Republic and Democracy.
 */
export declare const corruptionDivisor: readonly number[];
/** The distance a city with no Palace to measure from counts as (`city_calc_capital_link`). */
export declare const noCapitalDistance = 32;
/** The furthest a distance counts, once the human's level is added to it (`city_calc_corruption`). */
export declare const maximumDistance = 32;
/** The governments without trade corruption (`city_calc_trade_happiness`). */
export declare const noTradeCorruption: readonly number[];
/**
 * What each specialist yields, before any improvement multiplies it (`city_split_trade`): an Entertainer 2 luxuries, a
 *  Tax Collector 3 gold and a Scientist 3 research.
 */
export declare const entertainerLuxuries = 2;
export declare const taxCollectorGold = 3;
export declare const scientistResearch = 3;
