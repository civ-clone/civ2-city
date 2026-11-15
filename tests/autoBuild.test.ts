import {
  AUTO_MODE,
  autoModeOf,
  includeFor,
  setAutoMode,
} from '../lib/autoMode';
import {
  CHOOSES_NOTHING_ABOVE,
  ChooseProductionState,
  ImprovementId,
  OUT_OF_RANGE,
  OtherPlayerThreat,
  chooseImprovementScore,
  priorityOf,
} from '../lib/chooseProduction';
import { DEMOCRACY, DESPOTISM } from '@civ-clone/civ2-rules/data/governments';
import AvailableCityBuildItemsRegistry from '@civ-clone/core-city-build/AvailableCityBuildItemsRegistry';
import Barracks from '@civ-clone/base-city-improvement-barracks/Barracks';
import { IBuildable as Buildable } from '@civ-clone/core-city-build/Buildable';
import BuildingComplete from '@civ-clone/core-city-build/Rules/BulidingComplete';
import City from '@civ-clone/core-city/City';
import CityBuild from '@civ-clone/core-city-build/CityBuild';
import CityBuildRegistry from '@civ-clone/core-city-build/CityBuildRegistry';
import CityRegistry from '@civ-clone/core-city/CityRegistry';
import Granary from '@civ-clone/base-city-improvement-granary/Granary';
import Library from '@civ-clone/base-city-improvement-library/Library';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Temple from '@civ-clone/base-city-improvement-temple/Temple';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import Unit from '@civ-clone/core-unit/Unit';
import autoBuildRules from '../Rules/City/auto-build';
import buildPriorityRules from '../Rules/City/build-priority';
import { buildCosts } from '@civ-clone/core-city-build/Rules/BuildCost';
import {
  Corruption,
  Food,
  PopulationSupportFood,
  Production,
  Trade,
  UnitSupportProduction,
  Waste,
} from '../Yields';
import { governedBy, playedBy, sized } from './lib/stubs';
import LandMassRegistry from '@civ-clone/core-world/LandMassRegistry';
import chooseProductionState from '../lib/chooseProductionState';
import { expect } from 'chai';
import mapWorld from './lib/mapWorld';
import rankBuildItems from '@civ-clone/core-city-build/lib/rankBuildItems';

// OpenCiv2 `src/auto/city_production.cpp` (`city_choose_production_improvement_score`, `_try_improvement`,
//  `_final_choice`), richardpenman/civ2@49f26ec. The expected numbers are worked from the C by hand.

const noThreat: OtherPlayerThreat = {
  hostile: false,
  cruiseMissiles: 0,
  bombers: 0,
  helicopters: 0,
  stealthBombers: 0,
  ironclads: 0,
  destroyers: 0,
  cruisers: 0,
  aegisCruisers: 0,
  battleships: 0,
};

// A person's size-4 city at King under Despotism with a Palace elsewhere, 9 trade, 5 shields, one happy citizen.
const state = (
  overrides: Partial<ChooseProductionState> = {}
): ChooseProductionState => ({
  human: true,
  difficulty: 3,
  government: DESPOTISM,
  civilize: 0,
  attack: 0,
  policy: 5,
  threatened: false,
  defendedLandMass: false,
  citiesOnLandMass: 2,
  size: 4,
  staleSize: 0,
  foodSurplus: 2,
  totalShields: 5,
  shieldWaste: 0,
  shieldSupport: 1,
  totalTrade: 9,
  tradeCorruption: 0,
  happy: 1,
  unhappy: 0,
  disorder: false,
  oceanTiles: 0,
  farmland: 0,
  palaceCount: 1,
  palaceSize: 6,
  barracksCount: 0,
  airportCount: 0,
  portCount: 0,
  hasPalace: false,
  hasBarracks: false,
  hasFactory: false,
  hasManufacturingPlant: false,
  shakespeareHere: false,
  greatWall: false,
  michelangelo: false,
  pyramids: false,
  womensSuffrage: false,
  manhattanBuilt: false,
  roboticsKnown: false,
  advancedFlightKnown: false,
  rocketryKnown: false,
  knowsAdvancedFlight: false,
  knowsSpaceFlight: false,
  science: true,
  spaceRace: 0,
  coastal: false,
  aggressiveUnits: 0,
  nearestPortDistance: 9999,
  navalUnits: 0,
  bestHuman: noThreat,
  bestHumanNuclearMissiles: 0,
  bestHumanSubversion: 0,
  others: [],
  humans: [{ atWar: false, citiesOnLandMass: true, badReputation: false }],
  ...overrides,
});

const score = (
  improvement: ImprovementId,
  overrides: Partial<ChooseProductionState> = {}
): number => chooseImprovementScore(improvement, state(overrides));

describe('Civ2 Auto: improvement scores', (): void => {
  it('weighs a base score ×10 (matching `threatened`) or ×20, ×3, over civilize + 3', (): void => {
    // Library: 10 − 9 / 3 = 7; not defensive, not threatened: 10 × 7 × 3 / 3 = 70.
    expect(score(ImprovementId.Library)).equal(70);
    // Militaristic: / 2 = 105. Civilized: 210 / 4 = 52 (52.5).
    expect(score(ImprovementId.Library, { civilize: -1 })).equal(105);
    expect(score(ImprovementId.Library, { civilize: 1 })).equal(52);
    // Threatened, so a non-defensive item counts double: 20 × 7 × 3 / 3 = 140.
    expect(score(ImprovementId.Library, { threatened: true })).equal(140);
    // Marketplace: 10 − (9 >> 1) = 6 → 60.
    expect(score(ImprovementId.Marketplace)).equal(60);
  });

  it('wants a Temple only with as many unhappy as happy citizens, and most in disorder', (): void => {
    // One happy, none unhappy: 999 → 0x3fff.
    expect(score(ImprovementId.Temple)).equal(OUT_OF_RANGE);
    // Neither happy nor unhappy citizens counts as equal (`unrest_state` 1): 9 → 90.
    expect(score(ImprovementId.Temple, { happy: 0 })).equal(90);
    // In disorder: −5 → 10 × −5 × 3 / 3 = −50.
    expect(score(ImprovementId.Temple, { disorder: true })).equal(-50);
    // The Marketplace falls to −4 in disorder too: −40.
    expect(score(ImprovementId.Marketplace, { disorder: true })).equal(-40);
  });

  it('scores Barracks as defensive, up a half at King and doubled above it for a person', (): void => {
    // civilize + barracks + 4 − attack = 4; King × 3 / 2 = 6; defensive, not threatened: 20 × 6 × 3 / 3 = 120.
    expect(score(ImprovementId.Barracks)).equal(120);
    // Deity: 8 → 160. A computer player at King: 4 → 80.
    expect(score(ImprovementId.Barracks, { difficulty: 5 })).equal(160);
    expect(score(ImprovementId.Barracks, { human: false })).equal(80);
  });

  it('counts each human player and the advances anyone knows into City Walls, less 4 with a Palace', (): void => {
    // 10 − 6 >> 1 = 7; −1 for the person's own cities on the land mass; +2 for Rocketry = 8; defensive: 8 × 60 / 3.
    expect(
      score(ImprovementId.CityWalls, { size: 6, rocketryKnown: true })
    ).equal(160);
    expect(
      score(ImprovementId.CityWalls, {
        size: 6,
        rocketryKnown: true,
        hasPalace: true,
      })
    ).equal(80);
    // The Great Wall: 999.
    expect(score(ImprovementId.CityWalls, { greatWall: true })).equal(
      OUT_OF_RANGE
    );
  });

  it('adds a share for the city’s Barracks and a third for Shakespeare’s Theatre', (): void => {
    // Temple 90; Barracks with Sun Tzu's 4: + 90 / (2 + 3) = 108; Shakespeare's: + 108 / 3 = 144.
    expect(
      score(ImprovementId.Temple, {
        happy: 0,
        hasBarracks: true,
        barracksCount: 4,
      })
    ).equal(108);
    expect(
      score(ImprovementId.Temple, {
        happy: 0,
        hasBarracks: true,
        barracksCount: 4,
        shakespeareHere: true,
      })
    ).equal(144);
  });

  it('scores growth, waste and production improvements from the city', (): void => {
    // Aqueduct: size 7, surplus 3 (>> 1 = 1): 8 − 1 ≤ 7, so 8 + 4 − 7 − 1 = 4 → 40; at size 6 it's not wanted.
    expect(score(ImprovementId.Aqueduct, { size: 7, foodSurplus: 3 })).equal(
      40
    );
    expect(score(ImprovementId.Aqueduct, { size: 6, foodSurplus: 3 })).equal(
      OUT_OF_RANGE
    );
    // A deficit of 3 rounds down to −2: 8 + 2 = 10 > 9.
    expect(score(ImprovementId.Aqueduct, { size: 9, foodSurplus: -3 })).equal(
      OUT_OF_RANGE
    );
    // Courthouse: 14 − (3 × 2 + 4) = 4 → 40; under Democracy in disorder −1 → −10.
    expect(
      score(ImprovementId.Courthouse, { shieldWaste: 3, tradeCorruption: 4 })
    ).equal(40);
    expect(
      score(ImprovementId.Courthouse, { government: DEMOCRACY, disorder: true })
    ).equal(-10);
    // Factory: 14 − 10 = 4 → 40. Manufacturing Plant (`default:`): 12 − 10 / 4 = 10 → 100.
    expect(score(ImprovementId.Factory, { totalShields: 10 })).equal(40);
    expect(score(ImprovementId.ManufacturingPlant, { totalShields: 10 })).equal(
      100
    );
    // Harbour: 16 − 5 ocean = 11, halved with no food to spare: 5 → 50.
    expect(
      score(ImprovementId.Harbour, { oceanTiles: 5, foodSurplus: 0 })
    ).equal(50);
    // Mass Transit is never wanted.
    expect(score(ImprovementId.MassTransit)).equal(OUT_OF_RANGE);
  });

  it('goes over 500 for a militaristic leader’s threatened city that wants nothing much', (): void => {
    // Granary at Deity: 8 (under 3 shields) + 2 (no more happy than unhappy) + (5 + 4 − 0) = 19; not defensive but
    //  threatened: 20 × 19 × 3 / (−1 + 3) = 570.
    const granary = score(ImprovementId.Granary, {
      difficulty: 5,
      civilize: -1,
      threatened: true,
      totalShields: 2,
      happy: 0,
      unhappy: 1,
    });

    expect(granary).equal(570);
    expect(granary > CHOOSES_NOTHING_ABOVE).true;
    expect(priorityOf(granary, ImprovementId.Granary)).equal(0);
  });

  it('turns the lowest score into the highest priority, ties to the lower number', (): void => {
    expect(priorityOf(90, ImprovementId.Temple)).closeTo(411.096, 1e-9);
    expect(priorityOf(-50, ImprovementId.Temple)).closeTo(551.096, 1e-9);
    expect(priorityOf(500, ImprovementId.Temple) > 0).true;
    expect(priorityOf(501, ImprovementId.Temple)).equal(0);
    expect(
      priorityOf(70, ImprovementId.Marketplace) >
        priorityOf(70, ImprovementId.Library)
    ).true;
    expect(
      priorityOf(69, ImprovementId.Library) >
        priorityOf(70, ImprovementId.Marketplace)
    ).true;
  });
});

describe('Civ2 Auto: modes and choosing', (): void => {
  class Warriors extends Unit {}

  const asBuildable = (Item: unknown): Buildable => Item as Buildable;

  const setUp = (
    overrides: Partial<ChooseProductionState> = {},
    items: Buildable[] = [
      asBuildable(Barracks),
      asBuildable(Library),
      asBuildable(Temple),
      asBuildable(Warriors),
    ],
    clearWhenNothingChosen = false
  ) => {
    const ruleRegistry = new RuleRegistry(),
      pendingEffectRegistry = new PendingEffectRegistry(),
      player = new Player(ruleRegistry),
      city = {
        player: (): Player => player,
        yields: (): [] => [],
        id: (): string => 'city',
      } as unknown as City,
      available = new AvailableCityBuildItemsRegistry(),
      cityBuild = new CityBuild(city, available, ruleRegistry),
      cityRegistry = {
        getByPlayer: (of: Player): City[] => (of === player ? [city] : []),
      } as unknown as CityRegistry,
      cityBuildRegistry = {
        getByCity: (): CityBuild => cityBuild,
      } as unknown as CityBuildRegistry;

    available.register(...items);

    ruleRegistry.register(
      ...buildCosts(
        items.map((Item: Buildable): [Buildable, number] => [Item, 30])
      ),
      ...buildPriorityRules({}, () => state(overrides)),
      ...autoBuildRules(
        {
          cityBuildRegistry,
          cityRegistry,
          pendingEffectRegistry,
          ruleRegistry,
        },
        { clearWhenNothingChosen }
      )
    );

    return { cityBuild, city, player, pendingEffectRegistry, ruleRegistry };
  };

  it('ranks nothing for a city not on Auto, so a computer player’s own choice is untouched', (): void => {
    const { cityBuild, ruleRegistry } = setUp({ happy: 0 });

    expect(rankBuildItems(cityBuild, ruleRegistry)).length(0);
  });

  it('chooses the lowest score at once when put on Auto, of anything', (): void => {
    // Temple 90, Library 70, Barracks 120: the Library.
    const { cityBuild, ruleRegistry, pendingEffectRegistry } = setUp({
      happy: 0,
    });

    cityBuild.build(asBuildable(Temple));

    expect(setAutoMode(cityBuild, 'any', ruleRegistry, pendingEffectRegistry))
      .true;
    expect(cityBuild.auto()).true;
    expect(autoModeOf(cityBuild, pendingEffectRegistry)).equal('any');
    expect(cityBuild.building()?.item() === asBuildable(Library)).true;
  });

  it('keeps the mode as a pending effect, and chooses only what it allows', (): void => {
    const { cityBuild, ruleRegistry, pendingEffectRegistry } = setUp({
      happy: 0,
    });

    cityBuild.build(asBuildable(Warriors));

    // No unit is scored yet: units only finds nothing, and the build is left as it was.
    expect(setAutoMode(cityBuild, 'units', ruleRegistry, pendingEffectRegistry))
      .false;
    expect(autoModeOf(cityBuild, pendingEffectRegistry)).equal('units');
    expect(
      pendingEffectRegistry
        .getByTarget(cityBuild.city())
        .map((effect) => [effect.handler(), effect.data().mode])
    ).eql([[AUTO_MODE, 'units']]);
    expect(cityBuild.building()?.item() === asBuildable(Warriors)).true;

    expect(
      setAutoMode(
        cityBuild,
        'improvements',
        ruleRegistry,
        pendingEffectRegistry
      )
    ).true;
    expect(autoModeOf(cityBuild, pendingEffectRegistry)).equal('improvements');
    expect(cityBuild.building()?.item() === asBuildable(Library)).true;
    expect(pendingEffectRegistry.getByTarget(cityBuild.city())).length(1);

    // Off Auto: no mode, and the flags go.
    setAutoMode(cityBuild, null, ruleRegistry, pendingEffectRegistry);

    expect(cityBuild.auto()).false;
    expect(autoModeOf(cityBuild, pendingEffectRegistry)).null;
    expect(pendingEffectRegistry.getByTarget(cityBuild.city())).length(0);
  });

  it('filters by mode as base-city-auto-build does', (): void => {
    const { cityBuild } = setUp(),
      [library, warriors] = [Library, Warriors].map((Item) =>
        cityBuild.getAvailable(asBuildable(Item))
      );

    expect(includeFor('improvements')(library)).true;
    expect(includeFor('improvements')(warriors)).false;
    expect(includeFor('units')(warriors)).true;
    expect(includeFor('units')(library)).false;
    expect(includeFor('any')(warriors)).true;
  });

  it('chooses the next build when one is finished', (): void => {
    const { cityBuild, ruleRegistry, pendingEffectRegistry } = setUp({
      happy: 0,
    });

    setAutoMode(cityBuild, 'any', ruleRegistry, pendingEffectRegistry);
    cityBuild.setCleared('completed', asBuildable(Library));
    // As `CityBuild#check` leaves a finished build.
    (cityBuild as any)._building = null;
    ruleRegistry.process(BuildingComplete, cityBuild, {} as any);

    expect(cityBuild.building()?.item() === asBuildable(Library)).true;
  });

  describe('with every score over 500', (): void => {
    const over500 = {
      difficulty: 5,
      civilize: -1,
      threatened: true,
      totalShields: 2,
      happy: 0,
      unhappy: 1,
    };

    const finish = (
      cityBuild: CityBuild,
      ruleRegistry: RuleRegistry,
      Item: Buildable
    ): void => {
      cityBuild.setCleared('completed', Item);
      (cityBuild as any)._building = null;
      ruleRegistry.process(BuildingComplete, cityBuild, {} as any);
    };

    it('chooses nothing and stays on Auto by default, building another of a unit it has just finished', (): void => {
      const { cityBuild, ruleRegistry, pendingEffectRegistry } = setUp(
        over500,
        [asBuildable(Granary), asBuildable(Warriors)]
      );

      cityBuild.build(asBuildable(Warriors));
      expect(setAutoMode(cityBuild, 'any', ruleRegistry, pendingEffectRegistry))
        .false;

      finish(cityBuild, ruleRegistry, asBuildable(Warriors));

      expect(cityBuild.auto()).true;
      expect(cityBuild.building()?.item() === asBuildable(Warriors)).true;

      // After an improvement, nothing: the turn's start tries again.
      finish(cityBuild, ruleRegistry, asBuildable(Granary));

      expect(cityBuild.auto()).true;
      expect(cityBuild.building()).null;

      ruleRegistry.process(TurnStart, cityBuild.city().player());

      expect(cityBuild.auto()).true;
      expect(cityBuild.building()).null;
    });

    it('takes the city off Auto, its mode with it, with `clearWhenNothingChosen`', (): void => {
      const { cityBuild, ruleRegistry, pendingEffectRegistry } = setUp(
        over500,
        [asBuildable(Granary), asBuildable(Warriors)],
        true
      );

      setAutoMode(
        cityBuild,
        'improvements',
        ruleRegistry,
        pendingEffectRegistry
      );
      finish(cityBuild, ruleRegistry, asBuildable(Warriors));

      expect(cityBuild.auto()).false;
      expect(cityBuild.building()).null;
      expect(pendingEffectRegistry.getByTarget(cityBuild.city())).length(0);
    });
  });
});

describe('Civ2 Auto: the survey', (): void => {
  it('reads the city’s food, shields and trade as `city_calc` holds them, and its ocean squares', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      landMassRegistry = new LandMassRegistry(),
      world = await mapWorld(
        ['~~~~~', '~...~', '~...~', '~...~', '~~~~~'],
        ruleRegistry,
        landMassRegistry
      ),
      player = {
        civilization: () => ({ leader: (): null => null }),
      } as unknown as Player,
      centre = world.get(2, 2),
      squares = centre.getSurroundingArea(2).entries(),
      worked = [world.get(0, 2), world.get(0, 1)],
      city = {
        player: (): Player => player,
        originalPlayer: (): Player => player,
        tile: () => centre,
        tiles: () => ({ entries: () => squares }),
        tilesWorked: () => ({ entries: () => worked }),
      } as unknown as City,
      cityRegistry = new CityRegistry(),
      s = chooseProductionState(
        city,
        [
          new Food(8),
          new PopulationSupportFood(6),
          new Production(10),
          new Waste(2),
          new UnitSupportProduction(3),
          new Trade(12),
          new Corruption(5),
        ],
        {
          cityGrowthRegistry: sized(3),
          cityRegistry,
          clientRegistry: playedBy(player),
          landMassRegistry,
          playerGovernmentRegistry: governedBy(null),
          playerRegistry: { entries: (): Player[] => [player] } as any,
          ruleRegistry,
          citizens: () => ({ happy: 1, unhappy: 1 }),
        }
      );

    expect(s.human).true;
    expect(s.foodSurplus).equal(2);
    // After the waste, before the units' support.
    expect(s.totalShields).equal(8);
    expect(s.shieldWaste).equal(2);
    expect(s.shieldSupport).equal(3);
    expect(s.totalTrade).equal(12);
    expect(s.tradeCorruption).equal(5);
    // A 3 × 3 island in a 5 × 5 sea, the city in the middle: each ocean square counts 1, the two worked 4 each. (The
    //  squares here are the 5 × 5 area, not Civ2's fat cross.)
    const ocean = squares.filter((tile) => tile.isWater()).length;

    expect(s.oceanTiles).equal(ocean + 6);
    expect(s.coastal).false;
    expect(s.size).equal(3);
    expect(s.policy).equal(5);
    expect(s.threatened).false;
    expect(s.staleSize).equal(0);
    expect(s.humans).eql([
      { atWar: false, citiesOnLandMass: false, badReputation: false },
    ]);
  });
});
