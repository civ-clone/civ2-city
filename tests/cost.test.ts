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
  AttackRole,
  DiplomacyRole,
  SettleRole,
  TradeRole,
} from '@civ-clone/base-unit-role/Roles';
import {
  PopulationSupportFood,
  UnitSupportFood,
  UnitSupportProduction,
} from '../Yields';
import { governedBy, instanceOf, sized, supporting } from './lib/stubs';
import City from '@civ-clone/core-city/City';
import Cost from '@civ-clone/core-city/Rules/Cost';
import Fanatic from '@civ-clone/base-unit-fanatic/Fanatic';
import Government from '@civ-clone/core-government/Government';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';
import cost from '../Rules/City/cost';
import { expect } from 'chai';
import { unitRole } from '@civ-clone/base-unit-role/Rules/UnitRoles';

class Warrior extends Unit {}
class Settler extends Unit {}
class Envoy extends Unit {}
class Trader extends Unit {}

describe('city:cost', (): void => {
  const ruleRegistry = new RuleRegistry();

  ruleRegistry.register(
    unitRole('test', Warrior, AttackRole),
    unitRole('test', Settler, SettleRole),
    unitRole('test', Envoy, DiplomacyRole),
    unitRole('test', Trader, TradeRole),
    unitRole('test', Fanatic, AttackRole)
  );

  const city = instanceOf(City, { player: () => null }),
    costs = (
      Current: typeof Government | null,
      size: number,
      units: Unit[]
    ): Yield[] => {
      const registry = new RuleRegistry();

      registry.register(
        ...cost(
          sized(size),
          governedBy(Current),
          supporting(units),
          ruleRegistry
        )
      );

      return registry.process(Cost, city, []).flat();
    },
    // What each costs: a cost is a yield taken away, so its value is negative.
    of = (yields: Yield[], Type: typeof Yield): number[] =>
      yields
        .filter((cityYield) => cityYield instanceof Type)
        .map((cityYield) => -cityYield.value()),
    units = (Type: typeof Unit, count: number): Unit[] =>
      new Array(count).fill(0).map(() => instanceOf(Type));

  it("feeds @COSMIC's 2 food to each citizen", (): void => {
    expect(of(costs(Despotism, 5, []), PopulationSupportFood)).eql([10]);
  });

  it('feeds 1 food to each unit that settles up to Monarchy, and 2 above', (): void => {
    [Anarchy, Despotism, Monarchy].forEach((Current) =>
      expect(
        of(costs(Current, 3, units(Settler, 2)), UnitSupportFood),
        Current.name
      ).eql([1, 1])
    );
    [Communism, Fundamentalism, Republic, Democracy].forEach((Current) =>
      expect(
        of(costs(Current, 3, units(Settler, 2)), UnitSupportFood),
        Current.name
      ).eql([2, 2])
    );
    expect(of(costs(Despotism, 3, units(Warrior, 2)), UnitSupportFood)).eql([]);
  });

  it('supports as many units as the city has citizens free under Anarchy and Despotism', (): void => {
    [Anarchy, Despotism].forEach((Current) => {
      expect(
        of(costs(Current, 3, units(Warrior, 3)), UnitSupportProduction)
      ).eql([]);
      expect(
        of(costs(Current, 3, units(Warrior, 5)), UnitSupportProduction)
      ).eql([1, 1]);
    });
  });

  it("supports @COSMIC's 3 free under Monarchy and Communism, 8 under Fundamentalism, and none under the Republic and Democracy", (): void => {
    (
      [
        [Monarchy, 3],
        [Communism, 3],
        [Fundamentalism, 8],
        [Republic, 0],
        [Democracy, 0],
      ] as [typeof Government, number][]
    ).forEach(([Current, free]) =>
      expect(
        of(costs(Current, 1, units(Warrior, 10)), UnitSupportProduction),
        Current.name
      ).length(10 - free)
    );
  });

  it('never charges for, or counts, units that carry out diplomacy or trade', (): void => {
    expect(
      of(
        costs(Republic, 1, [
          ...units(Envoy, 2),
          ...units(Trader, 2),
          ...units(Warrior, 1),
        ]),
        UnitSupportProduction
      )
    ).eql([1]);
    expect(
      of(
        costs(Monarchy, 1, [...units(Envoy, 5), ...units(Warrior, 3)]),
        UnitSupportProduction
      )
    ).eql([]);
  });

  it('counts a Fanatic against the free units under Fundamentalism, but never charges for it', (): void => {
    const fanatics = units(Fanatic, 8),
      warriors = units(Warrior, 2),
      charged = costs(Fundamentalism, 1, [...fanatics, ...warriors]).filter(
        (cityYield) => cityYield instanceof UnitSupportProduction
      ) as UnitSupportProduction[];

    expect(charged.map((support) => support.unit())).eql(warriors);
    expect(
      of(costs(Republic, 1, units(Fanatic, 2)), UnitSupportProduction)
    ).eql([1, 1]);
  });

  it('treats a player with no government as under Despotism', (): void => {
    expect(of(costs(null, 2, units(Warrior, 3)), UnitSupportProduction)).eql([
      1,
    ]);
  });
});
