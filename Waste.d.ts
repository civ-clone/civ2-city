import Production from '@civ-clone/base-terrain-yield-production/Production';
/**
 * The shields a city loses to waste (Civilization II's `shield_waste`, `lib/corruption`'s `shieldWaste`). Like
 *  `Corruption` from trade, it is a negative `Production`, so the city's production is net of it.
 */
export declare class Waste extends Production {}
export default Waste;
