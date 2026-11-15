/**
 * The gold a city is worth to whoever takes it (`city_treasury_share`, :4682): its share of its owner's gold by its
 *  size against the sizes of all of its owner's cities (`total_city_size`, the citizens, not the number of cities),
 *  taken before the capture changes anything. The two branches round differently: the first multiplies first, the
 *  second divides first, so a large treasury doesn't overflow. A result that does overflow is 32000. (The stage
 *  brief had "gold × size / (number of cities + 1)"; the code divides by citizens, and the code wins.)
 */
export declare const treasuryShare: (
  size: number,
  gold: number,
  totalCitySize: number
) => number;
/**
 * `int_clamp(value, lo, hi)` (`support.cpp`): `lo` raises the value, then `hi` caps it, so `hi` wins when the two
 *  cross (a treasury in debt).
 */
export declare const intClamp: (
  value: number,
  lo: number,
  hi: number
) => number;
/**
 * What is taken (`city_capture_aftermath`, :5476): the share, clamped to the gold the loser has once a computer
 *  player's Palace escape has been paid for.
 */
export declare const plunder: (share: number, gold: number) => number;
/** A player's power (`civ_update_power_ranks`, civ.cpp:3026): its military total is computed but never added. */
export declare const power: (
  advances: number,
  totalCitySize: number,
  gold: number
) => number;
/**
 * Power ranks (`civ_update_power_ranks`, civ.cpp:3072): the strongest is 7, the next 6, and so on; on a tie the
 *  earlier player ranks higher. A Barbarian player isn't ranked, and is 0 (`power_rank[0]` is never set).
 */
export declare const powerRanks: <Player>(
  powers: [Player, number][]
) => Map<Player, number>;
export interface PartisanCountInput {
  /** The city's size after its capture shrank it. */
  size: number;
  /** The two governments' indices in Civ2's order (`Governments`). */
  loserGovernment: number;
  captorGovernment: number;
  loserRank: number;
  captorRank: number;
  /** Taken by a Diplomat or Spy (`capture_mode` 1 or 2) rather than conquered. */
  incited: boolean;
  loserKnows: {
    conscription: boolean;
    guerrillaWarfare: boolean;
    communism: boolean;
    gunpowder: boolean;
  };
  captorKnowsGuerrillaWarfare: boolean;
}
/**
 * How many Partisans rise (`city_capture_aftermath_partisans`, :5251): (size + 5) / 8, times the difference in
 *  government and in power rank plus 1, halved; halved again for an incited city; one less without Conscription.
 *  Without Guerrilla Warfare the loser needs both Communism and Gunpowder for any; with it, the count doubles against
 *  a captor without it, or gains one against a captor with it. 0 or less raises none.
 */
export declare const partisanCount: ({
  size,
  loserGovernment,
  captorGovernment,
  loserRank,
  captorRank,
  incited,
  loserKnows,
  captorKnowsGuerrillaWarfare,
}: PartisanCountInput) => number;
/**
 * The odds a Partisan is a veteran (`city_capture_aftermath_partisans`, :5292): 2 when the loser holds a vendetta
 *  against the captor, plus the captor's reputation less 4; at 1 or more each Partisan is a veteran unless a roll of
 *  0 to that number comes up 0.
 */
export declare const partisanVeteranOdds: (
  vendetta: boolean,
  captorReputation: number
) => number;
/** Whether a Partisan is a veteran, from `random` in [0, 1) (`crt_rand() % (odds + 1) != 0`). */
export declare const isVeteranPartisan: (
  odds: number,
  random: number
) => boolean;
/**
 * A square's worth to a Partisan (`city_capture_aftermath_partisans`, :5303): the terrain's defence (in @TERRAIN's
 *  half steps) twice over, 1 more for a road and 1 for a railroad, and doubled by a fortress (`TILE_AIRBASE` bits
 *  equal to `TILE_FORTRESS`, so not an airbase).
 */
export declare const partisanSquareScore: (
  defenceHalfSteps: number,
  road: boolean,
  railroad: boolean,
  fortress: boolean
) => number;
/**
 * The city's squares in the order Civ2 looks at them for Partisans (`city_tile_dx_table`/`city_tile_dy_table` in
 *  CIV2.EXE at 0x628370 and 0x6283a0, indices 0 to 19: index 20, the centre, isn't searched). Civ2's map doubles x,
 *  so (1, -1) is the square to the north-east and (2, 0) the one to the east.
 */
export declare const partisanOffsets: readonly [number, number][];
/**
 * The steps from a square to one at Civ2 offset (dx, dy) (`partisanOffsets`): along the map's diagonals, (1, -1)
 *  north-east and (1, 1) south-east, which on the staggered isometric grid are its edge neighbours.
 */
export declare const offsetSteps: (
  dx: number,
  dy: number
) => ('ne' | 'se' | 'sw' | 'nw')[];
