import CapitalLink from './capitalLink';
import City from '@civ-clone/core-city/City';
/**
 * Each city's trade after corruption without its routes (`cities[city].base_trade`), as the original keeps it: stored
 *  when the city's own yields are worked out (`city_calc_trade_happiness`, `city.cpp:3667`), and read from there for
 *  the routes of other cities.
 *
 * - `fresh(city)` works the value out now (a full yield pipeline of the city's, its routes left out) and keeps it.
 *   The route income rule calls it for its own city each time that city's yields are asked for, and the delivery for
 *   both of its cities.
 * - `of(city)` is the value kept, or works it out (and keeps it) when there is none under the capital link's `key()`.
 *   The route income rule and the slot rule read partners with it.
 *
 * Everything kept is forgotten when the capital link's `key()` changes: each turn, and whenever a city is founded,
 *  captured or destroyed, a city improvement is built, a road or railroad is built, pillaged or removed, or terrain
 *  changes. Between those, a partner's value is the one from its last own recalculation in the turn (or the first
 *  read): a partner whose worked squares, specialists, government or rates change is seen by its partners once its
 *  own yields are worked out again, as in the original.
 */
export declare class BaseTrades {
  private _capitalLink;
  private _key;
  private _values;
  constructor(capitalLink: CapitalLink);
  private values;
  fresh(city: City): number;
  of(city: City): number;
}
export default BaseTrades;
