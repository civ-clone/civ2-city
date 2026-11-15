import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import SpecialistAvailable from '@civ-clone/base-city-lifecycle/Rules/SpecialistAvailable';
/** The size below which a city's specialists can only be Entertainers. */
export declare const specialistSize = 5;
export declare const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry
) => SpecialistAvailable[];
export default getRules;
