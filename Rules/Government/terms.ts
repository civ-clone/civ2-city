import {
  COMMUNISM,
  MONARCHY,
  REPUBLIC,
} from '@civ-clone/civ2-rules/data/governments';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Government from '@civ-clone/core-government/Government';
import GovernmentTerms from '@civ-clone/base-government-terms/Rules/GovernmentTerms';
import { Terms } from '@civ-clone/base-government-terms/lib/terms';
import { corruptionDivisor, noTradeCorruption } from '../../data/cityRules';
import cosmic from '@civ-clone/civ2-rules/data/cosmic';
import { governments } from '../../Governments';

// The index of `GovernmentType` in Civ2's order (`Governments`), matched as `PlayerGovernment#is` matches, or -1.
const indexOf = (GovernmentType: typeof Government): number =>
  governments.findIndex(
    (Known: typeof Government): boolean =>
      GovernmentType === Known || GovernmentType.prototype instanceof Known
  );

/**
 * What each of Civilization II's governments does to a city's squares and its corruption, as this package's rules
 *  apply them (`Rules/City/tile-yield`, `lib/corruption`), as base-government-terms' `GovernmentTerms`, for a player or
 *  its AI to compare governments with. Asked by nothing in the rules themselves. A city that isn't celebrating:
 * - below Monarchy, a yield over 2 loses 1;
 * - from the Republic up, any trade gains 1;
 * - corruption takes distance × 3 / (divisor × 20) of the trade, the divisor by government, and Communism measures every
 *   city at @COSMIC's distance; none under Fundamentalism and Democracy.
 */
export const terms = (index: number): Partial<Terms> => ({
  tilePenalty: index < MONARCHY ? { threshold: 2, amount: 1 } : null,
  tradeBonus: index >= REPUBLIC ? 1 : 0,
  corruption: {
    perDistance: noTradeCorruption.includes(index)
      ? 0
      : 3 /
        (corruptionDivisor[Math.min(index, corruptionDivisor.length - 1)] * 20),
    fixedDistance: index === COMMUNISM ? cosmic.communismPalaceDistance : null,
  },
});

export const getRules = (): GovernmentTerms[] => [
  new GovernmentTerms(
    'civ2-city:government/terms',
    new Criterion(
      (GovernmentType: typeof Government): boolean =>
        indexOf(GovernmentType) > -1
    ),
    new Effect(
      (GovernmentType: typeof Government): Partial<Terms> =>
        terms(indexOf(GovernmentType))
    )
  ),
];

export default getRules;
