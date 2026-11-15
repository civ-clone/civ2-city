import Production from '@civ-clone/base-terrain-yield-production/Production';
import { makeNegative } from '@civ-clone/core-yield/NegativeYield';

/**
 * The shields a city loses to waste (Civilization II's `shield_waste`, `lib/corruption`'s `shieldWaste`). Like
 *  `Corruption` from trade, it is a negative `Production`, so the city's production is net of it.
 */
export class Waste extends Production {}

makeNegative(Waste);

export default Waste;
