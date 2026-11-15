"use strict";
// The numbers of a city's capture, as Civilization II has them (OpenCiv2 `src/auto/city.cpp`
//  `city_capture_aftermath` and its parts, richardpenman/civ2@49f26ec). Each takes plain numbers, so the rules in
//  `Rules/City/captured` only gather them.
Object.defineProperty(exports, "__esModule", { value: true });
exports.offsetSteps = exports.partisanOffsets = exports.partisanSquareScore = exports.isVeteranPartisan = exports.partisanVeteranOdds = exports.partisanCount = exports.powerRanks = exports.power = exports.plunder = exports.intClamp = exports.treasuryShare = void 0;
/** C's integer division, which rounds towards 0. */
const div = (a, b) => Math.trunc(a / b);
/**
 * The gold a city is worth to whoever takes it (`city_treasury_share`, :4682): its share of its owner's gold by its
 *  size against the sizes of all of its owner's cities (`total_city_size`, the citizens, not the number of cities),
 *  taken before the capture changes anything. The two branches round differently: the first multiplies first, the
 *  second divides first, so a large treasury doesn't overflow. A result that does overflow is 32000. (The stage
 *  brief had "gold × size / (number of cities + 1)"; the code divides by citizens, and the code wins.)
 */
const treasuryShare = (size, gold, totalCitySize) => {
    const share = gold < div(32000, size)
        ? div(size * gold, totalCitySize + 1)
        : div(gold, totalCitySize + 1) * size;
    return share < 0 ? 32000 : share;
};
exports.treasuryShare = treasuryShare;
/**
 * `int_clamp(value, lo, hi)` (`support.cpp`): `lo` raises the value, then `hi` caps it, so `hi` wins when the two
 *  cross (a treasury in debt).
 */
const intClamp = (value, lo, hi) => Math.min(Math.max(value, lo), hi);
exports.intClamp = intClamp;
/**
 * What is taken (`city_capture_aftermath`, :5476): the share, clamped to the gold the loser has once a computer
 *  player's Palace escape has been paid for.
 */
const plunder = (share, gold) => (0, exports.intClamp)(share, 0, gold);
exports.plunder = plunder;
/** A player's power (`civ_update_power_ranks`, civ.cpp:3026): its military total is computed but never added. */
const power = (advances, totalCitySize, gold) => advances * 3 + totalCitySize * 8 + Math.floor(gold / 32);
exports.power = power;
/**
 * Power ranks (`civ_update_power_ranks`, civ.cpp:3072): the strongest is 7, the next 6, and so on; on a tie the
 *  earlier player ranks higher. A Barbarian player isn't ranked, and is 0 (`power_rank[0]` is never set).
 */
const powerRanks = (powers) => {
    const remaining = powers.map(([, value]) => value), ranks = new Map();
    for (let rank = 1; rank <= powers.length; rank++) {
        let best = -1, bestIndex = 0;
        remaining.forEach((value, index) => {
            if (best < value) {
                best = value;
                bestIndex = index;
            }
        });
        ranks.set(powers[bestIndex][0], 8 - rank);
        remaining[bestIndex] = -1;
    }
    return ranks;
};
exports.powerRanks = powerRanks;
/**
 * How many Partisans rise (`city_capture_aftermath_partisans`, :5251): (size + 5) / 8, times the difference in
 *  government and in power rank plus 1, halved; halved again for an incited city; one less without Conscription.
 *  Without Guerrilla Warfare the loser needs both Communism and Gunpowder for any; with it, the count doubles against
 *  a captor without it, or gains one against a captor with it. 0 or less raises none.
 */
const partisanCount = ({ size, loserGovernment, captorGovernment, loserRank, captorRank, incited, loserKnows, captorKnowsGuerrillaWarfare, }) => {
    const governmentDifference = Math.abs(loserGovernment - captorGovernment), rankDifference = Math.abs(loserRank - captorRank);
    let count = div(div(size + 5, 8) * (governmentDifference + rankDifference + 1), 2);
    if (incited) {
        count = div(count, 2);
    }
    if (!loserKnows.conscription) {
        count--;
    }
    if (!loserKnows.guerrillaWarfare) {
        if (!loserKnows.communism) {
            count = 0;
        }
        if (!loserKnows.gunpowder) {
            count = 0;
        }
    }
    else if (!captorKnowsGuerrillaWarfare) {
        count *= 2;
    }
    else {
        count++;
    }
    return count;
};
exports.partisanCount = partisanCount;
/**
 * The odds a Partisan is a veteran (`city_capture_aftermath_partisans`, :5292): 2 when the loser holds a vendetta
 *  against the captor, plus the captor's reputation less 4; at 1 or more each Partisan is a veteran unless a roll of
 *  0 to that number comes up 0.
 */
const partisanVeteranOdds = (vendetta, captorReputation) => Math.max(0, (vendetta ? 2 : 0) + captorReputation - 4);
exports.partisanVeteranOdds = partisanVeteranOdds;
/** Whether a Partisan is a veteran, from `random` in [0, 1) (`crt_rand() % (odds + 1) != 0`). */
const isVeteranPartisan = (odds, random) => odds >= 1 && Math.floor(random * (odds + 1)) !== 0;
exports.isVeteranPartisan = isVeteranPartisan;
/**
 * A square's worth to a Partisan (`city_capture_aftermath_partisans`, :5303): the terrain's defence (in @TERRAIN's
 *  half steps) twice over, 1 more for a road and 1 for a railroad, and doubled by a fortress (`TILE_AIRBASE` bits
 *  equal to `TILE_FORTRESS`, so not an airbase).
 */
const partisanSquareScore = (defenceHalfSteps, road, railroad, fortress) => {
    const score = defenceHalfSteps * 2 + (road ? 1 : 0) + (railroad ? 1 : 0);
    return fortress ? score * 2 : score;
};
exports.partisanSquareScore = partisanSquareScore;
/**
 * The city's squares in the order Civ2 looks at them for Partisans (`city_tile_dx_table`/`city_tile_dy_table` in
 *  CIV2.EXE at 0x628370 and 0x6283a0, indices 0 to 19: index 20, the centre, isn't searched). Civ2's map doubles x,
 *  so (1, -1) is the square to the north-east and (2, 0) the one to the east.
 */
exports.partisanOffsets = [
    [1, -1],
    [2, 0],
    [1, 1],
    [0, 2],
    [-1, 1],
    [-2, 0],
    [-1, -1],
    [0, -2],
    [2, -2],
    [2, 2],
    [-2, 2],
    [-2, -2],
    [1, -3],
    [3, -1],
    [3, 1],
    [1, 3],
    [-1, 3],
    [-3, 1],
    [-3, -1],
    [-1, -3],
];
/**
 * The steps from a square to one at Civ2 offset (dx, dy) (`partisanOffsets`): along the map's diagonals, (1, -1)
 *  north-east and (1, 1) south-east, which on the staggered isometric grid are its edge neighbours.
 */
const offsetSteps = (dx, dy) => {
    const northEast = (dx - dy) / 2, southEast = (dx + dy) / 2;
    return [
        ...new Array(Math.abs(northEast)).fill(northEast > 0 ? 'ne' : 'sw'),
        ...new Array(Math.abs(southEast)).fill(southEast > 0 ? 'se' : 'nw'),
    ];
};
exports.offsetSteps = offsetSteps;
//# sourceMappingURL=capture.js.map