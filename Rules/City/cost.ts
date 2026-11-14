import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  DiplomacyRole,
  SettleRole,
  TradeRole,
} from '@civ-clone/base-unit-role/Roles';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  foodSupport,
  productionSupport,
} from '@civ-clone/base-government-unit-support/lib/unitSupport';
import {
  freeUnitSupport,
  settlerFood,
  unitShieldCost,
} from '../../data/cityRules';
import City from '@civ-clone/core-city/City';
import Cost from '@civ-clone/core-city/Rules/Cost';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Fanatic from '@civ-clone/base-unit-fanatic/Fanatic';
import { FUNDAMENTALISM } from '@civ-clone/civ2-rules/data/governments';
import { PopulationSupportFood } from '../../Yields';
import Unit from '@civ-clone/core-unit/Unit';
import UnitSupportProduction from '@civ-clone/base-city-yield-unit-support-production/UnitSupportProduction';
import Yield from '@civ-clone/core-yield/Yield';
import cosmic from '@civ-clone/civ2-rules/data/cosmic';
import governmentOf from '../../lib/government';
import { hasRole } from '@civ-clone/base-unit-role/roleOf';

// A city's upkeep, as Civilization II has it (OpenCiv2 `src/auto/city.cpp`, richardpenman/civ2@49f26ec): its citizens
//  eat @COSMIC's food each, its units that settle eat by government (`city_calc_food_box_rows`), and each unit it
//  supports past its free ones costs a shield (`city_calc_unit_support`, `city_count_unit_support`).
export const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  unitRegistry?: UnitRegistry,
  ruleRegistry?: RuleRegistry
) => Cost[] = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): Cost[] => {
  // Diplomats, Spies, Caravans and Freight (roles 6 and 7) cost nothing, and aren't counted against the free units: the
  //  game counts only units whose role is below 6.
  const supported = (unit: Unit): boolean =>
      !hasRole(unit, DiplomacyRole, ruleRegistry) &&
      !hasRole(unit, TradeRole, ruleRegistry),
    settles = (unit: Unit): boolean => hasRole(unit, SettleRole, ruleRegistry),
    government = (city: City): number =>
      governmentOf(city.player(), playerGovernmentRegistry),
    free = (city: City): number => {
      const free = freeUnitSupport[government(city)];

      return free === 'size' ? cityGrowthRegistry.getByCity(city).size() : free;
    };

  return [
    new Cost(
      'civ2-city:city/cost/population-support-food',
      new Effect(
        (city: City): Yield =>
          new PopulationSupportFood(
            cityGrowthRegistry.getByCity(city).size() * cosmic.foodPerCitizen
          )
      )
    ),

    new Cost(
      'civ2-city:city/cost/unit-support-food',
      new Criterion((city: City): boolean =>
        unitRegistry.getByCity(city).some(settles)
      ),
      new Effect((city: City): Yield[] =>
        foodSupport(
          unitRegistry.getByCity(city),
          settles,
          settlerFood(government(city))
        )
      )
    ),

    // Under Fundamentalism a Fanatic uses up a free unit but never costs a shield itself (`UTYPE_FUNDAMENTALISM_FREE`).
    new Cost(
      'civ2-city:city/cost/unit-support-production',
      new Criterion(
        (city: City): boolean =>
          unitRegistry.getByCity(city).filter(supported).length > free(city)
      ),
      new Effect((city: City): Yield[] =>
        productionSupport(
          unitRegistry.getByCity(city),
          supported,
          free(city),
          unitShieldCost
        ).filter(
          (support: Yield): boolean =>
            !(
              government(city) === FUNDAMENTALISM &&
              (support as UnitSupportProduction).unit() instanceof Fanatic
            )
        )
      )
    ),
  ];
};

export default getRules;
