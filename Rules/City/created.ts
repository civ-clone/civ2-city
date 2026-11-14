import {
  AvailableCityBuildItemsRegistry,
  instance as availableCityBuildItemsRegistryInstance,
} from '@civ-clone/core-city-build/AvailableCityBuildItemsRegistry';
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
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  PlayerWorldRegistry,
  instance as playerWorldRegistryInstance,
} from '@civ-clone/core-player-world/PlayerWorldRegistry';
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
  WorkedTileRegistry,
  instance as workedTileRegistryInstance,
} from '@civ-clone/core-city/WorkedTileRegistry';
import {
  registerCityBuild,
  registerCityGrowth,
  workCityTile,
} from '@civ-clone/base-city-lifecycle/lib/created';
import City from '@civ-clone/core-city/City';
import Created from '@civ-clone/core-city/Rules/Created';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Irrigation from '@civ-clone/base-tile-improvement-irrigation/Irrigation';
import Road from '@civ-clone/base-tile-improvement-road/Road';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';

export const getRules: (
  tileImprovementRegistry?: TileImprovementRegistry,
  cityBuildRegistry?: CityBuildRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  cityRegistry?: CityRegistry,
  playerWorldRegistry?: PlayerWorldRegistry,
  ruleRegistry?: RuleRegistry,
  availableBuildItemsRegistry?: AvailableCityBuildItemsRegistry,
  engine?: Engine,
  workedTileRegistry?: WorkedTileRegistry,
  specialistRegistry?: SpecialistRegistry,
  availableSpecialistRegistry?: AvailableSpecialistRegistry
) => Created[] = (
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  cityBuildRegistry: CityBuildRegistry = cityBuildRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  cityRegistry: CityRegistry = cityRegistryInstance,
  playerWorldRegistry: PlayerWorldRegistry = playerWorldRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  availableBuildItemsRegistry: AvailableCityBuildItemsRegistry = availableCityBuildItemsRegistryInstance,
  engine: Engine = engineInstance,
  workedTileRegistry: WorkedTileRegistry = workedTileRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  availableSpecialistRegistry: AvailableSpecialistRegistry = availableSpecialistRegistryInstance
): Created[] => [
  // A city's square counts as irrigated and has a road (OpenCiv2 `src/auto/city.cpp` `city_tile_yield`,
  //  richardpenman/civ2@49f26ec). Given as the improvements themselves, as Civ1's are: the square of a city on terrain
  //  that can't be irrigated (where Civ2 counts it as mined) and the centre's farmland aren't modelled yet.
  ...([Irrigation, Road] as (typeof TileImprovement)[]).map(
    (TileImprovementType) =>
      new Created(
        `civ2-city:city/created/add-improvement/${TileImprovementType.name}`,
        new Criterion((city: City): boolean =>
          tileImprovementRegistry
            .getByTile(city.tile())
            .every(
              (tileImprovement) =>
                !(tileImprovement instanceof TileImprovementType)
            )
        ),
        new Effect((city: City): void =>
          tileImprovementRegistry.register(new TileImprovementType(city.tile()))
        )
      )
  ),
  new Created(
    'civ2-city:city/created/register-city-build',
    new Effect((city: City): void => {
      registerCityBuild(
        city,
        cityBuildRegistry,
        availableBuildItemsRegistry,
        ruleRegistry
      );
    })
  ),
  new Created(
    'civ2-city:city/created/register-city-growth',
    new Effect((city: City): void => {
      registerCityGrowth(city, cityGrowthRegistry, ruleRegistry);
    })
  ),
  new Created(
    'civ2-city:city/created/register',
    new Effect((city: City): void => cityRegistry.register(city))
  ),
  new Created(
    'civ2-city:city/created/emit',
    new Effect((city: City): void => {
      engine.emit('city:created', city);
    })
  ),
  new Created(
    'civ2-city:city/created/work-city-tile',
    new Effect((city: City): void =>
      workCityTile(
        city,
        ruleRegistry,
        playerWorldRegistry,
        cityGrowthRegistry,
        workedTileRegistry,
        specialistRegistry,
        availableSpecialistRegistry
      )
    )
  ),
];

export default getRules;
