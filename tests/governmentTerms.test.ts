import {
  Anarchy,
  Communism,
  Democracy,
  Despotism,
  Fundamentalism,
  Monarchy,
  Republic,
} from '../Governments';
import Government from '@civ-clone/core-government/Government';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import { expect } from 'chai';
import getRules from '../Rules/Government/terms';
import { governmentTerms } from '@civ-clone/base-government-terms/lib/terms';

describe('government terms', (): void => {
  const rules = new RuleRegistry();

  rules.register(...getRules());

  const termsOf = (GovernmentType: typeof Government) =>
    governmentTerms(rules, GovernmentType)!;

  it('takes 1 off a yield over 2 below Monarchy, and adds 1 to trade from the Republic', (): void => {
    expect(termsOf(Anarchy).tilePenalty).eql({ threshold: 2, amount: 1 });
    expect(termsOf(Despotism).tilePenalty).eql({ threshold: 2, amount: 1 });
    [Monarchy, Communism, Fundamentalism, Republic, Democracy].forEach(
      (GovernmentType) => expect(termsOf(GovernmentType).tilePenalty).null
    );
    expect(
      [Despotism, Monarchy, Fundamentalism, Republic, Democracy].map(
        (GovernmentType) => termsOf(GovernmentType).tradeBonus
      )
    ).eql([0, 0, 0, 1, 1]);
  });

  it("loses distance × 3 / (divisor × 20) of the trade to corruption, Communism's at a fixed distance, none under Fundamentalism and Democracy", (): void => {
    expect(termsOf(Despotism).corruption).eql({
      perDistance: 3 / 100,
      fixedDistance: null,
    });
    expect(termsOf(Republic).corruption!.perDistance).equal(3 / 160);
    expect(termsOf(Democracy).corruption!.perDistance).equal(0);
    expect(termsOf(Fundamentalism).corruption!.perDistance).equal(0);
    expect(termsOf(Communism).corruption!.fixedDistance).a('number');
  });

  it("answers nothing for a government that isn't Civ2's", (): void => {
    class Other extends Government {}

    expect(governmentTerms(rules, Other)).null;
  });
});
