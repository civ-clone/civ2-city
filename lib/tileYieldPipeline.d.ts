import Priority from '@civ-clone/core-rule/Priority';
/**
 * The order of the steps of a square's yields for the city working it: one `CityTileYield` priority per step of
 *  OpenCiv2 `src/auto/city.cpp` `city_tile_yield` (richardpenman/civ2@49f26ec, from line 2796), in that function's
 *  order. Every civ2-* package that changes what a square gives a city registers its `CityTileYield` rule at its step's
 *  priority, so the rules run in the original's order whichever package loaded first. The steps are 100 apart; no two
 *  packages share one.
 *
 * - `square` (2826–2829 the terrain or special; 2850 irrigation; 2862–2865 mine; 2870 Grassland's shield; 2879 river;
 *   2882–2888 road): civ2-world's own square rules. civ2-city's rule at this step removes the yields civ2-world's later
 *   square rules added (railroad, government and pollution), so that every step after it sees the square's yields up
 *   to its road, and those steps run again below, in the city's place in the order.
 * - `harbour` (2835): +1 food on ocean (civ2-city-improvement).
 * - `offshorePlatform` (2838): +1 shield on ocean (civ2-city-improvement).
 * - `colossusOcean` (2841): +1 trade on ocean, whatever the trade (civ2-wonder).
 * - `supermarket` (2851–2858): +50% food, rounded down, on farmland or the city's own square (civ2-city-improvement).
 * - `centreMine` (2863–2865): the city's own square counts as mined where its terrain has no irrigation bonus
 *   (civ2-city).
 * - `centreMinimum` (2873–2875): the city's own square gives at least 1 shield (civ2-city).
 * - `colossusLand` (2890–2892): +1 trade on land that already has some (civ2-wonder).
 * - `kingRichards` (2894–2896): +1 shield on every square (civ2-wonder).
 * - `railroad` (2897–2907): +50% shields, rounded down, with a railroad, or on the city's own square once its player
 *   knows Railroad (civ2-city).
 * - `governmentPenalty` (2909–2917): below Monarchy, a yield over 2 loses 1, unless the city celebrates (civ2-city).
 * - `tradeBonus` (2918–2925): +1 to any trade under the Republic and Democracy, or from Monarchy up while the city
 *   celebrates (civ2-city).
 * - `superhighways` (2926–2929): +50% trade, rounded down, on a road or the city's square (civ2-city-improvement).
 * - `pollution` (2930–2936): halves each yield, rounded up (civ2-city).
 * - `floor` (2937–2939): nothing below 0 (civ2-city).
 */
export declare const tileYieldSteps: {
  readonly square: 100;
  readonly harbour: 200;
  readonly offshorePlatform: 300;
  readonly colossusOcean: 400;
  readonly supermarket: 500;
  readonly centreMine: 600;
  readonly centreMinimum: 700;
  readonly colossusLand: 800;
  readonly kingRichards: 900;
  readonly railroad: 1000;
  readonly governmentPenalty: 1100;
  readonly tradeBonus: 1200;
  readonly superhighways: 1300;
  readonly pollution: 1400;
  readonly floor: 1500;
};
export type TileYieldStep = keyof typeof tileYieldSteps;
/** The `Priority` for a `CityTileYield` rule at `step`. */
export declare const tileYieldPriority: (step: TileYieldStep) => Priority;
export default tileYieldPriority;
