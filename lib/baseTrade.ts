import {
  PendingEffect,
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';
import Cost from '@civ-clone/core-city/Rules/Cost';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import YieldModifier from '@civ-clone/core-city/Rules/YieldModifier';
import YieldRule from '@civ-clone/core-city/Rules/Yield';
import { reduceYield } from '@civ-clone/core-yield/lib/reduceYields';
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

// A copy of a yield with its values and their providers, so a later rule that changes a yield in place changes the
//  copy, never the pipeline the copy was taken from.
const copyOf = (cityYield: Yield): Yield => {
  const copy = Object.assign(
    Object.create(Object.getPrototypeOf(cityYield)),
    cityYield
  );

  copy._values = (cityYield as any)._values.map(
    ([value, provider]: [number, string]) => [value, provider]
  );

  return copy;
};

/**
 * `city`'s trade after corruption without its routes, worked out from inside its own yield pipeline: `yields` is what
 *  the `YieldRule`s before `rule` (the route income rule) made, which a fresh pipeline would make again, so only what
 *  comes after it is run here, on a copy (every later `YieldRule` in order, then the `YieldModifier`s and `Cost`s, as
 *  `City#yields` runs them), and `rule` itself is left out. The original works `base_trade` out in the same
 *  recalculation (`city.cpp:3667`); this gives what `liveBaseTrade` gives without working the city's squares out again.
 */
export const continuedBaseTrade = (
  city: City,
  yields: Yield[],
  rule: YieldRule,
  ruleRegistry: RuleRegistry
): number => {
  const continued: Yield[] = yields.map(copyOf),
    push = (cityYields: Yield | Yield[] | void): void => {
      if (!cityYields) {
        return;
      }

      if (cityYields instanceof Yield) {
        continued.push(cityYields);

        return;
      }

      cityYields.forEach((cityYield: Yield) => continued.push(cityYield));
    },
    yieldRules = ruleRegistry.get(YieldRule),
    index = yieldRules.indexOf(rule);

  // Not one of the registry's rules (a test calling it directly): the whole pipeline, as before.
  if (index === -1) {
    return liveBaseTrade(city);
  }

  yieldRules.slice(index + 1).forEach((yieldRule: YieldRule): void => {
    if (yieldRule.validate(city, continued)) {
      push(yieldRule.process(city, continued));
    }
  });

  const base: Yield[] = [...continued];

  ruleRegistry.get(YieldModifier).forEach((modifier: YieldModifier): void => {
    if (modifier.validate(city, continued, base)) {
      push(modifier.process(city, continued, base));
    }
  });

  ruleRegistry.get(Cost).forEach((cost: Cost): void => {
    if (cost.validate(city, continued)) {
      push(cost.process(city, continued));
    }
  });

  return Math.max(reduceYield(continued, Trade), 0);
};

// The base trade worked out inside a city's yield pipeline, by the array `City#yields` returns, so the city's
//  processing, which is handed that array, keeps it without working it out again.
const pipelineBase = new WeakMap<Yield[], number>();

/** Notes `value` as the base trade of the pipeline whose yields are `yields`. */
export const notePipelineBaseTrade = (yields: Yield[], value: number): void => {
  pipelineBase.set(yields, value);
};

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

/**
 * Keeps `city`'s base trade: at the city's processing and its capture only. Given the yields its processing was handed
 *  (`cityYields`), the value is the one its route income rule worked out in that pipeline, or, if that rule didn't run
 *  (no routes), the pipeline's own trade, which is then the same; otherwise it is worked out now.
 */
export const storeBaseTrade = (
  city: City,
  {
    pendingEffectRegistry = pendingEffectRegistryInstance,
  }: BaseTradeDependencies = {},
  cityYields: Yield[] | null = null,
  hasRoutes: boolean = true
): number => {
  const value =
      cityYields === null
        ? liveBaseTrade(city)
        : pipelineBase.get(cityYields) ??
          (hasRoutes
            ? liveBaseTrade(city)
            : Math.max(reduceYield(cityYields, Trade), 0)),
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
