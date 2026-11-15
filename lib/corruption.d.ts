export type CorruptionInput = {
  /** The trade (or shields) to take corruption from. */
  amount: number;
  /** The player's government, in Civ2's order. */
  government: number;
  /** The distance to the player's nearest Palace (`lib/capitalLink`), or `null` with no Palace. */
  distance: number | null;
  /** Whether a person plays the city's player. */
  human: boolean;
  /** The game's level, 0 (Chieftain) to 5 (Deity). */
  level: number;
  /** Whether the city has the Palace. */
  capital: boolean;
  /** Whether the city is celebrating its leader (`lib/celebrating`). */
  celebrating?: boolean;
  /** Whether the city has a Courthouse. Only the shield waste asks it here: civ2-city-improvement halves the trade's. */
  courthouse?: boolean;
  /** The furthest the distance counts before the level is added, or `null` for no limit (`wasteDistance` for shields). */
  clampDistance?: number | null;
};
/**
 * `city_calc_corruption` (OpenCiv2 `src/auto/city.cpp`, richardpenman/civ2@49f26ec), for trade and shields alike:
 *  distance × amount × 3 / (divisor × 20), rounded down, at most the amount, then halved (rounding down) by the Palace
 *  or a Courthouse. Communism measures every city at @COSMIC's distance. A celebrating city counts its government one
 *  step up, for the divisor and for the level a person's cities under Anarchy or Despotism add to the distance (up to
 *  32); Communism itself still goes by the government.
 */
export declare const corruption: ({
  amount,
  government,
  distance,
  human,
  level,
  capital,
  celebrating,
  courthouse,
  clampDistance,
}: CorruptionInput) => number;
/**
 * A city's trade corruption (`city_calc_trade_happiness`): `corruption` with no limit on the distance, and none under
 *  Fundamentalism or Democracy. The Courthouse's halving is civ2-city-improvement's.
 */
export declare const tradeCorruption: (input: CorruptionInput) => number;
export type WasteInput = Omit<CorruptionInput, 'amount' | 'clampDistance'> & {
  /** The city's shields, after the Factory's and the plants' bonuses (`city_calc.total_shields`). */
  shields: number;
  /** The shields its units cost (`city_calc.shield_support`). */
  support: number;
  /** How the city is joined to its capital (`lib/capitalLink`): 0, 1 (by road) or 2 (by railroad). */
  link: number;
  /** Whether the city is the barbarians' (civilization 0). */
  barbarian: boolean;
  /** Whether the city is building the Palace with no other Palace to measure from (`city_calc.capital_nearest < 0`). */
  buildingPalaceWithNoCapital: boolean;
};
/**
 * A city's shield waste (`city_calc_shields_pollution`): `corruption` of its shields less their support, the distance
 *  counting no more than 16, times (3 − link) / 3, over (government ÷ 2) + 1, each rounded down; at most what leaves
 *  the city 1 shield over its support, and none below 1. None for the barbarians, under Democracy or Fundamentalism,
 *  or while building the Palace with no capital. The divisor after the link is the government's own, celebrating or
 *  not.
 */
export declare const shieldWaste: ({
  shields,
  support,
  link,
  barbarian,
  buildingPalaceWithNoCapital,
  ...input
}: WasteInput) => number;
export default tradeCorruption;
