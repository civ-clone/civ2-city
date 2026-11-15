import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { PlayerRegistry } from '@civ-clone/core-player/PlayerRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { PlayerTreasuryRegistry } from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { UnitImprovementRegistry } from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import Player from '@civ-clone/core-player/Player';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
export interface CaptureDependencies {
  cityRegistry?: CityRegistry;
  clientRegistry?: ClientRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  playerRegistry?: PlayerRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  playerTreasuryRegistry?: PlayerTreasuryRegistry;
  ruleRegistry?: RuleRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
  randomNumberGenerator?: () => number;
  /** Civ2's `civs[].reputation` (higher is worse), which nothing models yet: 0, a clean record, unless given. */
  reputation?: (player: Player) => number;
  /** Whether `player` holds a vendetta against `against` (`TREATY_VENDETTA`), which nothing models yet: never, unless given. */
  vendetta?: (player: Player, against: Player) => boolean;
}
export declare const withCaptureDefaults: ({
  cityRegistry,
  clientRegistry,
  playerGovernmentRegistry,
  playerRegistry,
  playerResearchRegistry,
  playerTreasuryRegistry,
  ruleRegistry,
  tileImprovementRegistry,
  unitImprovementRegistry,
  randomNumberGenerator,
  reputation,
  vendetta,
}?: CaptureDependencies) => Required<CaptureDependencies>;
/**
 * After every `Normal` rule of a capture (civ2-city-improvement's Palace escape, which spends the loser's gold first,
 *  and civ2-science's stolen advance, which the Partisans' count reads) and before civ2-wonder's `Low` Leonardo's
 *  Workshop, which comes last in `city_capture_aftermath`. Plunder, then Partisans, as the original runs them.
 */
export declare const plunderPriority = 2500;
/**
 * Holds `city`'s plunder until `pending` settles: a choice the loser makes at the capture that spends its gold first,
 *  such as civ2-city-improvement's Palace escape (`city_capture_aftermath` :5462-5475 runs the escape before the
 *  plunder, which is capped to what's left). Call it from a `Captured` rule that runs before `plunderPriority`; the
 *  plunder takes every promise registered for the capture, and forgets them.
 */
export declare const waitBeforePlunder: (
  city: City,
  pending: Promise<unknown>
) => void;
export declare const partisansPriority = 2600;
/**
 * Plunder, the units the city supported, and Partisans: OpenCiv2 `src/auto/city.cpp` `city_capture_aftermath`
 *  (0057b5df) and its `_announce`, `_rehome_units` and `_partisans` parts (richardpenman/civ2@49f26ec).
 */
export declare const captureRules: (
  unitRegistry: UnitRegistry,
  cityGrowthRegistry: CityGrowthRegistry,
  engine: Engine,
  {
    cityRegistry,
    clientRegistry,
    playerGovernmentRegistry,
    playerRegistry,
    playerResearchRegistry,
    playerTreasuryRegistry,
    ruleRegistry,
    tileImprovementRegistry,
    unitImprovementRegistry,
    randomNumberGenerator,
    reputation,
    vendetta,
  }: Required<CaptureDependencies>
) => Captured[];
export default captureRules;
