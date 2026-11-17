import { atLevel, instanceOf, playedBy, sized } from './lib/stubs';
import { Game } from '@civ-clone/core-game';
import CityGrowth from '@civ-clone/core-city-growth/CityGrowth';
import CityGrowthRegistry from '@civ-clone/core-city-growth/CityGrowthRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import growthCost from '../Rules/City/growth-cost';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import InciteRevolt from '@civ-clone/base-unit-action-incite-revolt/InciteRevolt';
import Rule from '@civ-clone/core-rule/Rule';
import captured from '../Rules/City/captured';
import { expect } from 'chai';
import register from '../registerRules';

const byId = <T extends Rule<any, any>>(rules: T[], id: string): T =>
  rules.find((rule) => rule.id() === id)!;

describe('city:captured', (): void => {
  const founder = { name: 'founder' },
    captor = { name: 'captor' },
    shrinks = (size: number, by: unknown, cause: unknown): boolean =>
      byId(
        captured(undefined, sized(size)),
        'civ2-city:city/captured/shrink'
      ).validate(
        instanceOf(City, { originalPlayer: () => founder }),
        by,
        founder,
        cause
      );

  it('loses a citizen when conquered by another than its founder, even at size 1', (): void => {
    expect(shrinks(1, captor, null)).true;
    expect(shrinks(3, captor, null)).true;
  });

  it('loses one only when it has one to spare when incited, or retaken by its founder', (): void => {
    expect(shrinks(1, captor, instanceOf(InciteRevolt))).false;
    expect(shrinks(1, founder, null)).false;
    expect(shrinks(2, captor, instanceOf(InciteRevolt))).true;
    expect(shrinks(2, founder, null)).true;
  });

  it('keeps its build, resets its progress and stops Auto, whoever takes it', (): void => {
    const log: unknown[][] = [],
      cityBuild = {
        progress: () => ({
          set: (value: number) => log.push(['progress', value]),
        }),
        setAuto: (value: boolean) => log.push(['auto', value]),
        building: () => ({}),
        clearQueue: () => log.push(['clearQueue']),
        reprice: () => log.push(['reprice']),
      },
      rules = captured(undefined, sized(2), {
        getByCity: () => cityBuild,
      } as any);

    [
      'civ2-city:city/captured/reset-build-progress',
      'civ2-city:city/captured/stop-auto',
      'civ2-city:city/captured/keep-build',
    ].forEach((id) => byId(rules, id).process(instanceOf(City), captor));

    expect(log).eql([
      ['progress', 0],
      ['auto', false],
      ['clearQueue'],
      ['reprice'],
    ]);
  });
});

describe('city:captured growth cost', (): void => {
  it("costs the box at the new owner's rows, unless the city is gone", (): void => {
    const log: string[] = [],
      growth = { setCost: () => log.push('setCost'), size: () => 2 },
      rule = byId(
        captured(undefined, { getByCity: () => growth } as any),
        'civ2-city:city/captured/set-growth-cost'
      );

    rule.process(instanceOf(City, { destroyed: () => false }), {});
    rule.process(instanceOf(City, { destroyed: () => true }), {});

    expect(log).eql(['setCost']);
  });

  it("charges a computer player's rows once a person's city is taken", async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      cityGrowthRegistry = new CityGrowthRegistry(),
      person = { name: 'person' },
      computer = { name: 'computer' };

    let owner: unknown = person;

    ruleRegistry.register(
      ...growthCost(atLevel(5), playedBy(person)),
      ...captured(undefined, cityGrowthRegistry)
    );

    const city = instanceOf(City, {
        player: () => owner,
        destroyed: () => false,
        originalPlayer: () => person,
      }),
      growth = new CityGrowth(city, ruleRegistry);

    cityGrowthRegistry.register(growth);
    growth.grow();
    growth.setCost();

    expect(growth.cost().value()).equal(30);

    owner = computer;
    byId(
      captured(undefined, cityGrowthRegistry),
      'civ2-city:city/captured/set-growth-cost'
    ).process(city, computer);

    expect(growth.cost().value()).equal(24);
  });
});

describe('register', (): void => {
  it("registers only civ2-city's rules, each with an id, and Civilization II's specialists", (): void => {
    const game = new Game();

    register(game);

    const ids = game.rules.entries().map((rule) => rule.id());

    expect(ids).not.empty;
    ids.forEach((id) => expect(id).match(/^civ2-city:/));
    expect(new Set(ids).size).equal(ids.length);
    expect(game.availableSpecialists.entries().map((Type) => Type.name)).eql([
      'Entertainer',
      'TaxCollector',
      'Scientist',
    ]);
  });

  // library-diplomacy's declarations (`Vendetta`) are civ2-diplomacy's own, which the incite rules call.
  it('loads no civ1-* or library-* module but library-diplomacy', (): void => {
    expect(
      Object.keys(require.cache).filter(
        (path) =>
          /@civ-clone[\\/+](civ1|library)-/.test(path) &&
          !/@civ-clone[\\/+]library-diplomacy[@\\/]/.test(path)
      )
    ).eql([]);
  });
});
