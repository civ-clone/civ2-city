import {
  PendingEffect,
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';
import { Trade } from '../Yields';
import { baseTrade } from '@civ-clone/base-city-trade-route/lib/baseTrade';

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
export const BASE_TRADE = 'civ2-city:base-trade';

export interface BaseTradeDependencies {
  pendingEffectRegistry?: PendingEffectRegistry;
}

const recordOf = (
  city: City,
  pendingEffectRegistry: PendingEffectRegistry
): PendingEffect | null =>
  pendingEffectRegistry
    .getByTarget(city)
    .find(
      (effect: PendingEffect): boolean => effect.handler() === BASE_TRADE
    ) ?? null;

/** `city`'s trade after corruption without its routes, worked out now. */
export const liveBaseTrade = (city: City): number => baseTrade(city, Trade);

/** The base trade kept for `city`, or `null` if none has been (or what was kept isn't a finite number). */
export const storedBaseTrade = (
  city: City,
  {
    pendingEffectRegistry = pendingEffectRegistryInstance,
  }: BaseTradeDependencies = {}
): number | null => {
  const record = recordOf(city, pendingEffectRegistry);

  if (record === null) {
    return null;
  }

  const value = Number(record.data().value);

  return Number.isFinite(value) ? value : null;
};

/** The base trade kept for `city`, or, with none kept yet, worked out now (and not kept). */
export const baseTradeOf = (
  city: City,
  dependencies: BaseTradeDependencies = {}
): number => storedBaseTrade(city, dependencies) ?? liveBaseTrade(city);

/** Works `city`'s base trade out now and keeps it: at the city's processing and its capture only. */
export const storeBaseTrade = (
  city: City,
  {
    pendingEffectRegistry = pendingEffectRegistryInstance,
  }: BaseTradeDependencies = {}
): number => {
  const value = liveBaseTrade(city),
    record = recordOf(city, pendingEffectRegistry);

  if (record === null) {
    pendingEffectRegistry.register(
      new PendingEffect(BASE_TRADE, city, { value: String(value) })
    );
  } else {
    record.setData({ value: String(value) });
  }

  return value;
};

/** Forgets `city`'s base trade, when the city is gone. */
export const forgetBaseTrade = (
  city: City,
  {
    pendingEffectRegistry = pendingEffectRegistryInstance,
  }: BaseTradeDependencies = {}
): void => {
  const record = recordOf(city, pendingEffectRegistry);

  if (record !== null) {
    pendingEffectRegistry.unregister(record);
  }
};
