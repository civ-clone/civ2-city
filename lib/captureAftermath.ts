import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  PlayerRegistry,
  instance as playerRegistryInstance,
} from '@civ-clone/core-player/PlayerRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  PlayerTreasuryRegistry,
  instance as playerTreasuryRegistryInstance,
} from '@civ-clone/core-treasury/PlayerTreasuryRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  UnitImprovementRegistry,
  instance as unitImprovementRegistryInstance,
} from '@civ-clone/core-unit-improvement/UnitImprovementRegistry';
import {
  isVeteranPartisan,
  offsetSteps,
  partisanCount,
  partisanOffsets,
  partisanSquareScore,
  partisanVeteranOdds,
  plunder,
  power,
  powerRanks,
  treasuryShare,
} from './capture';
import Advance from '@civ-clone/core-science/Advance';
import Airbase from '@civ-clone/base-tile-improvement-airbase/Airbase';
import BusyFortified from '@civ-clone/base-unit-action-fortify/Rules/Fortified';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import Communism from '@civ-clone/base-science-advance-communism/Communism';
import {
  Communism as CommunismGovernment,
  Democracy,
  governments,
} from '../Governments';
import Conscription from '@civ-clone/base-science-advance-conscription/Conscription';
import Criterion from '@civ-clone/core-rule/Criterion';
import { DefendRole } from '@civ-clone/base-unit-role/Roles';
import Effect from '@civ-clone/core-rule/Effect';
import { Engine } from '@civ-clone/core-engine/Engine';
import Fortified from '@civ-clone/base-unit-improvement-fortified/UnitImprovements/Fortified';
import Fortress from '@civ-clone/base-tile-improvement-fortress/Fortress';
import Gold from '@civ-clone/base-city-yield-gold/Gold';
import GuerrillaWarfare from '@civ-clone/base-science-advance-guerrillawarfare/GuerrillaWarfare';
import Gunpowder from '@civ-clone/base-science-advance-gunpowder/Gunpowder';
import { High } from '@civ-clone/core-rule/Priorities';
import InciteRevolt from '@civ-clone/base-unit-action-incite-revolt/InciteRevolt';
import Partisan from '@civ-clone/base-unit-partisan/Partisan';
import Player from '@civ-clone/core-player/Player';
import PlayerTreasury from '@civ-clone/core-treasury/PlayerTreasury';
import Priority from '@civ-clone/core-rule/Priority';
import Railroad from '@civ-clone/base-tile-improvement-railroad/Railroad';
import Road from '@civ-clone/base-tile-improvement-road/Road';
import SubvertCity from '@civ-clone/base-unit-action-incite-revolt/SubvertCity';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Veteran from '@civ-clone/base-unit-improvement-veteran/UnitImprovements/Veteran';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import { founderOf, recordCapture } from './founder';
import { destroyUnits } from '@civ-clone/base-city-lifecycle/lib/destroyed';
import { governmentOf } from './government';
import { hasRole } from '@civ-clone/base-unit-role/roleOf';
import isBarbarian from '@civ-clone/base-civilization-barbarian/isBarbarian';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';
import { instance as rngInstance } from '@civ-clone/core-random';
import { terrainIndex } from '@civ-clone/civ2-world/lib/terrainTable';
import { terrains } from '@civ-clone/civ2-world/data/terrain';

export interface CaptureDependencies {
  cityRegistry?: CityRegistry;
  clientRegistry?: ClientRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  playerRegistry?: PlayerRegistry;
  playerResearchRegistry?: PlayerResearchRegistry;
  playerTreasuryRegistry?: PlayerTreasuryRegistry;
  ruleRegistry?: RuleRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  unitImprovementRegistry?: UnitImprovementRegistry;
  randomNumberGenerator?: () => number;
  pendingEffectRegistry?: PendingEffectRegistry;
  turn?: Turn;
  /** Civ2's `civs[].reputation` (higher is worse), which nothing models yet: 0, a clean record, unless given. */
  reputation?: (player: Player) => number;
  /** Whether `player` holds a vendetta against `against` (`TREATY_VENDETTA`), which nothing models yet: never, unless given. */
  vendetta?: (player: Player, against: Player) => boolean;
}

export const withCaptureDefaults = ({
  cityRegistry = cityRegistryInstance,
  clientRegistry = clientRegistryInstance,
  playerGovernmentRegistry = playerGovernmentRegistryInstance,
  playerRegistry = playerRegistryInstance,
  playerResearchRegistry = playerResearchRegistryInstance,
  playerTreasuryRegistry = playerTreasuryRegistryInstance,
  ruleRegistry = ruleRegistryInstance,
  tileImprovementRegistry = tileImprovementRegistryInstance,
  unitImprovementRegistry = unitImprovementRegistryInstance,
  randomNumberGenerator = rngInstance,
  pendingEffectRegistry = pendingEffectRegistryInstance,
  turn = turnInstance,
  reputation = (): number => 0,
  vendetta = (): boolean => false,
}: CaptureDependencies = {}): Required<CaptureDependencies> => ({
  cityRegistry,
  clientRegistry,
  playerGovernmentRegistry,
  playerRegistry,
  playerResearchRegistry,
  playerTreasuryRegistry,
  ruleRegistry,
  tileImprovementRegistry,
  unitImprovementRegistry,
  randomNumberGenerator,
  pendingEffectRegistry,
  turn,
  reputation,
  vendetta,
});

/**
 * After every `Normal` rule of a capture (civ2-city-improvement's Palace escape, which spends the loser's gold first,
 *  and civ2-science's stolen advance, which the Partisans' count reads) and before civ2-wonder's `Low` Leonardo's
 *  Workshop, which comes last in `city_capture_aftermath`. Plunder, then Partisans, as the original runs them.
 */
export const plunderPriority = 2500;

const waitingBeforePlunder: WeakMap<City, Promise<unknown>[]> = new WeakMap();

/**
 * Holds `city`'s plunder until `pending` settles: a choice the loser makes at the capture that spends its gold first,
 *  such as civ2-city-improvement's Palace escape (`city_capture_aftermath` :5462-5475 runs the escape before the
 *  plunder, which is capped to what's left). Call it from a `Captured` rule that runs before `plunderPriority`; the
 *  plunder waits for every promise registered for the capture to settle, and forgets them.
 *
 * Nothing of this is saved: a game saved while such a question is still open, and loaded again, never takes that
 *  capture's plunder.
 */
export const waitBeforePlunder = (
  city: City,
  pending: Promise<unknown>
): void => {
  waitingBeforePlunder.set(city, [
    ...(waitingBeforePlunder.get(city) ?? []),
    pending,
  ]);
};
export const partisansPriority = 2600;

/**
 * The power ranks the Partisans' count reads are taken before every other rule of a capture, a civil war's included
 *  (civ2-player's runs at 900): Civ2's are from the start of the turn (`civ_update_power_ranks`, read by `_partisans`
 *  :5254), before the rebels exist.
 */
export const powerRanksPriority = 500;
export const founderPriority = 2700;

interface Snapshot {
  share: number;
}

// The city's plunder share as it was before any of civ2-city's own capture rules changed it, taken at `High`.
const snapshots = new WeakMap<City, Snapshot>();

// The power ranks before any rule of the capture changed anything, taken at `powerRanksPriority`.
const rankSnapshots = new WeakMap<City, Map<Player, number>>();

/**
 * Plunder, the units the city supported, and Partisans: OpenCiv2 `src/auto/city.cpp` `city_capture_aftermath`
 *  (0057b5df) and its `_announce`, `_rehome_units` and `_partisans` parts (richardpenman/civ2@49f26ec).
 */
export const captureRules = (
  unitRegistry: UnitRegistry,
  cityGrowthRegistry: CityGrowthRegistry,
  engine: Engine,
  {
    cityRegistry,
    clientRegistry,
    playerGovernmentRegistry,
    playerRegistry,
    playerResearchRegistry,
    playerTreasuryRegistry,
    ruleRegistry,
    tileImprovementRegistry,
    unitImprovementRegistry,
    randomNumberGenerator,
    pendingEffectRegistry,
    turn,
    reputation,
    vendetta,
  }: Required<CaptureDependencies>
): Captured[] => {
  const dependencies = { pendingEffectRegistry, playerRegistry, turn };

  const goldOf = (player: Player): PlayerTreasury | null =>
      playerTreasuryRegistry
        .getByPlayer(player)
        .find((treasury) => treasury.yield() === Gold) ?? null,
    sizeOf = (city: City): number => cityGrowthRegistry.getByCity(city).size(),
    // A Barbarian knows no advance (`civ_has_advance` answers 0 for civ 0).
    knows = (player: Player, AdvanceType: typeof Advance): boolean => {
      if (isBarbarian(player)) {
        return false;
      }

      try {
        return playerResearchRegistry
          .getByPlayer(player)
          .completed(AdvanceType);
      } catch (e) {
        return false;
      }
    },
    advancesOf = (player: Player): number => {
      try {
        return playerResearchRegistry.getByPlayer(player).complete().length;
      } catch (e) {
        return 0;
      }
    },
    // `game.first_discoverer`: anyone has found it.
    discovered = (AdvanceType: typeof Advance): boolean =>
      playerRegistry
        .entries()
        .some((player: Player) => knows(player, AdvanceType)),
    // The city is the captor's when the rules run (`City#capture`); Civ2 still counts it as the loser's here.
    totalCitySize = (player: Player, city: City, loser: Player): number =>
      cityRegistry
        .getByPlayer(player)
        .filter((other: City) => other !== city)
        .reduce((total: number, other: City) => total + sizeOf(other), 0) +
      (player === loser ? sizeOf(city) : 0);

  return [
    // The power ranks, first of all: Civ2's are from the start of the turn (`civ_update_power_ranks`), which nothing
    //  keeps, so this is the nearest moment, before anything of the capture (a civil war, say) changes them.
    new Captured(
      'civ2-city:city/captured/power-ranks',
      new Priority(powerRanksPriority),
      new Effect((city: City, captor: Player, loser: Player): void => {
        rankSnapshots.set(
          city,
          powerRanks(
            playerRegistry
              .entries()
              .filter((player: Player) => !isBarbarian(player))
              .map((player: Player): [Player, number] => [
                player,
                power(
                  advancesOf(player),
                  totalCitySize(player, city, loser),
                  goldOf(player)?.value() ?? 0
                ),
              ])
          )
        );
      })
    ),

    // `city_treasury_share` is taken before civ2-city's other rules, from the city's size and its owner's gold (after
    //  a civil war, which `city_capture_aftermath` decides first, has taken half of it).
    new Captured(
      'civ2-city:city/captured/plunder-share',
      new High(),
      new Effect((city: City, captor: Player, loser: Player): void => {
        const size = sizeOf(city),
          gold = goldOf(loser)?.value() ?? 0;

        snapshots.set(city, {
          share: treasuryShare(size, gold, totalCitySize(loser, city, loser)),
        });
      })
    ),

    // The share is clamped to what the loser has left (a computer player may have paid 1,000 for its Palace to
    //  escape) and moves to the captor. Barbarians take it from the loser but don't keep it (`if (civ != 0)`).
    new Captured(
      'civ2-city:city/captured/plunder',
      new Priority(plunderPriority),
      new Effect((city: City, captor: Player, loser: Player): void => {
        const snapshot = snapshots.get(city);

        if (!snapshot) {
          return;
        }

        // The loser's gold is read when the plunder is taken, so a Palace escape a person has yet to answer (civ2-city-
        //  improvement, `waitBeforePlunder`) is paid for first, as `city_capture_aftermath` (:5462-5475) does.
        const take = (): void => {
            const loserGold = goldOf(loser);

            if (loserGold === null) {
              return;
            }

            const amount = plunder(snapshot.share, loserGold.value());

            loserGold.subtract(amount);

            if (!isBarbarian(captor)) {
              goldOf(captor)?.add(amount);
            }

            if (amount !== 0) {
              engine.emit('city:plundered', city, captor, loser, amount);
            }
          },
          pending = waitingBeforePlunder.get(city);

        waitingBeforePlunder.delete(city);

        if (!pending || pending.length === 0) {
          take();

          return;
        }

        // Settled, not resolved: a rejected answer doesn't take the plunder before the others are in.
        Promise.allSettled(pending).then(take);
      })
    ),

    // `_rehome_units` (:5114), after the city has shrunk and only if it's still there: of the units the city
    //  supported (not those that defected with an incited city, which are the captor's), Partisans lose their home and
    //  are kept; a computer player's unit with the Defend role that is the only one in another city it stands in is
    //  rehomed there; every other is disbanded. Civ2 looks at them from the newest down, starting again after each
    //  one it disbands, so a second defender in the same city is kept once the first is gone.
    new Captured(
      'civ2-city:city/captured/rehome-units',
      new Effect((city: City, captor: Player, loser: Player): void => {
        if (city.destroyed()) {
          return;
        }

        const human = isHuman(loser, clientRegistry),
          seen = new Set<Unit>();

        for (;;) {
          const units = unitRegistry
            .getByCity(city)
            .filter(
              (unit: Unit) =>
                unit.player() === loser && !unit.destroyed() && !seen.has(unit)
            );

          if (units.length === 0) {
            return;
          }

          const unit = units[units.length - 1];

          seen.add(unit);

          if (unit instanceof Partisan) {
            unit.setCity(null as unknown as City);

            continue;
          }

          const standsIn = cityRegistry.getByTile(unit.tile());

          if (
            !human &&
            standsIn !== null &&
            standsIn !== city &&
            standsIn.player() === loser &&
            hasRole(unit, DefendRole, ruleRegistry) &&
            unitRegistry
              .getByTile(unit.tile())
              .filter((other: Unit) => hasRole(other, DefendRole, ruleRegistry))
              .length === 1
          ) {
            unit.setCity(standsIn);

            continue;
          }

          destroyUnits([unit]);
        }
      })
    ),

    // `_partisans` (:5225), called when the city is still there, the loser has a city left (Barbarians always do:
    //  `civ_check_destroyed` answers 0 for them), the captor isn't the city's founder (a Spy's subverted city has
    //  just been made the captor's), and the loser is Communist or a Democracy, or knows Communism, or anyone has
    //  found Guerrilla Warfare. Checked in the `Effect`: every `Criterion` is evaluated before any `Effect` runs.
    new Captured(
      'civ2-city:city/captured/partisans',
      new Priority(partisansPriority),
      new Criterion(
        (city: City, captor: Player, loser: Player, cause: unknown): boolean =>
          founderOf(city, loser, dependencies) !== captor &&
          !(cause instanceof SubvertCity)
      ),
      new Effect(
        (city: City, captor: Player, loser: Player, cause: unknown): void => {
          const ranks = rankSnapshots.get(city) ?? new Map<Player, number>();

          snapshots.delete(city);
          rankSnapshots.delete(city);

          if (
            city.destroyed() ||
            (!isBarbarian(loser) &&
              cityRegistry.getByPlayer(loser).length === 0)
          ) {
            return;
          }

          const loserGovernment = governmentOf(loser, playerGovernmentRegistry),
            communistOrDemocracy = [CommunismGovernment, Democracy].includes(
              governments[loserGovernment]
            );

          if (
            !communistOrDemocracy &&
            !discovered(GuerrillaWarfare) &&
            !knows(loser, Communism)
          ) {
            return;
          }

          const count = partisanCount({
              size: sizeOf(city),
              loserGovernment,
              captorGovernment: governmentOf(captor, playerGovernmentRegistry),
              loserRank: ranks.get(loser) ?? 0,
              captorRank: ranks.get(captor) ?? 0,
              incited: cause instanceof InciteRevolt,
              loserKnows: {
                conscription: knows(loser, Conscription),
                guerrillaWarfare: knows(loser, GuerrillaWarfare),
                communism: knows(loser, Communism),
                gunpowder: knows(loser, Gunpowder),
              },
              captorKnowsGuerrillaWarfare: knows(captor, GuerrillaWarfare),
            }),
            odds = partisanVeteranOdds(
              vendetta(loser, captor),
              reputation(captor)
            ),
            squares = partisanSquares(city),
            taken = new Set<Tile>(),
            created: Unit[] = [];

          for (let index = 0; index < count; index++) {
            let best = 0,
              bestTile: Tile | null = null;

            squares.forEach((tile: Tile) => {
              if (
                tile.isWater() ||
                taken.has(tile) ||
                cityRegistry.getByTile(tile) !== null ||
                unitRegistry.getByTile(tile).length > 0
              ) {
                return;
              }

              const improvements = tileImprovementRegistry.getByTile(tile),
                has = (Type: Function): boolean =>
                  improvements.some(
                    (improvement) => improvement instanceof Type
                  ),
                score = partisanSquareScore(
                  terrains[terrainIndex(tile.terrain())]?.[1] ?? 0,
                  has(Road),
                  has(Railroad),
                  has(Fortress) && !has(Airbase)
                );

              if (best < score) {
                best = score;
                bestTile = tile;
              }
            });

            if (bestTile === null) {
              continue;
            }

            taken.add(bestTile);

            const partisan = new Partisan(null, loser, bestTile, ruleRegistry),
              home = homeFor(bestTile);

            // Homed after it's made, so no rule for a unit built in a city (a Barracks) sees it.
            if (home !== null && home.player() === loser) {
              partisan.setCity(home);
            }

            partisan.setActive(false);
            partisan.setBusy(new BusyFortified(new Criterion(() => false)));
            unitImprovementRegistry.register(new Fortified(partisan));

            if (
              isVeteranPartisan(odds, odds >= 1 ? randomNumberGenerator() : 0)
            ) {
              unitImprovementRegistry.register(new Veteran(partisan));
            }

            created.push(partisan);
          }

          if (created.length > 0) {
            engine.emit('city:partisans', city, loser, created, captor);
          }
        }
      )
    ),

    // Last, the loser becomes the city's founder as Civ2 counts it (`cities[city].founder = civ2`, ~5538), for the next
    //  capture's `was_founder` (`lib/founder`).
    new Captured(
      'civ2-city:city/captured/founder',
      new Priority(founderPriority),
      new Effect((city: City, captor: Player, loser: Player): void => {
        if (city.destroyed()) {
          return;
        }

        recordCapture(city, loser, dependencies);
      })
    ),
  ];

  /**
   * The city's squares in Civ2's order (`partisanOffsets`), reached along the map's diagonals; on a grid where
   *  those don't land in the city's own squares, the rest of its squares follow in their own order.
   */
  function partisanSquares(city: City): Tile[] {
    const own = city.tiles().entries(),
      centre = city.tile(),
      ordered: Tile[] = [];

    partisanOffsets.forEach(([dx, dy]) => {
      try {
        const tile = offsetSteps(dx, dy).reduce(
          (from: Tile, direction) => from.getNeighbour(direction),
          centre
        );

        if (tile !== centre && own.includes(tile) && !ordered.includes(tile)) {
          ordered.push(tile);
        }
      } catch (e) {
        // Off the edge of a world that doesn't wrap.
      }
    });

    own
      .filter((tile: Tile) => tile !== centre && !ordered.includes(tile))
      .forEach((tile: Tile) => ordered.push(tile));

    return ordered;
  }

  /**
   * `unit_create`'s home: the nearest city of anyone's (the last of equals), if it's the unit's owner's. Measured by
   *  the world's own distance rather than Civ2's `map_distance_diag`.
   */
  function homeFor(tile: Tile): City | null {
    let nearest: City | null = null,
      nearestDistance = Infinity;

    cityRegistry.entries().forEach((city: City) => {
      if (city.destroyed()) {
        return;
      }

      const distance = tile.distanceFrom(city.tile());

      if (distance <= nearestDistance) {
        nearest = city;
        nearestDistance = distance;
      }
    });

    return nearest;
  }
};

export default captureRules;
