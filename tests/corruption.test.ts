import {
  ANARCHY,
  COMMUNISM,
  DEMOCRACY,
  DESPOTISM,
  FUNDAMENTALISM,
  MONARCHY,
  REPUBLIC,
} from '@civ-clone/civ2-rules/data/governments';
import { CorruptionInput, tradeCorruption } from '../lib/corruption';
import { corruptionDivisor } from '../data/cityRules';
import { expect } from 'chai';
import governmentIndex from '@civ-clone/civ2-rules/lib/governmentIndex';
import { governments } from '../Governments';

describe('tradeCorruption', (): void => {
  const corruption = (input: Partial<CorruptionInput>): number =>
    tradeCorruption({
      amount: 20,
      government: MONARCHY,
      distance: 10,
      human: false,
      level: 0,
      capital: false,
      ...input,
    });

  it('is distance × trade × 3 / (divisor × 20), the divisor rising with the government', (): void => {
    (
      [
        [ANARCHY, 4, 7],
        [DESPOTISM, 5, 6],
        [MONARCHY, 6, 5],
        [REPUBLIC, 8, 3],
      ] as [number, number, number][]
    ).forEach(([government, divisor, expected]) => {
      expect(Math.trunc((10 * 20 * 3) / (divisor * 20))).equal(expected);
      expect(corruption({ government }), String(government)).equal(expected);
    });
  });

  it('measures every city 1 away under Communism, and takes none under Fundamentalism and Democracy', (): void => {
    expect(corruption({ government: COMMUNISM, amount: 100 })).equal(2);
    expect(
      corruption({ government: COMMUNISM, distance: null, amount: 100 })
    ).equal(2);
    expect(corruption({ government: FUNDAMENTALISM })).equal(0);
    expect(corruption({ government: DEMOCRACY })).equal(0);
  });

  it('counts 32 with no Palace, and never takes more than the trade', (): void => {
    expect(corruption({ distance: null, amount: 10 })).equal(8);
    expect(
      corruption({ government: ANARCHY, distance: null, amount: 3 })
    ).equal(3);
    expect(corruption({ amount: 0 })).equal(0);
  });

  it('counts no distance for more than 32', (): void => {
    expect(corruption({ distance: 40, amount: 100 })).equal(80);
  });

  it("adds the level to a person's distance under Anarchy and Despotism only, up to 32", (): void => {
    expect(corruption({ government: DESPOTISM, human: true, level: 3 })).equal(
      Math.trunc((13 * 20 * 3) / 100)
    );
    expect(corruption({ government: DESPOTISM, human: false, level: 3 })).equal(
      6
    );
    expect(corruption({ government: MONARCHY, human: true, level: 3 })).equal(
      5
    );
    expect(
      corruption({
        government: DESPOTISM,
        human: true,
        level: 5,
        distance: 30,
        amount: 100,
      })
    ).equal(Math.trunc((32 * 100 * 3) / 100));
    expect(
      corruption({ government: DESPOTISM, human: true, level: 5, distance: 0 })
    ).equal(0);
  });

  it('has the divisors city_corruption_divisor counts up: 4, +1 past Anarchy, Despotism, Monarchy and Fundamentalism', (): void => {
    const divisor = (government: number): number =>
      4 +
      [ANARCHY, DESPOTISM, MONARCHY, FUNDAMENTALISM].filter(
        (step) => government > step
      ).length;

    expect(corruptionDivisor).eql([0, 1, 2, 3, 4, 5, 6].map(divisor));
  });

  it("halves it in the Palace's city", (): void => {
    expect(
      corruption({ government: COMMUNISM, amount: 100, capital: true })
    ).equal(1);
  });
});

describe('Governments', (): void => {
  it("are in Civilization II's order", (): void => {
    expect(governments.map(governmentIndex)).eql([0, 1, 2, 3, 4, 5, 6]);
  });
});
