import { atLevel, instanceOf, playedBy, sized } from './lib/stubs';
import { Game } from '@civ-clone/core-game';
import Attack from '@civ-clone/base-unit-action-attack/Attack';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import InciteRevolt from '@civ-clone/base-unit-action-incite-revolt/InciteRevolt';
import Rule from '@civ-clone/core-rule/Rule';
import captured from '../Rules/City/captured';
import defeated from '../Rules/Unit/defeated';
import { expect } from 'chai';
import register from '../index';

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

describe('unit:defeated', (): void => {
  const human = { name: 'human' },
    computer = { name: 'computer' },
    tile = {},
    shrinks = (level: number, player: unknown): boolean =>
      byId(
        defeated(
          { getByTile: () => ({}) } as any,
          undefined,
          undefined,
          atLevel(level),
          playedBy(human)
        ),
        'civ2-city:unit/defeated/shrink-defended-city'
      ).validate(
        { tile: () => tile, player: () => player },
        {},
        instanceOf(Attack, { to: () => tile })
      );

  it("shrinks the city of a defender that loses, but not a person's city on Chieftain", (): void => {
    expect(shrinks(0, human)).false;
    expect(shrinks(0, computer)).true;
    expect(shrinks(1, human)).true;
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

  it('loads no civ1-* or library-* module', (): void => {
    expect(
      Object.keys(require.cache).filter((path) =>
        /@civ-clone[\\/+](civ1|library)-/.test(path)
      )
    ).eql([]);
  });
});
