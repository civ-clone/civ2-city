import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';
/**
 * Civ2's `cities[city].base_trade`: a city's trade after corruption without its routes (`city_calc_trade_happiness`,
 *  `city.cpp:3667`), which other cities' routes and a Caravan's delivery read (`city.cpp:3672`, `unit.cpp:454`).
 *
 * Kept as a pending effect on the city (saved like any other, with the value as a string), written only by
 *  `storeBaseTrade`, which civ2-city calls at two points: as the city's yields are processed at the start of its
 *  player's turn (`ProcessYield`, as `city_process_turn`'s `city_recalc`, `:4470`), and when it is captured
 *  (`Captured`), so its new owner's corruption counts at once. It is forgotten when the city is destroyed.
 *
 * **A deviation, on purpose:** the original rewrites `base_trade` on every `city_recalc`, which includes opening a
 *  city's window and many moves of units. Here asking a city's yields never writes it, so nothing a client looks at,
 *  and no reload, changes what a route earns. A partner's change during a turn (its squares, specialists, government
 *  or rates) therefore counts from its next processing, where the original may count it sooner. A city never
 *  processed yet (just founded, or from a save made before this record) has its value worked out live when read,
 *  without keeping it; so does a kept value that isn't a finite number.
 */
export declare const BASE_TRADE = 'civ2-city:base-trade';
export interface BaseTradeDependencies {
  pendingEffectRegistry?: PendingEffectRegistry;
}
/** `city`'s trade after corruption without its routes, worked out now. */
export declare const liveBaseTrade: (city: City) => number;
/** The base trade kept for `city`, or `null` if none has been (or what was kept isn't a finite number). */
export declare const storedBaseTrade: (
  city: City,
  { pendingEffectRegistry }?: BaseTradeDependencies
) => number | null;
/** The base trade kept for `city`, or, with none kept yet, worked out now (and not kept). */
export declare const baseTradeOf: (
  city: City,
  dependencies?: BaseTradeDependencies
) => number;
/** Works `city`'s base trade out now and keeps it: at the city's processing and its capture only. */
export declare const storeBaseTrade: (
  city: City,
  { pendingEffectRegistry }?: BaseTradeDependencies
) => number;
/** Forgets `city`'s base trade, when the city is gone. */
export declare const forgetBaseTrade: (
  city: City,
  { pendingEffectRegistry }?: BaseTradeDependencies
) => void;
