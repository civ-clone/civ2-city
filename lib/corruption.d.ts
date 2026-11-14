export type CorruptionInput = {
  /** The trade to take corruption from. */
  amount: number;
  /** The player's government, in Civ2's order. */
  government: number;
  /** The distance to the player's Palace, or `null` with no Palace. */
  distance: number | null;
  /** Whether a person plays the city's player. */
  human: boolean;
  /** The game's level, 0 (Chieftain) to 5 (Deity). */
  level: number;
  /** Whether the city has the Palace. */
  capital: boolean;
};
/**
 * A city's trade corruption, as Civilization II works it out (OpenCiv2 `src/auto/city.cpp` `city_calc_corruption` and
 * `city_calc_trade_happiness`, richardpenman/civ2@49f26ec): distance × amount × 3 / (divisor × 20), at most the
 * amount, halved in the Palace's city. Communism measures every city at @COSMIC's distance; a person's cities under
 * Anarchy or Despotism add the level to theirs; there is none under Fundamentalism or Democracy.
 *
 * Not here: a celebrating city's step up in divisor and the Courthouse's halving, and the shield waste the same
 *  formula gives (civ2-city's README).
 */
export declare const tradeCorruption: ({
  amount,
  government,
  distance,
  human,
  level,
  capital,
}: CorruptionInput) => number;
export default tradeCorruption;
