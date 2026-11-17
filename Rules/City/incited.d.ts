import { Engine } from '@civ-clone/core-engine/Engine';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import Dependencies from '@civ-clone/civ2-diplomacy/lib/Dependencies';
import Player from '@civ-clone/core-player/Player';
import { FounderDependencies } from '../../lib/founder';
/** Before every other rule of a capture (`High` is 1000), as the original's aftermath starts with them. */
export declare const incitedPriority = 100;
/**
 * At the doubled price the inciter becomes `city`'s founder before the city changes hands (`unit_spy.cpp:843`), so
 *  its capture is a liberation (`was_founder`, `city.cpp:5407`): no Partisans, no buildings lost, no citizen lost at
 *  size 1. Call it from the `RevoltIncited` rule that captures the city, just before `City#capture`: a `Captured`
 *  rule would be too late, as every `Criterion` of a capture is asked before any `Effect` runs. The capture then
 *  makes the loser the founder, as every capture does (`lib/captureAftermath`'s `founder` rule, `city.cpp:5538`).
 */
export declare const inciterBecomesFounder: (
  city: City,
  inciter: Player,
  dependencies?: FounderDependencies
) => void;
export interface IncitedDependencies {
  /** civ2-diplomacy's dependencies (its `dependenciesOf(game)`). */
  diplomacy: Dependencies;
  engine?: Engine;
  randomNumberGenerator?: () => number;
}
/**
 * A city taken by a Diplomat or Spy, and what any capture does between the two players (OpenCiv2
 *  richardpenman/civ2@e39fe7b):
 * - **the price** (`unit_spy.cpp:835-846`, `city.cpp:5404`): at the plain price, an incident and a forced war; at the
 *   doubled price (`SubvertCity`, offered under a treaty), the victim holds a vendetta instead (civ2-diplomacy's
 *   `incited`);
 * - **the founder**: `inciterBecomesFounder`, for the rule that captures the city;
 * - **the incident** (`city.cpp:5410-5413`): any capture with a person on either side sets `INCIDENT` both ways (the
 *   original also asks that no spaceship has been launched, and there is none yet). A Barbarian's captures set
 *   nothing: no diplomacy is kept with them.
 */
export declare const getRules: ({
  diplomacy,
  engine,
  randomNumberGenerator,
}: IncitedDependencies) => Captured[];
export default getRules;
