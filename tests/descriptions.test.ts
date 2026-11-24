import { CORRUPTION_HALVED_BY, corruption } from '../lib/corruption';
import { Corruption, Gold, Production, Waste } from '../Yields';
import {
  AIRPORT_ROUTE_LINK,
  RouteIncomeInput,
  RouteLink,
  SUPERHIGHWAYS_ROUTE_LINK,
  routeIncome,
  routeWorth,
} from '../lib/tradeRoutes';
import Airport from '@civ-clone/base-city-improvement-airport/Airport';
import CapitalLink from '../lib/capitalLink';
import Capitalization from '@civ-clone/base-city-improvement-capitalization/Capitalization';
import Courthouse from '@civ-clone/base-city-improvement-courthouse/Courthouse';
import { EffectDescription } from '@civ-clone/core-rule/Description';
import { MONARCHY } from '@civ-clone/civ2-rules/data/governments';
import Palace from '@civ-clone/base-city-improvement-palace/Palace';
import Rule from '@civ-clone/core-rule/Rule';
import Superhighways from '@civ-clone/base-city-improvement-superhighways/Superhighways';
import cityCorruption from '../Rules/City/corruption';
import { expect } from 'chai';
import processYield from '../Rules/City/process-yield';
import Pollution from '@civ-clone/base-tile-improvement-pollution/Pollution';
import { Food, Trade } from '../Yields';
import tileYield from '../Rules/City/tile-yield';
import tradeRoutes from '../Rules/City/trade-routes';

// What the Palace, the Courthouse, Capitalization, the Airport and Superhighways say they do here, for the Civilopedia
//  (civ-clone/web-renderer#1196, #1291), checked against what the rules do. The Courthouse's halving of trade
//  corruption, and every other building, are civ2-city-improvement's.

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

  it("the Airport and Superhighways strengthen a route's link as they say, in the income rule", (): void => {
    expect(describedBy(tradeRoutes({ capitalLink: {} as CapitalLink }))).to.eql(
      [
        [
          'civ2-city:city/yield/trade-routes',
          {
            type: 'trade_route_link',
            subject: Airport,
            value: 1,
            both: 'both',
          },
        ],
        [
          'civ2-city:city/yield/trade-routes',
          {
            type: 'trade_route_link',
            subject: Superhighways,
            value: 1,
            both: 'own',
          },
        ],
      ]
    );

    const [[, airport], [, superhighways]] = describedBy(
      tradeRoutes({ capitalLink: {} as CapitalLink })
    );

    expect(airport.value).to.equal(AIRPORT_ROUTE_LINK);
    expect(superhighways.value).to.equal(SUPERHIGHWAYS_ROUTE_LINK);

    for (let base = 0; base <= 40; base += 3) {
      for (let partnerBase = 0; partnerBase <= 40; partnerBase += 5) {
        for (const link of [0, 1, 2] as RouteLink[]) {
          for (const domestic of [false, true]) {
            const input: RouteIncomeInput = {
                base,
                partnerBase,
                link,
                airports: false,
                superhighways: false,
                domestic,
              },
              atLeast = Math.max(link, airport.value as number) as RouteLink;

            // An Airport in both: the link counts as at least the value described.
            expect(routeIncome({ ...input, airports: true })).to.equal(
              routeIncome({ ...input, link: atLeast })
            );
            expect(
              routeWorth({ partnerBase, link, airports: true, domestic })
            ).to.equal(
              routeWorth({
                partnerBase,
                link: atLeast,
                airports: false,
                domestic,
              })
            );

            // This city's Superhighways: the value described more.
            expect(routeIncome({ ...input, superhighways: true })).to.equal(
              routeIncome({
                ...input,
                link: (link + (superhighways.value as number)) as RouteLink,
              })
            );
          }
        }
      }
    }
  });

  it("Pollution says it halves each of its square's yields, on the rules that halve them", (): void => {
    const rules = tileYield().filter((rule) => rule.descriptions().length > 0);

    expect(rules.map((rule) => rule.id())).to.eql(
      ['Food', 'Production', 'Trade'].map(
        (name) => `civ2-city:city/tile-yield/pollution/${name}`
      )
    );
    expect(rules.flatMap((rule) => rule.descriptions())).to.eql(
      [Food, Production, Trade].map((YieldType) => ({
        type: 'tile_yield_halved',
        subject: Pollution,
        yield: YieldType,
      }))
    );
  });
});
