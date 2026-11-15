import {
  ChooseProductionDependencies,
  chooseProductionState,
} from '../../lib/chooseProductionState';
import {
  ChooseProductionState,
  ImprovementId,
  chooseImprovementScore,
  priorityOf,
} from '../../lib/chooseProduction';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import Aqueduct from '@civ-clone/base-city-improvement-aqueduct/Aqueduct';
import Bank from '@civ-clone/base-city-improvement-bank/Bank';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import { IBuildable as Buildable } from '@civ-clone/core-city-build/Buildable';
import BuildPriority from '@civ-clone/core-city-build/Rules/BuildPriority';
import Cathedral from '@civ-clone/base-city-improvement-cathedral/Cathedral';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import CityWalls from '@civ-clone/base-city-improvement-citywalls/CityWalls';
import CoastalFortress from '@civ-clone/base-city-improvement-coastalfortress/CoastalFortress';
import Colosseum from '@civ-clone/base-city-improvement-colosseum/Colosseum';
import Courthouse from '@civ-clone/base-city-improvement-courthouse/Courthouse';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Factory from '@civ-clone/base-city-improvement-factory/Factory';
import Granary from '@civ-clone/base-city-improvement-granary/Granary';
import Harbour from '@civ-clone/base-city-improvement-harbour/Harbour';
import HydroPlant from '@civ-clone/base-city-improvement-hydroplant/HydroPlant';
import Library from '@civ-clone/base-city-improvement-library/Library';
import ManufacturingPlant from '@civ-clone/base-city-improvement-manufacturingplant/ManufacturingPlant';
import Marketplace from '@civ-clone/base-city-improvement-marketplace/Marketplace';
import NuclearPlant from '@civ-clone/base-city-improvement-nuclearplant/NuclearPlant';
import OffshorePlatform from '@civ-clone/base-city-improvement-offshoreplatform/OffshorePlatform';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import PoliceStation from '@civ-clone/base-city-improvement-policestation/PoliceStation';
import PortFacility from '@civ-clone/base-city-improvement-portfacility/PortFacility';
import PowerPlant from '@civ-clone/base-city-improvement-powerplant/PowerPlant';
import RecyclingCenter from '@civ-clone/base-city-improvement-recyclingcenter/RecyclingCenter';
import ResearchLab from '@civ-clone/base-city-improvement-researchlab/ResearchLab';
import SamMissileBattery from '@civ-clone/base-city-improvement-sammissilebattery/SamMissileBattery';
import SdiDefence from '@civ-clone/base-city-improvement-sdidefence/SdiDefence';
import SewerSystem from '@civ-clone/base-city-improvement-sewersystem/SewerSystem';
import StockExchange from '@civ-clone/base-city-improvement-stockexchange/StockExchange';
import Superhighways from '@civ-clone/base-city-improvement-superhighways/Superhighways';
import Supermarket from '@civ-clone/base-city-improvement-supermarket/Supermarket';
import Temple from '@civ-clone/base-city-improvement-temple/Temple';
import University from '@civ-clone/base-city-improvement-university/University';
import Yield from '@civ-clone/core-yield/Yield';

/**
 * The improvements Civ2 scores for a city on Auto, by their number (`IMP_*`). The Mass Transit, the Solar Plant, the
 *  spaceship and Capitalization always score 999 there (`city_choose_production_improvement_score`), so they aren't
 *  listed: a city on Auto never chooses them.
 */
export const scoredImprovements: [Buildable, ImprovementId][] = [
  [Palace, ImprovementId.Palace],
  [Barracks, ImprovementId.Barracks],
  [Granary, ImprovementId.Granary],
  [Temple, ImprovementId.Temple],
  [Marketplace, ImprovementId.Marketplace],
  [Library, ImprovementId.Library],
  [Courthouse, ImprovementId.Courthouse],
  [CityWalls, ImprovementId.CityWalls],
  [Aqueduct, ImprovementId.Aqueduct],
  [Bank, ImprovementId.Bank],
  [Cathedral, ImprovementId.Cathedral],
  [University, ImprovementId.University],
  [Colosseum, ImprovementId.Colosseum],
  [Factory, ImprovementId.Factory],
  [ManufacturingPlant, ImprovementId.ManufacturingPlant],
  [SdiDefence, ImprovementId.SdiDefense],
  [RecyclingCenter, ImprovementId.RecyclingCenter],
  [PowerPlant, ImprovementId.PowerPlant],
  [HydroPlant, ImprovementId.HydroPlant],
  [NuclearPlant, ImprovementId.NuclearPlant],
  [StockExchange, ImprovementId.StockExchange],
  [SewerSystem, ImprovementId.SewerSystem],
  [Supermarket, ImprovementId.Supermarket],
  [Superhighways, ImprovementId.Superhighways],
  [ResearchLab, ImprovementId.ResearchLab],
  [SamMissileBattery, ImprovementId.SamBattery],
  [CoastalFortress, ImprovementId.CoastalFortress],
  [Harbour, ImprovementId.Harbour],
  [OffshorePlatform, ImprovementId.OffshorePlatform],
  [Airport, ImprovementId.Airport],
  [PoliceStation, ImprovementId.PoliceStation],
  [PortFacility, ImprovementId.PortFacility],
] as unknown as [Buildable, ImprovementId][];

/** Civ2's number for `item`: its own class's, or failing that one it's a kind of (a ruleset's subclass). */
export const improvementIdOf = (item: Buildable): ImprovementId | null =>
  (scoredImprovements.find(([Type]) => Type === item) ??
    scoredImprovements.find(([Type]) =>
      Object.prototype.isPrototypeOf.call(Type, item)
    ))?.[1] ?? null;

/**
 * Civ2's own ranking for a city on Auto (`city_choose_production`, OpenCiv2 `src/auto/city_production.cpp`,
 *  richardpenman/civ2@49f26ec): each improvement's score (`lib/chooseProduction`), lowest wanted most, as a
 *  core-city-build `BuildPriority` of 501 − the score, so `rankBuildItems` puts the same one first and leaves out what
 *  Civ2 would never choose (a score over 500). Only for a city on Auto: Civ2 uses the same function for its own
 *  players' cities, but a computer player here chooses with simple-ai-client, which reads `BuildPriority` too.
 */
export const getRules = (
  dependencies: ChooseProductionDependencies = {},
  // What the city and its player look like to Civ2's choice: surveyed from the game by default.
  survey: (
    city: City,
    yields: Yield[],
    dependencies: ChooseProductionDependencies
  ) => ChooseProductionState = chooseProductionState
): BuildPriority[] => {
  // `rankBuildItems` hands every item's rules the same yields, so the survey is done once a ranking.
  const states = new WeakMap<Yield[], ChooseProductionState>(),
    stateOf = (
      cityBuild: CityBuild,
      yields: Yield[]
    ): ChooseProductionState => {
      if (!states.has(yields)) {
        states.set(yields, survey(cityBuild.city(), yields, dependencies));
      }

      return states.get(yields)!;
    };

  return [
    new BuildPriority(
      'civ2-city:city/build-priority/auto',
      new Criterion((cityBuild: CityBuild): boolean => cityBuild.auto()),
      new Criterion(
        (cityBuild: CityBuild, item: Buildable): boolean =>
          improvementIdOf(item) !== null
      ),
      new Effect(
        (cityBuild: CityBuild, item: Buildable, yields: Yield[]): number => {
          const improvement = improvementIdOf(item)!;

          return priorityOf(
            chooseImprovementScore(improvement, stateOf(cityBuild, yields)),
            improvement
          );
        }
      )
    ),
  ];
};

export default getRules;
