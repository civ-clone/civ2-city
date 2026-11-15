import { AutoBuildInclude } from '@civ-clone/base-city-auto-build/lib/autoBuild';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
/**
 * Civ2's three ways a person can put a city on Auto (`city_window.cpp` ~4350: `CITYF_AUTOBUILD`, with
 *  `CITYF_AUTO_UNITS_ONLY` or `CITYF_AUTO_IMPROVEMENTS_ONLY`): anything, units only, or improvements only (Wonders
 *  among them).
 */
export type AutoMode = 'any' | 'units' | 'improvements';
export declare const autoModes: readonly AutoMode[];
/**
 * The pending effect that keeps a city's Auto mode, as Civ2's two flags: with `data.mode` `'units'` or `'improvements'`.
 *  Pending effects are saved, so the mode survives a save; a city on Auto with none is on `'any'`. Nothing discharges
 *  it, so it needs no handler.
 */
export declare const AUTO_MODE = 'civ2-city:auto-mode';
/** The city's Auto mode, or `null` while it isn't on Auto. */
export declare const autoModeOf: (
  cityBuild: CityBuild,
  pendingEffects?: PendingEffectRegistry
) => AutoMode | null;
/** Drops the city's Auto mode (`CITYF_AUTO_UNITS_ONLY | CITYF_AUTO_IMPROVEMENTS_ONLY`), leaving `'any'`. */
export declare const forgetAutoMode: (
  city: City,
  pendingEffects?: PendingEffectRegistry
) => void;
/** What a city on Auto in `mode` may choose: base-city-auto-build's `anything`, `unitsOnly` or `improvementsOnly`. */
export declare const includeFor: (mode: AutoMode | null) => AutoBuildInclude;
/**
 * Puts the city on Auto in `mode`, or takes it off with `null` (both flags go too, as `city_window.cpp` ~4294 clears
 *  them). As Civ2's change dialog does (`city_set_production(city, 99)` straight after setting the flags), it chooses
 *  at once, in place of what the city is building, when it finds anything (core-city-build's `ProductionChanged`
 *  rules apply to the change as to any other); with nothing it would choose, the build is left as it is. Returns
 *  whether it chose anything.
 */
export declare const setAutoMode: (
  cityBuild: CityBuild,
  mode: AutoMode | null,
  ruleRegistry?: RuleRegistry,
  pendingEffects?: PendingEffectRegistry
) => boolean;
export default autoModeOf;
