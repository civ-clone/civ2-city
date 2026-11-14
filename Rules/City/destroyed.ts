import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  WorkedTileRegistry,
  instance as workedTileRegistryInstance,
} from '@civ-clone/core-city/WorkedTileRegistry';
import {
  destroyUnits,
  releaseSpecialists,
  releaseWorkedTiles,
} from '@civ-clone/base-city-lifecycle/lib/destroyed';
import City from '@civ-clone/core-city/City';
import Destroyed from '@civ-clone/core-city/Rules/Destroyed';
import Effect from '@civ-clone/core-rule/Effect';
import Irrigation from '@civ-clone/base-tile-improvement-irrigation/Irrigation';
import Player from '@civ-clone/core-player/Player';
import Removed from '@civ-clone/core-tile-improvement/Rules/Removed';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';

export const getRules: (
  tileImprovementRegistry?: TileImprovementRegistry,
  engine?: Engine,
  unitRegistry?: UnitRegistry,
  workedTileRegistry?: WorkedTileRegistry,
  specialistRegistry?: SpecialistRegistry,
  ruleRegistry?: RuleRegistry
) => Destroyed[] = (
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  engine: Engine = engineInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance,
  workedTileRegistry: WorkedTileRegistry = workedTileRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): Destroyed[] => [
  // The irrigation `created` gave the city's square goes with it, through the `Removed` rules, so the square's yields
  //  are worked out again and whoever shows it is told.
  new Destroyed(
    'civ2-city:city/destroyed/remove-irrigation',
    new Effect((city: City): void =>
      tileImprovementRegistry
        .getByTile(city.tile())
        .filter(
          (improvement: TileImprovement): boolean =>
            improvement instanceof Irrigation
        )
        .forEach((irrigation: TileImprovement): void => {
          ruleRegistry.process(Removed, city.tile(), irrigation);
        })
    )
  ),
  new Destroyed(
    'civ2-city:city/destroyed/emit',
    new Effect((city: City, player: Player | null): void => {
      engine.emit('city:destroyed', city, player);
    })
  ),
  new Destroyed(
    'civ2-city:city/destroyed/destroy-supported-units',
    new Effect((city: City): void => destroyUnits(unitRegistry.getByCity(city)))
  ),
  new Destroyed(
    'civ2-city:city/destroyed/release-worked-tiles',
    new Effect((city: City): void =>
      releaseWorkedTiles(city, workedTileRegistry)
    )
  ),
  new Destroyed(
    'civ2-city:city/destroyed/release-specialists',
    new Effect((city: City): void =>
      releaseSpecialists(city, specialistRegistry)
    )
  ),
];

export default getRules;
