import { CORRUPTION_HALVED_BY, corruption } from '../lib/corruption';
import { Corruption, Gold, Production, Waste } from '../Yields';
import Capitalization from '@civ-clone/base-city-improvement-capitalization/Capitalization';
import Courthouse from '@civ-clone/base-city-improvement-courthouse/Courthouse';
import { EffectDescription } from '@civ-clone/core-rule/Description';
import { MONARCHY } from '@civ-clone/civ2-rules/data/governments';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import Rule from '@civ-clone/core-rule/Rule';
import cityCorruption from '../Rules/City/corruption';
import { expect } from 'chai';
import processYield from '../Rules/City/process-yield';

// What the Palace, the Courthouse and Capitalization say they do here, for the Civilopedia
//  (civ-clone/web-renderer#1196), checked against what the rules do. The Courthouse's halving of trade corruption, and
//  every other building, are civ2-city-improvement's.

const describedBy = (rules: Rule[]): [string | null, EffectDescription][] =>
  rules.flatMap((rule) =>
    rule
      .descriptions()
      .map((description): [string | null, EffectDescription] => [
        rule.id(),
        description,
      ])
  );

describe('descriptions', (): void => {
  it('the Palace measures corruption and waste, and a Courthouse cuts waste by the share it says', (): void => {
    expect(describedBy(cityCorruption())).to.eql([
      [
        'civ2-city:city/yield/corruption',
        { type: 'capital', subject: Palace, yield: Corruption },
      ],
      [
        'civ2-city:city/cost/waste',
        { type: 'capital', subject: Palace, yield: Waste },
      ],
      [
        'civ2-city:city/cost/waste',
        {
          type: 'yield_percent',
          subject: Courthouse,
          yield: Waste,
          value: -0.5,
          of: 'total',
        },
      ],
    ]);

    const [, , [, courthouse]] = describedBy(cityCorruption());

    // Every amount and distance, with and without a Courthouse: the share described, rounded down.
    for (let amount = 0; amount <= 40; amount++) {
      for (let distance = 0; distance <= 32; distance += 4) {
        const input = {
            amount,
            government: MONARCHY,
            distance,
            human: false,
            level: 0,
            capital: false,
          },
          without = corruption(input);

        expect(corruption({ ...input, courthouse: true })).to.equal(
          Math.floor(without * (1 + (courthouse.value as number)))
        );
        // The original's `>> 1`.
        expect(corruption({ ...input, courthouse: true })).to.equal(
          without >> 1
        );
      }
    }

    expect(CORRUPTION_HALVED_BY).to.equal(2);
  });

  it("Capitalization turns the city's shields into gold, said by the production rule that pays it out", (): void => {
    expect(describedBy(processYield())).to.eql([
      [
        'civ2-city:city/process-yield/production',
        {
          type: 'converts',
          subject: Capitalization,
          yield: Production,
          into: Gold,
        },
      ],
    ]);
  });
});
