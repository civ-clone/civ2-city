import {
  AvailableSpecialistRegistry,
  instance as availableSpecialistRegistryInstance,
} from '@civ-clone/core-city/AvailableSpecialistRegistry';
import {
  CityBuildRegistry,
  instance as cityBuildRegistryInstance,
} from '@civ-clone/core-city-build/CityBuildRegistry';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  PlayerWorldRegistry,
  instance as playerWorldRegistryInstance,
} from '@civ-clone/core-player-world/PlayerWorldRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  WorkedTileRegistry,
  instance as workedTileRegistryInstance,
} from '@civ-clone/core-city/WorkedTileRegistry';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import InciteRevolt from '@civ-clone/base-unit-action-incite-revolt/InciteRevolt';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';
import { destroyUnits } from '@civ-clone/base-city-lifecycle/lib/destroyed';
import { keepCapturedBuild } from '@civ-clone/base-city-lifecycle/lib/captured';
import { reassignWorkers } from '@civ-clone/base-city-lifecycle/lib/assignWorkers';

// What happens to a city that changes hands, as Civilization II has it (OpenCiv2 `src/auto/city.cpp`
//  `city_capture_aftermath`, richardpenman/civ2@49f26ec): its shield box is emptied, Auto is turned off, it keeps what
//  it was building, and it loses a citizen. Plunder, lost
//  improvements, the stolen advance, partisans and rehoming its units aren't here (civ2-city's README).
export const getRules: (
  unitRegistry?: UnitRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  cityBuildRegistry?: CityBuildRegistry,
  engine?: Engine,
  playerWorldRegistry?: PlayerWorldRegistry,
  workedTileRegistry?: WorkedTileRegistry,
  specialistRegistry?: SpecialistRegistry,
  availableSpecialistRegistry?: AvailableSpecialistRegistry
) => Captured[] = (
  unitRegistry: UnitRegistry = unitRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  cityBuildRegistry: CityBuildRegistry = cityBuildRegistryInstance,
  engine: Engine = engineInstance,
  playerWorldRegistry: PlayerWorldRegistry = playerWorldRegistryInstance,
  workedTileRegistry: WorkedTileRegistry = workedTileRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  availableSpecialistRegistry: AvailableSpecialistRegistry = availableSpecialistRegistryInstance
): Captured[] => [
  new Captured(
    'civ2-city:city/captured/reset-build-progress',
    new Effect((capturedCity: City): void =>
      cityBuildRegistry.getByCity(capturedCity).progress().set(0)
    )
  ),
  new Captured(
    'civ2-city:city/captured/stop-auto',
    new Effect((capturedCity: City): void =>
      cityBuildRegistry.getByCity(capturedCity).setAuto(false)
    )
  ),
  // Whoever takes it, the item stays, at the new owner's price.
  new Captured(
    'civ2-city:city/captured/keep-build',
    new Effect((capturedCity: City): void =>
      keepCapturedBuild(cityBuildRegistry.getByCity(capturedCity))
    )
  ),
  // A city conquered from another than its founder loses a citizen, so one of size 1 is destroyed; one taken by a
  //  Diplomat or Spy, or retaken by its founder, loses one only when it has one to spare (`city_capture_aftermath`).
  new Captured(
    'civ2-city:city/captured/shrink',
    new Criterion(
      (
        capturedCity: City,
        capturingPlayer: Player,
        player: Player,
        cause: unknown
      ): boolean =>
        cityGrowthRegistry.getByCity(capturedCity).size() > 1 ||
        (!(cause instanceof InciteRevolt) &&
          capturedCity.originalPlayer() !== capturingPlayer)
    ),
    new Effect((capturedCity: City): void =>
      cityGrowthRegistry.getByCity(capturedCity).shrink(Captured)
    )
  ),
  // The food box is the new owner's: a computer player's rows differ from a person's (`growth-cost`). A city that
  //  shrank was costed by `shrink/set-growth-cost` already and is costed again here, which is harmless; one that's
  //  gone isn't (checked here, as every `Criterion` is evaluated before any `Effect` runs).
  new Captured(
    'civ2-city:city/captured/set-growth-cost',
    new Effect((capturedCity: City): void => {
      if (capturedCity.destroyed()) {
        return;
      }

      cityGrowthRegistry.getByCity(capturedCity).setCost();
    })
  ),
  new Captured(
    'civ2-city:city/captured/emit',
    new Effect(
      (capturedCity: City, capturingPlayer: Player, player: Player): void => {
        engine.emit('city:captured', capturedCity, capturingPlayer, player);
      }
    )
  ),
  // Not the units now the capturer's, which defected with an incited city.
  new Captured(
    'civ2-city:city/captured/destroy-supported-units',
    new Effect((capturedCity: City, capturingPlayer: Player): void =>
      destroyUnits(
        unitRegistry
          .getByCity(capturedCity)
          .filter((unit: Unit): boolean => unit.player() !== capturingPlayer)
      )
    )
  ),
  new Captured(
    'civ2-city:city/captured/reassign-workers',
    new Effect((capturedCity: City): void => {
      // A city `shrink` destroyed has released its tiles. Checked here, not in a `Criterion`: every `Criterion` is
      //  evaluated before any `Effect` runs.
      if (capturedCity.destroyed()) {
        return;
      }

      reassignWorkers(
        capturedCity,
        playerWorldRegistry,
        cityGrowthRegistry,
        workedTileRegistry,
        specialistRegistry,
        availableSpecialistRegistry
      );
    })
  ),
];

export default getRules;
