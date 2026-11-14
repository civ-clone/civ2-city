import {
  Anarchy,
  Communism,
  Democracy,
  Despotism,
  Fundamentalism,
  Monarchy,
  Republic,
} from '../Governments';
import {
  PopulationSupportFood,
  UnitSupportFood,
  UnitSupportProduction,
} from '../Yields';
import { SettleRole, AttackRole } from '@civ-clone/base-unit-role/Roles';
import {
  atLevel,
  governedBy,
  instanceOf,
  playedBy,
  sized,
  supporting,
} from './lib/stubs';
import { COMMUNISM } from '@civ-clone/civ2-rules/data/governments';
import City from '@civ-clone/core-city/City';
import Cost from '@civ-clone/core-city/Rules/Cost';
import CityGrowthCost from '@civ-clone/core-city-growth/Rules/Cost';
import Government from '@civ-clone/core-government/Government';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';
import cost from '../Rules/City/cost';
import { expect } from 'chai';
import growthCost from '../Rules/City/growth-cost';
import { join } from 'path';
import { readCosmic } from '@civ-clone/civ2-asset-extractor/rules';
import { readFileSync } from 'fs';
import tradeCorruption from '../lib/corruption';
import { unitRole } from '@civ-clone/base-unit-role/Rules/UnitRoles';

// Compares what the rules do with the player's own RULES.TXT's @COSMIC values, as the game clamps them. Skipped
//  unless `CIV2_PATH` names the game's folder, so CI, which has no copy of the game, never runs it. Only numbers are
//  compared, and a failure names the row, never the file's text.
const path = process.env.CIV2_PATH;

class Warrior extends Unit {}
class Settler extends Unit {}

(path ? describe : describe.skip)('RULES.TXT', (): void => {
  const { raw, effective } = readCosmic(
      path ? readFileSync(join(path, 'RULES.TXT'), 'latin1') : ''
    ),
    roles = new RuleRegistry(),
    city = instanceOf(City, { player: () => null }),
    costs = (
      Current: typeof Government,
      size: number,
      units: Unit[]
    ): Yield[] => {
      const registry = new RuleRegistry();

      registry.register(
        ...cost(sized(size), governedBy(Current), supporting(units), roles)
      );

      return registry.process(Cost, city, []).flat();
    },
    total = (yields: Yield[], Type: typeof Yield): number =>
      -yields
        .filter((cityYield) => cityYield instanceof Type)
        .reduce((sum, cityYield) => sum + cityYield.value(), 0),
    count = (yields: Yield[], Type: typeof Yield): number =>
      yields.filter((cityYield) => cityYield instanceof Type).length,
    units = (Type: typeof Unit, n: number): Unit[] =>
      new Array(n).fill(0).map(() => instanceOf(Type));

  roles.register(
    unitRole('test', Warrior, AttackRole),
    unitRole('test', Settler, SettleRole)
  );

  it('@COSMIC row 3: each citizen eats the food per citizen', (): void => {
    expect(
      total(costs(Despotism, 4, []), PopulationSupportFood) ===
        4 * effective.foodPerCitizen,
      'row 3'
    ).true;
  });

  it('@COSMIC row 4: the human grows a city on the food box rows', (): void => {
    const registry = new RuleRegistry(),
      player = {};

    registry.register(...growthCost(atLevel(5), playedBy(player)));

    const [box] = registry.process(CityGrowthCost, {
      city: () => ({ player: () => player }),
      size: () => 3,
    });

    expect(box === 4 * effective.foodBoxRows, 'row 4').true;
  });

  it('@COSMIC rows 6 and 7: units that settle eat the low figure up to Monarchy, the high one above', (): void => {
    [Anarchy, Despotism, Monarchy].forEach(
      (Current) =>
        expect(
          total(costs(Current, 1, units(Settler, 1)), UnitSupportFood) ===
            effective.settlerFoodLow,
          `row 6, ${Current.name}`
        ).true
    );
    [Communism, Fundamentalism, Republic, Democracy].forEach(
      (Current) =>
        expect(
          total(costs(Current, 1, units(Settler, 1)), UnitSupportFood) ===
            effective.settlerFoodHigh,
          `row 7, ${Current.name}`
        ).true
    );
  });

  it('@COSMIC rows 14 to 16: the free units under Monarchy, Communism and Fundamentalism', (): void => {
    (
      [
        [Monarchy, effective.monarchyFreeSupport, 14],
        [Communism, effective.communismFreeSupport, 15],
        [Fundamentalism, effective.fundamentalismFreeSupport, 16],
      ] as [typeof Government, number, number][]
    ).forEach(
      ([Current, free, row]) =>
        expect(
          count(
            costs(Current, 1, units(Warrior, 12)),
            UnitSupportProduction
          ) ===
            12 - free,
          `row ${row}`
        ).true
    );
  });

  it('@COSMIC row 17: Communism measures every city at the palace distance', (): void => {
    expect(
      tradeCorruption({
        amount: 100,
        government: COMMUNISM,
        distance: 25,
        human: false,
        level: 0,
        capital: false,
      }) === Math.trunc((effective.communismPalaceDistance * 300) / 140),
      'row 17'
    ).true;
  });

  it('the known clamps: rows 16 and 17 are used as the game clamps them, not as the file has them', (): void => {
    expect(
      raw.fundamentalismFreeSupport !== effective.fundamentalismFreeSupport,
      'row 16'
    ).true;
    expect(
      raw.communismPalaceDistance !== effective.communismPalaceDistance,
      'row 17'
    ).true;
  });
});
