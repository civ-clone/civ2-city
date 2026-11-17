import GovernmentTerms from '@civ-clone/base-government-terms/Rules/GovernmentTerms';
import { Terms } from '@civ-clone/base-government-terms/lib/terms';
/**
 * What each of Civilization II's governments does to a city's squares and its corruption, as this package's rules
 *  apply them (`Rules/City/tile-yield`, `lib/corruption`), as base-government-terms' `GovernmentTerms`, for a player or
 *  its AI to compare governments with. Asked by nothing in the rules themselves. A city that isn't celebrating:
 * - below Monarchy, a yield over 2 loses 1;
 * - from the Republic up, any trade gains 1;
 * - corruption takes distance × 3 / (divisor × 20) of the trade, the divisor by government, and Communism measures every
 *   city at @COSMIC's distance; none under Fundamentalism and Democracy.
 */
export declare const terms: (index: number) => Partial<Terms>;
export declare const getRules: () => GovernmentTerms[];
export default getRules;
