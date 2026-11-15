import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import CityTileYield from '@civ-clone/core-city/Rules/CityTileYield';
import Yield from '@civ-clone/core-yield/Yield';
/**
 * The providers of the yields civ2-world's square rules add after the road (`Rules/Tile/yield-modifier`): the railroad,
 *  the government's penalty and bonus, and pollution. A city takes them out and works them out again in its own place
 *  in the order, after its buildings' and Wonders' steps.
 */
export declare const laterSquareSteps: string[];
/** What `yields` add up to of `YieldType`. */
export declare const totalOf: (
  yields: Yield[],
  YieldType: typeof Yield
) => number;
/**
 * civ2-city's steps of what a square gives the city working it, each at its place in OpenCiv2 `src/auto/city.cpp`
 *  `city_tile_yield` (richardpenman/civ2@49f26ec, from line 2796; `lib/tileYieldPipeline` has the whole order and
 *  which package registers each step). civ2-world's square rules give a square's own yields, through its road and on
 *  to its railroad, government and pollution steps, for a square worked by no city. For a city, the first rule here
 *  takes those last steps out again, the city's buildings and Wonders add theirs (civ2-city-improvement, civ2-wonder),
 *  and the rules here then run the railroad, government and pollution steps on the result.
 */
export declare const getRules: (
  tileImprovementRegistry?: TileImprovementRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  playerResearchRegistry?: PlayerResearchRegistry,
  pendingEffectRegistry?: PendingEffectRegistry
) => CityTileYield[];
export default getRules;
