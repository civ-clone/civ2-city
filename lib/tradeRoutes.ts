import { MapSize } from '@civ-clone/civ2-rules/lib/mapSize';

// The numbers of Civilization II's trade routes (OpenCiv2 `src/auto/city.cpp` and `unit.cpp`,
//  richardpenman/civ2@e39fe7b). Each takes plain numbers, so the rules in `Rules/City/trade-routes` and
//  `Rules/Unit/trade-route-established` only gather them. All the maths is the original's integer maths.

/** C's integer division, which rounds towards 0. */
const div = (a: number, b: number): number => Math.trunc(a / b);

/** How many routes a city holds (`city_add_trade_route`, `city.cpp:1246`: `trade_routes < 3`). */
export const tradeRoutesPerCity = 3;

/**
 * The goods a Caravan or Freight can carry, in the original's order (`CommoditySupply`, `src/data/state/city.h:223`),
 *  as keys: what each is called is the renderer's. The index is the original's commodity number, which the demand
 *  bonus reads. Food (a negative commodity) isn't carried here: there are no food caravans.
 */
export const goods = [
  'Hides',
  'Wool',
  'Beads',
  'Cloth',
  'Salt',
  'Coal',
  'Copper',
  'Dye',
  'Wine',
  'Silk',
  'Silver',
  'Spice',
  'Gems',
  'Gold',
  'Oil',
  'Uranium',
];

/** A route's link (`map_road_connection`): 0 none, 1 a road, 2 all railroad. */
export type RouteLink = 0 | 1 | 2;

export interface RouteIncomeInput {
  /** This city's trade after corruption, without its routes (`cities[city].base_trade`). */
  base: number;
  /** The partner's (`cities[city2].base_trade`). */
  partnerBase: number;
  /** The road link from this city to the partner. */
  link: RouteLink;
  /** Both cities have an Airport. */
  airports: boolean;
  /** This city has Superhighways (the partner's don't count). */
  superhighways: boolean;
  /** The partner is this city's owner's. */
  domestic: boolean;
}

/**
 * What a route gives its city each turn (`city_calc_trade_happiness`, `city.cpp:3670-3690`): (both base trades + 4)
 *  >> 3; the link, at least 1 when both cities have an Airport, and 1 more for this city's Superhighways, adds
 *  link × value / 2; halved for a domestic partner. (A food route, which gives 0, isn't made here.)
 */
export const routeIncome = ({
  base,
  partnerBase,
  link,
  airports,
  superhighways,
  domestic,
}: RouteIncomeInput): number => {
  let value = (base + partnerBase + 4) >> 3,
    bonus: number = link;

  if (airports && bonus < 2) {
    bonus = 1;
  }

  if (superhighways) {
    bonus++;
  }

  if (bonus !== 0) {
    value += (bonus * value) >> 1;
  }

  if (domestic) {
    value >>= 1;
  }

  return value;
};

export interface RouteWorthInput {
  /** The partner's trade after corruption, without its routes. */
  partnerBase: number;
  /** The road link from the holder to the partner. */
  link: RouteLink;
  /** Both cities have an Airport. */
  airports: boolean;
  /** The partner is the holder's owner's. */
  domestic: boolean;
}

/**
 * What a route a full city already holds is worth when a new one arrives (`city_add_trade_route`,
 *  `city.cpp:1258-1275`): the partner's base trade, plus link × value / 2 (an Airport in both makes the link at least
 *  1; Superhighways don't count here), halved for a domestic partner. The weakest is replaced when it's worth no more
 *  than the new partner's base trade, unadjusted.
 */
export const routeWorth = ({
  partnerBase,
  link,
  airports,
  domestic,
}: RouteWorthInput): number => {
  let value = partnerBase,
    bonus: number = link;

  if (airports && bonus < 2) {
    bonus = 1;
  }

  if (bonus !== 0) {
    value += (bonus * value) >> 1;
  }

  if (domestic) {
    value >>= 1;
  }

  return value;
};

/** The demand bonus for each of the goods (`unit_caravan_trade_revenue`, `unit.cpp:487-505`), from the revenue. */
export const demandBonus = (goodsIndex: number, revenue: number): number => {
  switch (goodsIndex) {
    case 3:
    case 5:
    case 8:
    case 10:
      return div(revenue, 2);

    case 9:
    case 11:
    case 12:
    case 13:
      return revenue;

    case 14:
      return div(revenue * 3, 2);

    case 15:
      return revenue * 2;
  }

  return 0;
};

export interface DeliveryBonusInput {
  /** `map_distance_diag` from the home city to the destination. */
  distance: number;
  mapSize: MapSize;
  /** The destination's and the home city's trade after corruption, without their routes. */
  destinationBase: number;
  homeBase: number;
  /** The two cities are on different land masses. */
  otherLandMass: boolean;
  /** The destination is the deliverer's own. */
  domestic: boolean;
  /** The unit is a Freight. */
  freight: boolean;
  /** The deliverer's road link from the destination to the home city. */
  link: RouteLink;
  /** Both cities have an Airport. */
  airports: boolean;
  /** Superhighways in the destination and in the home city. */
  destinationSuperhighways: boolean;
  homeSuperhighways: boolean;
  /** The goods carried (an index into `goods`). */
  goodsIndex: number;
  /** How many of the destination's three demands are for the goods (0 with goods cosmetic). */
  demanded: number;
  /** The game's turn. */
  turn: number;
  /** What the deliverer knows. */
  knowsInvention: boolean;
  knowsNavigation: boolean;
  knowsRailroad: boolean;
  knowsFlight: boolean;
  /** The deliverer's research cost (`civ_research_cost`). */
  researchCost: number;
  /** `crt_rand() % 10`, drawn once for the delivery. */
  roll: number;
}

/**
 * What a Caravan or Freight earns when it arrives (`unit_caravan_trade_revenue`, `unit.cpp:434-532`), in the
 *  original's order:
 *  1. the diagonal distance, × 4 / 5 on a large map and × 5 / 4 on a small one;
 *  2. (both base trades) × (distance + 10) / 24;
 *  3. doubled for another land mass, halved for an own city;
 *  4. Freight × 1.5;
 *  5. the link, + 1 for Airports in both on one land mass or + 2 across land masses, + 1 for Superhighways in each
 *     city: + link × value / 2;
 *  6. for each demand the destination has for the goods: the value × 2 + the bonus (`unit.cpp:510-518`). The code has
 *     a second branch, (value + the bonus) × 2, taken when the unit's owner isn't `civ`; but `civ` is the unit's owner
 *     (`unit_caravan_establish_trade`, `unit.cpp:690-691`), so that branch is never reached, and isn't here;
 *  7. doubled before turn 200 if the deliverer knows neither Invention nor Navigation;
 *  8. less a third for Railroad, and again for Flight;
 *  9. clamped to 0 and the research cost × 2 / 3, which is itself held between 200 + the roll and 30000.
 */
export const deliveryBonus = ({
  distance,
  mapSize,
  destinationBase,
  homeBase,
  otherLandMass,
  domestic,
  freight,
  link,
  airports,
  destinationSuperhighways,
  homeSuperhighways,
  goodsIndex,
  demanded,
  turn,
  knowsInvention,
  knowsNavigation,
  knowsRailroad,
  knowsFlight,
  researchCost,
  roll,
}: DeliveryBonusInput): number => {
  let measure = distance;

  if (mapSize === 'large') {
    measure = div(measure << 2, 5);
  }

  if (mapSize === 'small') {
    measure = div(measure * 5, 4);
  }

  let revenue = div((destinationBase + homeBase) * (measure + 10), 24);

  if (otherLandMass) {
    revenue <<= 1;
  }

  if (domestic) {
    revenue >>= 1;
  }

  if (freight) {
    revenue += revenue >> 1;
  }

  let bonus: number = link;

  if (airports) {
    bonus += otherLandMass ? 2 : 1;
  }

  if (destinationSuperhighways) {
    bonus++;
  }

  if (homeSuperhighways) {
    bonus++;
  }

  revenue += (bonus * revenue) >> 1;

  const demand = demandBonus(goodsIndex, revenue);

  for (let index = 0; index < demanded; index++) {
    revenue = revenue * 2 + demand;
  }

  if (turn < 200 && !knowsInvention && !knowsNavigation) {
    revenue <<= 1;
  }

  if (knowsRailroad) {
    revenue -= div(revenue, 3);
  }

  if (knowsFlight) {
    revenue -= div(revenue, 3);
  }

  const maximum = Math.min(
    Math.max(div(researchCost * 2, 3), 200 + roll),
    30000
  );

  return Math.min(Math.max(revenue, 0), maximum);
};
