import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import City from '@civ-clone/core-city/City';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import { Entertainer } from '../../Specialists';
import Specialist from '@civ-clone/core-city/Specialist';
import SpecialistAvailable from '@civ-clone/base-city-lifecycle/Rules/SpecialistAvailable';

/** The size below which a city's specialists can only be Entertainers. */
export const specialistSize = 5;

// A city below size 5 may only have Entertainers (OpenCiv2 `src/auto/city_window.cpp` ~432, richardpenman/civ2@49f26ec:
//  clicking a specialist in such a city makes it an Entertainer, or refuses if it is one). The game itself only makes
//  new specialists Entertainers (`city.cpp` `city_fill_specialists`), and a city that shrinks below 5 keeps the kinds it
//  has, so this only stops a change.
export const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry
) => SpecialistAvailable[] = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance
): SpecialistAvailable[] => [
  new SpecialistAvailable(
    'civ2-city:city/specialist-available/entertainers-below-5',
    new Criterion(
      (city: City, SpecialistType: typeof Specialist): boolean =>
        SpecialistType !== Entertainer
    ),
    new Effect(
      (city: City): boolean =>
        cityGrowthRegistry.getByCity(city).size() >= specialistSize
    )
  ),
];

export default getRules;
