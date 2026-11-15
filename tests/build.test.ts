import { Anarchy, Despotism } from '../Governments';
import { atLevel, governedBy, playedBy, sized } from './lib/stubs';
import build, {
  IMPROVEMENT,
  UNIT,
  WONDER,
  categoryOf,
  shieldsAfterChange,
} from '../Rules/City/build';
import { Entertainer, Scientist, TaxCollector } from '../Specialists';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import BuildOverflow from '@civ-clone/core-city-build/Rules/BuildOverflow';
import Capitalization from '@civ-clone/base-city-improvement-capitalization/Capitalization';
import CivilDisorder from '@civ-clone/core-city-happiness/Rules/CivilDisorder';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import Player from '@civ-clone/core-player/Player';
import PlayerTreasury from '@civ-clone/core-treasury/PlayerTreasury';
import PlayerTreasuryRegistry from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import Production from '@civ-clone/base-terrain-yield-production/Production';
import ProductionChanged from '@civ-clone/core-city-build/Rules/ProductionChanged';
import Pyramids from '@civ-clone/base-wonder-pyramids/Pyramids';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import SpecialistAvailable from '@civ-clone/base-city-lifecycle/Rules/SpecialistAvailable';
import Temple from '@civ-clone/base-city-improvement-temple/Temple';
import Unit from '@civ-clone/core-unit/Unit';
import { expect } from 'chai';
import processYield from '../Rules/City/process-yield';
import specialistAvailable from '../Rules/City/specialist-available';

class Warriors extends Unit {}

// OpenCiv2 `src/auto/city.cpp` `city_production_category`, `city_shields_after_change`, `city_set_production` and
//  `city_production.cpp` `city_process_production` (richardpenman/civ2@49f26ec).
describe('what a city builds', (): void => {
  const setUp = (human: boolean, level = 3) => {
    const ruleRegistry = new RuleRegistry(),
      player = new Player(ruleRegistry),
      cityBuild = { city: () => ({ player: () => player }) } as any;

    ruleRegistry.register(
      ...build(
        human ? playedBy(player) : playedBy(),
        atLevel(level),
        ruleRegistry
      )
    );

    return { cityBuild, ruleRegistry };
  };

  it('puts units, improvements and everything numbered past the Solar Plant in Civ2’s three categories', (): void => {
    expect(categoryOf(Warriors)).equal(UNIT);
    expect(categoryOf(Temple)).equal(IMPROVEMENT);
    expect(categoryOf(Barracks)).equal(IMPROVEMENT);
    expect(categoryOf(Pyramids)).equal(WONDER);
    // Capitalization is improvement 38, past `-0x22`: the Wonders' category.
    expect(categoryOf(Capitalization)).equal(WONDER);
  });

  it('loses half the box, rounded down, on a person’s change of category', (): void => {
    // 25 - 50 × 25 / 100 = 25 - 12 = 13.
    expect(shieldsAfterChange(25)).equal(13);
    expect(shieldsAfterChange(1)).equal(1);

    const { cityBuild, ruleRegistry } = setUp(true);

    expect(
      ruleRegistry.process(ProductionChanged, cityBuild, Temple, Warriors, 25)
    ).eql([13]);
    expect(
      ruleRegistry.process(ProductionChanged, cityBuild, Temple, Pyramids, 40)
    ).eql([20]);
    // Within a category, and back to where the turn started, nothing is lost.
    expect(
      ruleRegistry.process(ProductionChanged, cityBuild, Temple, Barracks, 25)
    ).eql([]);
    expect(
      ruleRegistry.process(ProductionChanged, cityBuild, Temple, Temple, 25)
    ).eql([]);
  });

  it('halves a computer player’s box on a change to a Wonder from anything else, on any level', (): void => {
    [0, 3].forEach((level) => {
      const computer = setUp(false, level);

      // 25 → 12, rounded down, carried-over shields included.
      expect(
        computer.ruleRegistry.process(
          ProductionChanged,
          computer.cityBuild,
          Warriors,
          Pyramids,
          25
        )
      ).eql([12]);
      expect(
        computer.ruleRegistry.process(
          ProductionChanged,
          computer.cityBuild,
          Capitalization,
          Pyramids,
          25
        )
      ).eql([12]);
      // A Wonder to a Wonder, or to anything else, costs nothing.
      expect(
        computer.ruleRegistry.process(
          ProductionChanged,
          computer.cityBuild,
          Pyramids,
          Temple,
          25
        )
      ).eql([]);
    });
  });

  it('costs nothing on Chieftain, or for a computer player outside a change to a Wonder', (): void => {
    expect(
      setUp(true, 0).ruleRegistry.process(
        ProductionChanged,
        setUp(true, 0).cityBuild,
        Temple,
        Warriors,
        25
      )
    ).eql([]);

    const computer = setUp(false);

    expect(
      computer.ruleRegistry.process(
        ProductionChanged,
        computer.cityBuild,
        Temple,
        Warriors,
        25
      )
    ).eql([]);
  });

  it('carries the excess over for a computer player’s units and improvements only', (): void => {
    const computer = setUp(false),
      person = setUp(true);

    expect(
      computer.ruleRegistry.process(
        BuildOverflow,
        computer.cityBuild,
        Warriors,
        14,
        10
      )
    ).eql([4]);
    expect(
      computer.ruleRegistry.process(
        BuildOverflow,
        computer.cityBuild,
        Temple,
        45,
        40
      )
    ).eql([5]);
    expect(
      computer.ruleRegistry.process(
        BuildOverflow,
        computer.cityBuild,
        Pyramids,
        250,
        240
      )
    ).eql([]);
    expect(
      person.ruleRegistry.process(
        BuildOverflow,
        person.cityBuild,
        Warriors,
        14,
        10
      )
    ).eql([]);
  });
});

describe('Capitalization', (): void => {
  const setUp = (government = Despotism, disorder = false) => {
    const ruleRegistry = new RuleRegistry(),
      player = new Player(ruleRegistry),
      playerTreasuryRegistry = new PlayerTreasuryRegistry(),
      treasury = new PlayerTreasury(
        player,
        Gold,
        { getByCity: () => [] } as any,
        ruleRegistry
      ),
      progress = { value: 7 },
      checks: number[] = [],
      cityBuild = {
        building: () => ({ item: () => Capitalization }),
        add: () => {
          throw new Error('Capitalization never fills the box');
        },
        check: () => checks.push(1),
        progress: () => progress,
      },
      city = {
        player: () => player,
        tile: () => null,
        yields: () => [],
      } as any,
      [rule] = processYield(
        { getByCity: () => cityBuild } as any,
        undefined,
        undefined,
        ruleRegistry,
        playerTreasuryRegistry,
        governedBy(government)
      ).filter(
        (rule) => rule.id() === 'civ2-city:city/process-yield/production'
      );

    playerTreasuryRegistry.register(treasury);

    if (disorder) {
      ruleRegistry.register(
        new CivilDisorder(new Criterion(() => true), new Effect(() => true))
      );
    }

    return { checks, city, progress, rule, treasury };
  };

  it('pays the turn’s shields, after support, into the treasury and leaves the box as it was', (): void => {
    const { checks, city, progress, rule, treasury } = setUp();

    // 10 shields less 2 for support: the city's `Production` comes net of its units' support (and its waste).
    for (let turn = 0; turn < 10; turn++) {
      rule.process(new Production(8), city, []);
    }

    expect(treasury.value()).equal(80);
    expect(progress.value).equal(7);
    expect(checks.length).equal(10);
  });

  it('pays nothing in civil disorder or under Anarchy', (): void => {
    [setUp(Despotism, true), setUp(Anarchy)].forEach(
      ({ city, rule, treasury, checks }) => {
        rule.process(new Production(8), city, []);

        expect(treasury.value()).equal(0);
        expect(checks.length).equal(1);
      }
    );
  });
});

describe('specialists', (): void => {
  it('may only be Entertainers below size 5', (): void => {
    [4, 5].forEach((size) => {
      const ruleRegistry = new RuleRegistry();

      ruleRegistry.register(...specialistAvailable(sized(size)));

      [Entertainer, TaxCollector, Scientist].forEach((SpecialistType) =>
        expect(
          ruleRegistry
            .get(SpecialistAvailable)
            .filter((rule) => rule.validate({} as any, SpecialistType))
            .every((rule) => rule.process({} as any, SpecialistType))
        ).equal(size >= 5 || SpecialistType === Entertainer)
      );
    });
  });
});
