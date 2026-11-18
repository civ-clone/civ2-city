import { ChooseProductionState } from './chooseProduction';
import { CityBuildRegistry } from '@civ-clone/core-city-build/CityBuildRegistry';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { GameDifficultyRegistry } from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { LandMassRegistry } from '@civ-clone/core-world/LandMassRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { PlayerRegistry } from '@civ-clone/core-player/PlayerRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { PlayerTradeRatesRegistry } from '@civ-clone/core-trade-rate/PlayerTradeRatesRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import { WonderRegistry } from '@civ-clone/core-wonder/WonderRegistry';
import City from '@civ-clone/core-city/City';
import { SpaceshipRegistry } from '@civ-clone/core-spaceship/SpaceshipRegistry';
import Player from '@civ-clone/core-player/Player';
import Yield from '@civ-clone/core-yield/Yield';
/** civ2-city-happiness' status for a city in civil disorder (`CITYF_DISORDER`), named here as `lib/celebrating` names its. */
export declare const CIVIL_DISORDER = 'civ2-city-happiness:civil-disorder';
/** `continent_policy` with no AI assessment to say otherwise: 5, the land mass isn't crowded, nothing to attack or defend. */
export declare const DEFAULT_POLICY = 5;
/** A unit on a Fortress this close to one of its player's cities (`map_distance` < 4) isn't aggressive. */
export declare const FORTRESS_NEAR_CITY = 4;
export interface ChooseProductionDependencies {
  cityBuildRegistry?: CityBuildRegistry;
  cityGrowthRegistry?: CityGrowthRegistry;
  cityImprovementRegistry?: CityImprovementRegistry;
  cityRegistry?: CityRegistry;
  clientRegistry?: ClientRegistry;
  gameDifficultyRegistry?: GameDifficultyRegistry;
  interactionRegistry?: InteractionRegistry;
  landMassRegistry?: LandMassRegistry;
  pendingEffectRegistry?: PendingEffectRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  playerRegistry?: PlayerRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  playerTradeRatesRegistry?: PlayerTradeRatesRegistry;
  ruleRegistry?: RuleRegistry;
  spaceshipRegistry?: SpaceshipRegistry;
  specialistRegistry?: SpecialistRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  unitRegistry?: UnitRegistry;
  wonderRegistry?: WonderRegistry;
  /**
   * The player's `continent_policy` on the city's land mass (0 attack, 1 defend, 4 crowded, 5 expand), which the AI's
   *  `ai_civ_turn_assess` works out for every player each turn (`src/auto/ai.cpp`). No such assessment exists yet:
   *  `DEFAULT_POLICY` by default, for the AI (stage N) to supply.
   */
  continentPolicy?: (city: City) => number;
  /** `continent_flags & 0x10` for the city's land mass (the AI has had to defend there): none by default. */
  defendedLandMass?: (city: City) => boolean;
  /** The city's happy and unhappy citizens. base-city-happiness' unstaged count by default; pass Civ2's staged one. */
  citizens?: (
    city: City,
    yields: Yield[]
  ) => {
    happy: number;
    unhappy: number;
  };
  /** `city_calc.aggressive_units`: the city's units that make its citizens unhappy away from home. */
  aggressiveUnits?: (city: City) => number;
  /** `game.best_human_rank`: the first human player by default (there are no power ranks yet). */
  bestHuman?: (player: Player) => Player | null;
}
/** The leader's `attack`: 1 Aggressive, −1 Friendly (rational), 0 otherwise (as civ2-diplomacy reads it). */
export declare const attackOf: (player: Player) => number;
/** The leader's `civilize`: 1 Civilized, −1 Militaristic, 0 otherwise (as civ2-player reads it). */
export declare const civilizeOf: (player: Player) => number;
/**
 * What `city_choose_production` surveys (`src/auto/city_production.cpp` ~2095 and its parts `_scan_tiles`,
 *  `_survey_cities`, `_defense_need`; richardpenman/civ2@49f26ec), from a game. `yields` are the city's, worked out once
 *  for every item ranked.
 */
export declare const chooseProductionState: (
  city: City,
  yields: Yield[],
  dependencies?: ChooseProductionDependencies
) => ChooseProductionState;
export default chooseProductionState;
