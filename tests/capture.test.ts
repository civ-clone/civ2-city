import CommunismAdvance from '@civ-clone/base-science-advance-communism/Communism';
import Conscription from '@civ-clone/base-science-advance-conscription/Conscription';
import GuerrillaWarfare from '@civ-clone/base-science-advance-guerrillawarfare/GuerrillaWarfare';
import { Democracy, Monarchy } from '../Governments';
import { Grassland, Hills, Ocean } from '@civ-clone/civ2-world/Terrains';
import {
  isVeteranPartisan,
  offsetSteps,
  partisanCount,
  partisanVeteranOdds,
  plunder,
  power,
  powerRanks,
  treasuryShare,
} from '../lib/capture';
import { waitBeforePlunder } from '../lib/captureAftermath';
import Advance from '@civ-clone/core-science/Advance';
import Barbarian from '@civ-clone/base-civilization-barbarian/Barbarian';
import City from '@civ-clone/core-city/City';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Captured from '@civ-clone/core-city/Rules/Captured';
import Created from '@civ-clone/core-unit/Rules/Created';
import Destroyed from '@civ-clone/core-unit/Rules/Destroyed';
import { DefendRole } from '@civ-clone/base-unit-role/Roles';
import Effect from '@civ-clone/core-rule/Effect';
import FillGenerator from '@civ-clone/core-world/tests/lib/FillGenerator';
import Fortified from '@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified';
import Fortress from '@civ-clone/base-tile-improvement-fortress/Fortress';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import Government from '@civ-clone/core-government/Government';
import InciteRevolt from '@civ-clone/base-unit-action-incite-revolt/InciteRevolt';
import LandMassRegistry from '@civ-clone/core-world/LandMassRegistry';
import Partisan from '@civ-clone/base-unit-partisan/Partisan';
import Player from '@civ-clone/core-player/Player';
import Priority from '@civ-clone/core-rule/Priority';
import PlayerRegistry from '@civ-clone/core-player/PlayerRegistry';
import PlayerTreasury from '@civ-clone/core-treasury/PlayerTreasury';
import PlayerTreasuryRegistry from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import SubvertCity from '@civ-clone/base-unit-action-incite-revolt/SubvertCity';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovementRegistry from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovementRegistry from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import UnitRegistry from '@civ-clone/core-unit/UnitRegistry';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import WorkedTileRegistry from '@civ-clone/core-city/WorkedTileRegistry';
import World from '@civ-clone/core-world/World';
import captured from '../Rules/City/captured';
import { expect } from 'chai';
import { instanceOf } from './lib/stubs';
import { partisanOffsets } from '../lib/capture';
import { playedBy } from './lib/stubs';
import tiles from '../Rules/City/tiles';
import { unitRole } from '@civ-clone/base-unit-role/Rules/UnitRoles';

// OpenCiv2 `src/auto/city.cpp` `city_treasury_share` (:4682), `city_capture_aftermath` (:5378) and its `_rehome_units`
//  (:5114) and `_partisans` (:5225), richardpenman/civ2@49f26ec.
describe('capture numbers', (): void => {
  it('shares the gold by size against all of the owner’s citizens, rounding as each branch does', (): void => {
    // 8 × 500 / 41 = 97.56 → 97: multiplied first, as 500 < 32000 / 8.
    expect(treasuryShare(8, 500, 40)).equal(97);
    // 5000 ≥ 32000 / 10: 5000 / 31 = 161, × 10 = 1610 (multiplying first would give 1612).
    expect(treasuryShare(10, 5000, 30)).equal(1610);
    // A single city of size 1 with 99 gold: 99 / 2 = 49.
    expect(treasuryShare(1, 99, 1)).equal(49);
    // In debt: the share is negative, so 32000, and the clamp leaves the debt itself.
    expect(treasuryShare(4, -50, 10)).equal(32000);
    expect(plunder(32000, -50)).equal(-50);
    expect(plunder(97, 200)).equal(97);
    expect(plunder(97, 50)).equal(50);
  });

  it('ranks power: advances × 3, citizens × 8 and gold / 32, the earlier player first on a tie', (): void => {
    expect(power(10, 20, 100)).equal(30 + 160 + 3);

    const ranks = powerRanks([
      ['a', 10],
      ['b', 30],
      ['c', 10],
    ]);

    expect([ranks.get('b'), ranks.get('a'), ranks.get('c')]).eql([7, 6, 5]);
  });

  it('counts Partisans from size, government and rank, halved when incited', (): void => {
    const all = {
        conscription: true,
        guerrillaWarfare: true,
        communism: true,
        gunpowder: true,
      },
      base = {
        size: 7,
        loserGovernment: 6,
        captorGovernment: 2,
        loserRank: 7,
        captorRank: 6,
        incited: false,
        loserKnows: all,
        captorKnowsGuerrillaWarfare: false,
      };

    // (7 + 5) / 8 = 1, × (4 + 1 + 1) = 6, / 2 = 3; doubled against a captor without Guerrilla Warfare.
    expect(partisanCount(base)).equal(6);
    expect(partisanCount({ ...base, captorKnowsGuerrillaWarfare: true })).equal(
      4
    );
    // 3 / 2 = 1, doubled.
    expect(partisanCount({ ...base, incited: true })).equal(2);
    // Size 11: 16 / 8 = 2, × 6 / 2 = 6, less 1 without Conscription = 5, doubled.
    expect(
      partisanCount({
        ...base,
        size: 11,
        loserKnows: { ...all, conscription: false },
      })
    ).equal(10);
    // Without Guerrilla Warfare: Communism and Gunpowder both, or none; the decrement still applies.
    expect(
      partisanCount({
        ...base,
        loserKnows: { ...all, guerrillaWarfare: false, conscription: false },
      })
    ).equal(2);
    expect(
      partisanCount({
        ...base,
        loserKnows: { ...all, guerrillaWarfare: false, gunpowder: false },
      })
    ).equal(0);
    expect(
      partisanCount({
        ...base,
        loserKnows: { ...all, guerrillaWarfare: false, communism: false },
      })
    ).equal(0);
    // Size 1 to 2 gives none: (1 + 5) / 8 = 0.
    expect(partisanCount({ ...base, size: 2 })).equal(0);
  });

  it('makes a Partisan a veteran on a roll of 1 to n of 0 to n, n = vendetta 2 + reputation − 4', (): void => {
    expect(partisanVeteranOdds(false, 0)).equal(0);
    expect(partisanVeteranOdds(true, 2)).equal(0);
    expect(partisanVeteranOdds(true, 3)).equal(1);
    expect(partisanVeteranOdds(false, 7)).equal(3);
    expect(isVeteranPartisan(0, 0.99)).false;
    expect(isVeteranPartisan(1, 0.49)).false;
    expect(isVeteranPartisan(1, 0.5)).true;
  });

  it('walks each of Civ2’s 20 offsets along the diagonals', (): void => {
    expect(offsetSteps(1, -1)).eql(['ne']);
    expect(offsetSteps(2, 0)).eql(['ne', 'se']);
    expect(offsetSteps(0, -2)).eql(['ne', 'nw']);
    expect(offsetSteps(-1, 3)).eql(['sw', 'sw', 'se']);
    expect(partisanOffsets.length).equal(20);
  });
});

class Defender extends Unit {}
class Attacker extends Unit {}

const governedAs = (governments: Map<Player, typeof Government>) =>
    ({
      getByPlayer: (player: Player) => ({
        is: (...types: (typeof Government)[]) =>
          types.includes(governments.get(player)!),
      }),
    } as any),
  researching = (known: Map<Player, (typeof Advance)[]>) =>
    ({
      getByPlayer: (player: Player) => ({
        completed: (Type: typeof Advance) =>
          (known.get(player) ?? []).includes(Type),
        complete: () => known.get(player) ?? [],
      }),
    } as any);

const setUp = async ({
  loserAdvances = [
    GuerrillaWarfare,
    Conscription,
    CommunismAdvance,
  ] as (typeof Advance)[],
  loserGold = 500,
  escapeCost = 0,
  humanLoser = false,
  destroyCity = false,
}: {
  loserAdvances?: (typeof Advance)[];
  loserGold?: number;
  escapeCost?: number;
  humanLoser?: boolean;
  destroyCity?: boolean;
} = {}) => {
  const ruleRegistry = new RuleRegistry(),
    cityRegistry = new CityRegistry(),
    unitRegistry = new UnitRegistry(),
    playerRegistry = new PlayerRegistry(),
    playerTreasuryRegistry = new PlayerTreasuryRegistry(),
    tileImprovementRegistry = new TileImprovementRegistry(),
    unitImprovementRegistry = new UnitImprovementRegistry(),
    workedTileRegistry = new WorkedTileRegistry(ruleRegistry),
    cityBuildRegistry = new CityBuildRegistry(),
    loser = new Player(ruleRegistry),
    captor = new Player(ruleRegistry),
    sizes = new Map<City, number>(),
    events: unknown[][] = [],
    world = await new World(
      new FillGenerator(14, 8, Grassland, { topologyId: 'staggered-iso' }),
      ruleRegistry,
      new LandMassRegistry()
    ).build();

  playerRegistry.register(loser, captor);

  [
    [loser, loserGold],
    [captor, 0],
  ].forEach(([player, gold]) => {
    const treasury = new PlayerTreasury(
      player as Player,
      Gold,
      cityBuildRegistry,
      ruleRegistry
    );

    treasury.add(gold as number);
    playerTreasuryRegistry.register(treasury);
  });

  const cityGrowthRegistry = {
    getByCity: (city: City) => ({ size: () => sizes.get(city) ?? 1 }),
  } as any;

  ruleRegistry.register(
    ...tiles(),
    unitRole('test:unit/role', Defender, DefendRole),
    new Created(new Effect((unit: Unit) => unitRegistry.register(unit))),
    // As base-unit-lifecycle's `Destroyed` rules do.
    new Destroyed(new Effect((unit: Unit) => unit.setDestroyed())),
    // Stands in for the Palace escape (spends the loser's gold) and the shrink, both `Normal` and ahead of the units.
    new Captured(
      new Effect((city: City) => {
        playerTreasuryRegistry
          .getByPlayerAndType(loser, Gold)
          .subtract(escapeCost);
        sizes.set(city, sizes.get(city)! - 1);

        if (destroyCity) {
          city.destroy();
        }
      })
    ),
    ...captured(
      unitRegistry,
      cityGrowthRegistry,
      { getByCity: () => ({}) } as any,
      { emit: (...args: unknown[]) => events.push(args) } as any,
      undefined,
      workedTileRegistry,
      undefined,
      undefined,
      {
        cityRegistry,
        clientRegistry: humanLoser ? playedBy(loser) : playedBy(),
        playerGovernmentRegistry: governedAs(
          new Map<Player, typeof Government>([
            [loser, Democracy],
            [captor, Monarchy],
          ])
        ),
        playerRegistry,
        playerResearchRegistry: researching(new Map([[loser, loserAdvances]])),
        playerTreasuryRegistry,
        ruleRegistry,
        tileImprovementRegistry,
        unitImprovementRegistry,
        randomNumberGenerator: () => 0.5,
      }
    ).filter((rule) =>
      [
        'civ2-city:city/captured/power-ranks',
        'civ2-city:city/captured/plunder-share',
        'civ2-city:city/captured/plunder',
        'civ2-city:city/captured/rehome-units',
        'civ2-city:city/captured/partisans',
      ].includes(rule.id())
    )
  );

  const city = new City(loser, world.get(4, 7), 'city', ruleRegistry),
    other = new City(loser, world.get(4, 1), 'other', ruleRegistry);

  [city, other].forEach((each) => cityRegistry.register(each));
  sizes.set(city, 8);
  sizes.set(other, 4);

  const goldOf = (player: Player): number =>
    playerTreasuryRegistry.getByPlayerAndType(player, Gold).value();

  return {
    captor,
    city,
    events,
    goldOf,
    loser,
    other,
    tileImprovementRegistry,
    unitImprovementRegistry,
    unitRegistry,
    world,
    ruleRegistry,
    playerRegistry,
    playerTreasuryRegistry,
  };
};

const partisansOf = (unitRegistry: UnitRegistry, player: Player): Unit[] =>
  unitRegistry
    .getByPlayer(player)
    .filter((unit: Unit) => unit instanceof Partisan);

describe('city:captured plunder', (): void => {
  it('takes the share from before the capture, clamped to what the Palace escape leaves', async (): Promise<void> => {
    // 8 × 500 / (8 + 4 + 1) = 307; the escape leaves 200.
    const { city, captor, loser, goldOf, events } = await setUp({
      escapeCost: 300,
    });

    city.capture(captor);

    expect(goldOf(loser)).equal(0);
    expect(goldOf(captor)).equal(200);

    const [plundered] = events.filter(([name]) => name === 'city:plundered');

    expect(plundered.length).equal(5);
    expect(plundered[1] === city).true;
    expect(plundered[2] === captor).true;
    expect(plundered[3] === loser).true;
    expect(plundered[4]).equal(200);
  });

  it('moves the whole share when there is enough', async (): Promise<void> => {
    const { city, captor, loser, goldOf } = await setUp();

    city.capture(captor);

    expect(goldOf(loser)).equal(500 - 307);
    expect(goldOf(captor)).equal(307);
  });
});

describe('city:captured plunder after an answer', (): void => {
  it('waits for a Palace escape the loser has yet to answer, and caps the plunder to what it leaves', async (): Promise<void> => {
    // 8 × 1200 / (8 + 4 + 1) = 738, from the gold before the capture; the loser says yes and pays 1,000, leaving 200.
    const {
        city,
        captor,
        loser,
        goldOf,
        ruleRegistry,
        playerTreasuryRegistry,
      } = await setUp({ loserGold: 1200 }),
      answered = new Promise<void>((resolve) => setTimeout(resolve, 0)).then(
        () => {
          playerTreasuryRegistry.getByPlayerAndType(loser, Gold).subtract(1000);
        }
      );

    ruleRegistry.register(
      new Captured(
        new Effect((captured: City) => waitBeforePlunder(captured, answered))
      )
    );

    city.capture(captor);

    expect(goldOf(captor)).equal(0);

    await answered;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(goldOf(loser)).equal(0);
    expect(goldOf(captor)).equal(200);
  });
});

describe('city:captured plunder by Barbarians', (): void => {
  it('takes the gold from the loser but keeps none', async (): Promise<void> => {
    const { city, captor, loser, goldOf } = await setUp();

    captor.setCivilization(new Barbarian());
    city.capture(captor);

    expect(goldOf(loser)).equal(500 - 307);
    expect(goldOf(captor)).equal(0);
  });
});

describe('city:captured order', (): void => {
  it('takes the power ranks first and the share next, then shrinks before the units, then plunders and raises Partisans after every Normal rule', (): void => {
    const ruleRegistry = new RuleRegistry();

    ruleRegistry.register(...captured());

    const ids = ruleRegistry
      .entries()
      .filter((rule) => rule instanceof Captured)
      .map((rule) => rule.id().replace('civ2-city:city/captured/', ''));

    expect(ids.slice(0, 2)).eql(['power-ranks', 'plunder-share']);
    expect(ids.indexOf('shrink')).lessThan(ids.indexOf('rehome-units'));
    expect(ids.slice(-3)).eql(['plunder', 'partisans', 'founder']);
  });
});

describe('city:captured units', (): void => {
  const units = async (humanLoser: boolean, destroyCity = false) => {
    const set = await setUp({ humanLoser, loserAdvances: [], destroyCity }),
      { city, other, loser, ruleRegistry, world } = set,
      first = new Defender(city, loser, other.tile(), ruleRegistry),
      attacker = new Attacker(city, loser, other.tile(), ruleRegistry),
      second = new Defender(city, loser, other.tile(), ruleRegistry),
      partisan = new Partisan(city, loser, other.tile(), ruleRegistry),
      inTheField = new Defender(city, loser, world.get(1, 12), ruleRegistry);

    set.city.capture(set.captor);

    return { ...set, first, attacker, second, partisan, inTheField };
  };

  it("rehomes a computer player's last defender standing in another city, unhomes Partisans and disbands the rest", async (): Promise<void> => {
    const { first, attacker, second, partisan, inTheField, other } =
      await units(false);

    // From the newest down: the second defender is one of two in `other`, so it goes; then the first is alone.
    expect(second.destroyed()).true;
    expect(attacker.destroyed()).true;
    expect(inTheField.destroyed()).true;
    expect(first.destroyed()).false;
    expect(first.city() === other).true;
    expect(partisan.destroyed()).false;
    expect(partisan.city()).null;
  });

  it("leaves them to the city's destruction when the capture destroys it", async (): Promise<void> => {
    const { first, partisan, city, captor, loser, goldOf } = await units(
      false,
      true
    );

    expect(first.city() === city).true;
    expect(partisan.city() === city).true;
    // Paid before the shrink, as `city_capture_aftermath` does.
    expect(goldOf(loser)).equal(500 - 307);
    expect(goldOf(captor)).equal(307);
  });

  it("disbands all of a person's, but Partisans", async (): Promise<void> => {
    const { first, attacker, second, partisan, inTheField } = await units(true);

    [first, attacker, second, inTheField].forEach(
      (unit) => expect(unit.destroyed()).true
    );
    expect(partisan.destroyed()).false;
    expect(partisan.city()).null;
  });
});

describe('city:captured partisans', (): void => {
  it('places them fortified on the best free land squares, in Civ2’s order on a tie', async (): Promise<void> => {
    const {
        city,
        captor,
        loser,
        events,
        tileImprovementRegistry,
        unitImprovementRegistry,
        unitRegistry,
        ruleRegistry,
        other,
      } = await setUp(),
      at = (dx: number, dy: number): Tile =>
        offsetSteps(dx, dy).reduce(
          (tile: Tile, direction) => tile.getNeighbour(direction),
          city.tile()
        );

    // Index 2 (1, 1) with a fortress and index 19 (-1, -3) on hills both score 8; grassland scores 4.
    tileImprovementRegistry.register(new Fortress(at(1, 1)));
    at(-1, -3).setTerrain(new Hills());
    // Index 0 is sea, and index 1 has a unit on it.
    at(1, -1).setTerrain(new Ocean());
    new Attacker(null, captor, at(2, 0), ruleRegistry);

    city.capture(captor);

    // Democracy (6) against Monarchy (2), ranks 7 and 6, size 8 − 1: 3, doubled.
    const partisans = partisansOf(unitRegistry, loser);

    expect(partisans.length).equal(6);
    expect(
      partisans.map((partisan) =>
        partisanOffsets.findIndex(([dx, dy]) => at(dx, dy) === partisan.tile())
      )
    ).eql([2, 19, 3, 4, 5, 6]);
    // `unit_create` homes a unit in the nearest city, the last of equals, when it's its owner's: the one on the hills
    //  is as far from the loser's other city as from the captured one, so it's homed there.
    expect(partisans[1].city() === other).true;
    partisans.forEach((partisan, index) => {
      if (index !== 1) {
        expect(partisan.city()).null;
      }

      expect(
        unitImprovementRegistry
          .getByUnit(partisan)
          .some((improvement) => improvement instanceof Fortified)
      ).true;
      expect(
        unitImprovementRegistry
          .getByUnit(partisan)
          .some((improvement) => improvement instanceof Veteran)
      ).false;
    });

    const [rising] = events.filter(([name]) => name === 'city:partisans');

    expect(rising[1] === city).true;
    expect(rising[2] === loser).true;
    expect((rising[3] as Unit[]).length).equal(6);
    expect(rising[4] === captor).true;
  });

  it("counts them by the ranks from before a civil war's split (`_partisans` :5254, turn-start ranks)", async (): Promise<void> => {
    const count = async (split: boolean): Promise<number> => {
      const {
        city,
        captor,
        loser,
        playerRegistry,
        ruleRegistry,
        unitRegistry,
      } = await setUp();

      if (split) {
        // Stands in for civ2-player's civil war at 900: two new players join ahead of the captor, so the loser and the
        //  captor would rank 7 and 4 after it, rather than 7 and 6.
        ruleRegistry.register(
          new Captured(
            new Priority(900),
            new Effect((): void => {
              playerRegistry.register(
                new Player(ruleRegistry),
                new Player(ruleRegistry)
              );
              playerRegistry.unregister(captor);
              playerRegistry.register(captor);
            })
          )
        );
      }

      city.capture(captor);

      return partisansOf(unitRegistry, loser).length;
    };

    // Democracy against Monarchy, ranks 7 and 6, size 8 − 1: (4 + 1 + 1) / 2 = 3, doubled; with the ranks after the
    //  split, 7 and 4, it would be (4 + 3 + 1) / 2 = 4, doubled.
    expect(await count(false)).equal(6);
    expect(await count(true)).equal(6);
  });

  it('halves them for an incited city, and raises none for a subverted one or a founder retaking it', async (): Promise<void> => {
    const incited = await setUp();

    incited.city.capture(incited.captor, instanceOf(InciteRevolt));

    expect(partisansOf(incited.unitRegistry, incited.loser).length).equal(2);

    const subverted = await setUp();

    subverted.city.capture(subverted.captor, instanceOf(SubvertCity));

    expect(partisansOf(subverted.unitRegistry, subverted.loser).length).equal(
      0
    );

    const retaken = await setUp();

    (retaken.city as any)._originalPlayer = retaken.captor;
    retaken.city.capture(retaken.captor);

    expect(partisansOf(retaken.unitRegistry, retaken.loser).length).equal(0);
  });

  it('raises none when the loser has no city left, or without the advances', async (): Promise<void> => {
    const last = await setUp();

    last.other.destroy();
    last.city.capture(last.captor);

    expect(partisansOf(last.unitRegistry, last.loser).length).equal(0);

    // A Democracy still qualifies, but without Guerrilla Warfare it needs Communism and Gunpowder.
    const unread = await setUp({ loserAdvances: [Conscription] });

    unread.city.capture(unread.captor);

    expect(partisansOf(unread.unitRegistry, unread.loser).length).equal(0);
  });
});
