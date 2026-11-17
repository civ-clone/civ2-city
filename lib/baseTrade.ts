import {
  PendingEffect,
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';
import { Trade } from '../Yields';
import { baseTrade } from '@civ-clone/base-city-trade-route/lib/baseTrade';

/**
 * Civ2's `cities[city].base_trade`: a city's trade after corruption without its routes, kept from its last
 *  recalculation at turn time (`city_calc_trade_happiness`, `city.cpp:3667`, from `city_process_turn`'s
 *  `city_recalc`, `:4470`), and what other cities' routes and a Caravan's delivery read (`city.cpp:3672`,
 *  `unit.cpp:454`).
 *
 * Kept as a pending effect on the city (saved like any other, with the value as a string), written only by
 *  `storeBaseTrade`, which civ2-city's `ProcessYield` rule calls as the city's yields are processed at the start of its
 *  player's turn, and forgotten when the city is destroyed. Asking a city's yields never writes it, so nothing a client
 *  looks at, and no reload, changes what a route earns.
 *
 * A partner's change during a turn (its squares, specialists, government or rates) counts from its next processing,
 *  as in the original. A city never processed yet (just founded, or from a save made before this record) has its
 *  value worked out live when read, without keeping it.
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

/** The base trade kept for `city`, or `null` if none has been. */
export const storedBaseTrade = (
  city: City,
  {
    pendingEffectRegistry = pendingEffectRegistryInstance,
  }: BaseTradeDependencies = {}
): number | null => {
  const record = recordOf(city, pendingEffectRegistry);

  return record === null ? null : Number(record.data().value);
};

/** The base trade kept for `city`, or, with none kept yet, worked out now (and not kept). */
export const baseTradeOf = (
  city: City,
  dependencies: BaseTradeDependencies = {}
): number => storedBaseTrade(city, dependencies) ?? liveBaseTrade(city);

/** Works `city`'s base trade out now and keeps it: at the city's processing only. */
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
