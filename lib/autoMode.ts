import {
  AutoBuildInclude,
  anything,
  improvementsOnly,
  unitsOnly,
} from '@civ-clone/base-city-auto-build/lib/autoBuild';
import {
  PendingEffect,
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import rankBuildItems from '@civ-clone/core-city-build/lib/rankBuildItems';

/**
 * Civ2's three ways a person can put a city on Auto (`city_window.cpp` ~4350: `CITYF_AUTOBUILD`, with
 *  `CITYF_AUTO_UNITS_ONLY` or `CITYF_AUTO_IMPROVEMENTS_ONLY`): anything, units only, or improvements only (Wonders
 *  among them).
 */
export type AutoMode = 'any' | 'units' | 'improvements';

export const autoModes: readonly AutoMode[] = ['any', 'units', 'improvements'];

/**
 * The pending effect that keeps a city's Auto mode, as Civ2's two flags: with `data.mode` `'units'` or `'improvements'`.
 *  Pending effects are saved, so the mode survives a save; a city on Auto with none is on `'any'`. Nothing discharges
 *  it, so it needs no handler.
 */
export const AUTO_MODE = 'civ2-city:auto-mode';

const modeEffect = (
  city: City,
  pendingEffects: PendingEffectRegistry
): PendingEffect | null =>
  pendingEffects
    .getByTarget(city)
    .find((effect: PendingEffect): boolean => effect.handler() === AUTO_MODE) ??
  null;

/** The city's Auto mode, or `null` while it isn't on Auto. */
export const autoModeOf = (
  cityBuild: CityBuild,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): AutoMode | null => {
  if (!cityBuild.auto()) {
    return null;
  }

  const mode = modeEffect(cityBuild.city(), pendingEffects)?.data().mode;

  return mode === 'units' || mode === 'improvements' ? mode : 'any';
};

/** Drops the city's Auto mode (`CITYF_AUTO_UNITS_ONLY | CITYF_AUTO_IMPROVEMENTS_ONLY`), leaving `'any'`. */
export const forgetAutoMode = (
  city: City,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): void => {
  const effect = modeEffect(city, pendingEffects);

  if (effect !== null) {
    pendingEffects.unregister(effect);
  }
};

/** What a city on Auto in `mode` may choose: base-city-auto-build's `anything`, `unitsOnly` or `improvementsOnly`. */
export const includeFor = (mode: AutoMode | null): AutoBuildInclude =>
  mode === 'units'
    ? unitsOnly
    : mode === 'improvements'
    ? improvementsOnly
    : anything;

/**
 * Puts the city on Auto in `mode`, or takes it off with `null` (both flags go too, as `city_window.cpp` ~4294 clears
 *  them). As Civ2's change dialog does (`city_set_production(city, 99)` straight after setting the flags), it chooses
 *  at once, in place of what the city is building, when it finds anything (core-city-build's `ProductionChanged`
 *  rules apply to the change as to any other); with nothing it would choose, the build is left as it is. Returns
 *  whether it chose anything.
 */
export const setAutoMode = (
  cityBuild: CityBuild,
  mode: AutoMode | null,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): boolean => {
  const city = cityBuild.city();

  forgetAutoMode(city, pendingEffects);

  if (mode === null) {
    cityBuild.setAuto(false);

    return false;
  }

  if (mode !== 'any') {
    pendingEffects.register(new PendingEffect(AUTO_MODE, city, { mode }));
  }

  cityBuild.setAuto(true);

  const [best] = rankBuildItems(cityBuild, ruleRegistry, includeFor(mode));

  if (!best) {
    return false;
  }

  if (cityBuild.building()?.item() !== best.buildItem.item()) {
    cityBuild.build(best.buildItem.item());
  }

  return true;
};

export default autoModeOf;
