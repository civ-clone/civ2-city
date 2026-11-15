import { COMMUNISM, MONARCHY } from '@civ-clone/civ2-rules/data/governments';
import {
  corruptionDivisor,
  maximumDistance,
  noCapitalDistance,
  noShieldWaste,
  noTradeCorruption,
  wasteDistance,
} from '../data/cityRules';
import cosmic from '@civ-clone/civ2-rules/data/cosmic';

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

/** The corruption divisor for a government level, which a celebrating Democracy takes one past the table. */
const divisorOf = (level: number): number =>
  corruptionDivisor[Math.min(level, corruptionDivisor.length - 1)];

/**
 * `city_calc_corruption` (OpenCiv2 `src/auto/city.cpp`, richardpenman/civ2@49f26ec), for trade and shields alike:
 *  distance × amount × 3 / (divisor × 20), rounded down, at most the amount, then halved (rounding down) by the Palace
 *  or a Courthouse. Communism measures every city at @COSMIC's distance. A celebrating city counts its government one
 *  step up, for the divisor and for the level a person's cities under Anarchy or Despotism add to the distance (up to
 *  32); Communism itself still goes by the government.
 */
export const corruption = ({
  amount,
  government,
  distance,
  human,
  level,
  capital,
  celebrating = false,
  courthouse = false,
  clampDistance = null,
}: CorruptionInput): number => {
  if (amount < 1) {
    return 0;
  }

  const governmentLevel = celebrating ? government + 1 : government,
    divisor = divisorOf(governmentLevel);

  let measured: number;

  if (government === COMMUNISM) {
    measured = cosmic.communismPalaceDistance;
  } else {
    // `city_calc_capital_link` starts at 32 and only lowers it, so no distance counts for more.
    measured = Math.min(distance ?? noCapitalDistance, maximumDistance);

    if (clampDistance !== null && measured > clampDistance) {
      measured = clampDistance;
    }

    if (governmentLevel < MONARCHY && measured !== 0 && human) {
      measured = Math.min(Math.max(measured + level, 0), maximumDistance);
    }
  }

  const result = Math.min(
    Math.max(Math.trunc((measured * amount * 3) / (divisor * 20)), 0),
    amount
  );

  return capital || courthouse ? result >> 1 : result;
};

/**
 * A city's trade corruption (`city_calc_trade_happiness`): `corruption` with no limit on the distance, and none under
 *  Fundamentalism or Democracy. The Courthouse's halving is civ2-city-improvement's.
 */
export const tradeCorruption = (input: CorruptionInput): number =>
  noTradeCorruption.includes(input.government)
    ? 0
    : corruption({ ...input, courthouse: false, clampDistance: null });

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
export const shieldWaste = ({
  shields,
  support,
  link,
  barbarian,
  buildingPalaceWithNoCapital,
  ...input
}: WasteInput): number => {
  if (
    barbarian ||
    noShieldWaste.includes(input.government) ||
    buildingPalaceWithNoCapital
  ) {
    return 0;
  }

  const wasted = Math.trunc(
      Math.trunc(
        ((3 - link) *
          corruption({
            ...input,
            amount: shields - support,
            clampDistance: wasteDistance,
          })) /
          3
      ) /
        ((input.government >> 1) + 1)
    ),
    waste = Math.min(wasted, shields - (support + 1));

  return waste < 1 ? 0 : waste;
};

export default tradeCorruption;
