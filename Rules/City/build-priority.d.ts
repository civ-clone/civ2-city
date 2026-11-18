import { ChooseProductionDependencies } from '../../lib/chooseProductionState';
import {
  ChooseProductionState,
  ImprovementId,
} from '../../lib/chooseProduction';
import { IBuildable as Buildable } from '@civ-clone/core-city-build/Buildable';
import BuildPriority from '@civ-clone/core-city-build/Rules/BuildPriority';
import City from '@civ-clone/core-city/City';
import Yield from '@civ-clone/core-yield/Yield';
/**
 * The improvements Civ2 scores for a city on Auto, by their number (`IMP_*`). The Mass Transit, the Solar Plant and
 *  Capitalization always score 999 there (`city_choose_production_improvement_score`), so they aren't listed: a city
 *  on Auto never chooses them. Of the spaceship, only the structural is scored, as the original's city builds an SS
 *  Structural.
 */
export declare const scoredImprovements: [Buildable, ImprovementId][];
/** Civ2's number for `item`: its own class's, or failing that one it's a kind of (a ruleset's subclass). */
export declare const improvementIdOf: (item: Buildable) => ImprovementId | null;
/**
 * Civ2's own ranking for a city on Auto (`city_choose_production`, OpenCiv2 `src/auto/city_production.cpp`,
 *  richardpenman/civ2@49f26ec): each improvement's score (`lib/chooseProduction`), lowest wanted most, as a
 *  core-city-build `BuildPriority` of 501 − the score, so `rankBuildItems` puts the same one first and leaves out what
 *  Civ2 would never choose (a score over 500). Only for a city on Auto: Civ2 uses the same function for its own
 *  players' cities, but a computer player here chooses with simple-ai-client, which reads `BuildPriority` too.
 */
export declare const getRules: (
  dependencies?: ChooseProductionDependencies,
  survey?: (
    city: City,
    yields: Yield[],
    dependencies: ChooseProductionDependencies
  ) => ChooseProductionState
) => BuildPriority[];
export default getRules;
