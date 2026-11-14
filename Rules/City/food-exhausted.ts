import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  emitFoodStorageExhausted,
  emptyFoodStore,
  foodSupportedUnit as baseFoodSupportedUnit,
  loseFoodSupportedUnit,
  shrinkFromFamine,
} from '@civ-clone/base-city-lifecycle/lib/famine';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import FoodExhausted from '@civ-clone/core-city-growth/Rules/FoodExhausted';
import Unit from '@civ-clone/core-unit/Unit';
import { UnitSupportFood } from '../../Yields';

// The first unit the city feeds (its Settlers or Engineers), or `null`.
const foodSupportedUnit = (cityGrowth: CityGrowth): Unit | null =>
  baseFoodSupportedUnit(cityGrowth, UnitSupportFood);

// When a city's food box runs out, Civilization II disbands the first unit that settles the city supports, or failing
//  that the city loses a citizen (and is gone at none), and the box is emptied (OpenCiv2 `src/auto/city.cpp`
//  `city_process_food`, richardpenman/civ2@49f26ec). A city short of food eats into its box first.
export const getRules: (engine?: Engine) => FoodExhausted[] = (
  engine: Engine = engineInstance
): FoodExhausted[] => [
  new FoodExhausted(
    'civ2-city:city/food-exhausted/emit',
    new Effect((cityGrowth: CityGrowth): void => {
      emitFoodStorageExhausted(
        cityGrowth,
        foodSupportedUnit(cityGrowth),
        engine
      );
    })
  ),
  new FoodExhausted(
    'civ2-city:city/food-exhausted/lose-food-supported-unit',
    new Criterion(
      (cityGrowth: CityGrowth): boolean =>
        foodSupportedUnit(cityGrowth) !== null
    ),
    new Effect((cityGrowth: CityGrowth): void =>
      loseFoodSupportedUnit(cityGrowth, UnitSupportFood)
    )
  ),
  new FoodExhausted(
    'civ2-city:city/food-exhausted/shrink',
    new Criterion(
      (cityGrowth: CityGrowth): boolean =>
        foodSupportedUnit(cityGrowth) === null
    ),
    new Effect((cityGrowth: CityGrowth): void => shrinkFromFamine(cityGrowth))
  ),
  new FoodExhausted(
    'civ2-city:city/food-exhausted/empty-food-store',
    new Effect((cityGrowth: CityGrowth): void => emptyFoodStore(cityGrowth))
  ),
];

export default getRules;
