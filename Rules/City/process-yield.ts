import {
  CityBuildRegistry,
  instance as cityBuildRegistryInstance,
} from '@civ-clone/core-city-build/CityBuildRegistry';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { Food, Production } from '../../Yields';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  buildWithProduction,
  storeFood,
} from '@civ-clone/base-city-lifecycle/lib/processYield';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  PlayerTreasuryRegistry,
  instance as playerTreasuryRegistryInstance,
} from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import {
  isBuildingCapitalization,
  payOut,
} from '@civ-clone/base-city-improvement-capitalization/lib/capitalizationRules';
import { ANARCHY } from '@civ-clone/civ2-rules/data/governments';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import governmentOf from '../../lib/government';
import Capitalization from '@civ-clone/base-city-improvement-capitalization/Capitalization';
import Criterion from '@civ-clone/core-rule/Criterion';
import Description from '@civ-clone/core-rule/Description';
import Effect from '@civ-clone/core-rule/Effect';
import ProcessYield from '@civ-clone/core-city/Rules/ProcessYield';
import { UnitSupportProduction } from '../../Yields';
import Yield from '@civ-clone/core-yield/Yield';

export const getRules: (
  cityBuildRegistry?: CityBuildRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  unitRegistry?: UnitRegistry,
  ruleRegistry?: RuleRegistry,
  playerTreasuryRegistry?: PlayerTreasuryRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry
) => ProcessYield[] = (
  cityBuildRegistry: CityBuildRegistry = cityBuildRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  playerTreasuryRegistry: PlayerTreasuryRegistry = playerTreasuryRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance
): ProcessYield[] => [
  new ProcessYield(
    'civ2-city:city/process-yield/food',
    new Criterion(
      (cityYield: Yield): cityYield is Food => cityYield instanceof Food
    ),
    // The city's food, net of what its citizens and units eat, goes into its store, which may run out: a city short of
    //  food loses a unit it feeds (or a citizen) only when it does, not as soon as it is short (`FoodExhausted`,
    //  civ-clone/web-renderer#969).
    new Effect((cityYield: Food, city: City): void => {
      storeFood(cityYield, city, cityGrowthRegistry);
    })
  ),

  new ProcessYield(
    'civ2-city:city/process-yield/production',
    new Criterion(
      (cityYield: Yield): cityYield is Production =>
        cityYield instanceof Production
    ),
    // Units the city can't support go, furthest first, and there's no production while there's civil disorder.
    //
    // While the city builds Capitalization, its shields (after waste and its units' support) never go into the box
    //  (`city_process_production`, city_production.cpp ~3031: the box is frozen), but into the treasury, one for one,
    //  after the Marketplace's and Bank's bonuses (`city_split_trade`, city.cpp ~3617), and only outside civil
    //  disorder and Anarchy (`city_process_disorder`). The build is still checked, so its `Hold` and queue rules run.
    new Effect(
      (cityYield: Production, city: City, cityYields: Yield[]): void => {
        const cityBuild = cityBuildRegistry.getByCity(city);

        if (!isBuildingCapitalization(cityBuild)) {
          buildWithProduction(
            cityYield,
            city,
            cityYields,
            UnitSupportProduction,
            cityBuildRegistry,
            ruleRegistry
          );

          return;
        }

        let net = 0;

        // `buildWithProduction` disbands what the city can't support and leaves out the turn's production in disorder;
        //  here what it would add is paid out instead.
        buildWithProduction(
          cityYield,
          city,
          cityYields,
          UnitSupportProduction,
          {
            getByCity: () =>
              ({
                add: (production: Yield): void => {
                  net = production.value();
                },
                check: (): void => {},
              } as unknown as CityBuild),
          } as unknown as CityBuildRegistry,
          ruleRegistry
        );

        payOut(
          city,
          net,
          { playerTreasuryRegistry },
          {
            YieldType: Gold,
            pays: (city: City): boolean =>
              governmentOf(city.player(), playerGovernmentRegistry) !== ANARCHY,
          }
        );

        cityBuild.check();
      }
    ),
    // What Capitalization does, for the Civilopedia (civ-clone/web-renderer#1196).
    new Description({
      type: 'converts',
      subject: Capitalization,
      from: Production,
      to: Gold,
    })
  ),
];

export default getRules;
