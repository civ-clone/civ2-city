# civ2-city

Civilization II's cities, on `base-city-lifecycle`: founding, the 21 squares a city works, growth and famine with
Civ2's food box, unit support, specialists, trade corruption and shield waste. The numbers in RULES.TXT come from `civ2-rules`'
effective @COSMIC values; the tables by government are civ2-government's, and the rest are in `data/cityRules.ts`, each with the OpenCiv2 function it comes from
(richardpenman/civ2@49f26ec).

- **Founding** (`Rules/City/created`): the city's build (asked for as a new city's), growth and centre; a road and
  irrigation on its square.
- **Squares** (`Rules/City/tiles`): the 21-square fat cross, by the world's own distance.
- **Growth** (`Rules/City/growth-cost`, `grow`, `shrink`, `food-storage`, `food-exhausted`): a city grows once its box
  holds (size + 1) × rows (`civ2-difficulty`'s `foodBoxRows`: 10 for the human, 15 to 8 for the computer players by
  level). A city that runs out disbands a unit that settles, or loses a citizen, and empties its box. Citizens past
  the 21 squares are specialists.
- **Upkeep** (`Rules/City/cost`): 2 food a citizen; 1 food a unit that settles up to Monarchy, 2 above; 1 shield a unit
  past the free ones (the city's size under Anarchy and Despotism, 3 under Monarchy and Communism, 8 under
  Fundamentalism, none under the Republic and Democracy), from civ2-government's `unitSupport` tables. Units whose role is diplomacy or trade cost nothing; under
  Fundamentalism a Fanatic is counted but never charged. Roles come from `base-unit-role`.
- **Each square** (`Rules/City/tile-yield`, `lib/tileYieldPipeline`): what a square gives the city working it runs
  through `CityTileYield` rules in the order of `city_tile_yield`, one priority per step, which civ2-city-improvement
  and civ2-wonder register their per-square bonuses at. civ2-city's own steps: the square's yields up to its road
  (civ2-world's), the city's square counted as mined where its terrain has no irrigation bonus and giving at least 1
  shield, the railroad's half again (on the city's square once Railroad is known), the −1 below Monarchy unless the
  city celebrates, +1 trade under the Republic and Democracy or from Monarchy up while celebrating, and pollution's
  halving. The city's worked squares and its workers' choice of squares both ask `City#tileYields`.
- **Specialists** (`Rules/City/yield`): an Entertainer gives 2 luxuries, a Tax Collector 3 gold, a Scientist 3 research.
- **Corruption** (`lib/corruption`, `Rules/City/corruption`): distance × trade × 3 / (divisor × 20), at most the trade,
  divisors 4, 5, 6, 7, 7, 8, 8 in Civ2's government order. The distance is to the player's nearest Palace by Civ2's
  measure (the longer gap plus half the shorter, `map_distance_diag`), 32 with none; Communism measures every city at
  @COSMIC's distance; a person's cities under Anarchy and Despotism add the level (up to 32); halved in the Palace's
  city; none under Fundamentalism and Democracy. A celebrating city (`lib/celebrating`) counts its government one step
  up, for the divisor and the level. The Courthouse's halving of trade corruption is civ2-city-improvement's.
- **Shield waste** (`lib/corruption`'s `shieldWaste`, the `Waste` yield, a negative `Production`): the same formula on
  the shields less their support (after the Factory's and plants' bonuses), the distance counting at most 16, halved by
  the Palace or a Courthouse, times (3 − link) / 3, over (government ÷ 2) + 1, each rounded down. None for the
  barbarians, under Fundamentalism and Democracy, or while building the Palace with no capital. It is a `Cost`, after
  the units' support, so the build gets what's left.
- **Capital link** (`lib/capitalLink`, for shield waste only): Civ2's own walk (`city_calc_capital_link`,
  `map_road_connection`). The capital is linked 1 to itself, 2 once its player knows Railroad. Another city on the same
  land mass and under 23 squares away walks the pathfinder's one shortest route over land (ties nearer the capital,
  then in Civ2's direction order): 2 if every square stepped on has a railroad, 1 if each has a road, 0 at the first
  without one, after more than 50 squares, or at another player's city or unit (a barbarian's unit doesn't block). It
  stops early, linked, at any city of the player's own. On another land mass, an airport at each end gives 1. The cost
  grid is kept per capital square until a square's terrain changes; the walk itself is fresh each time.
- **Capture** (`Rules/City/captured`, `lib/captureAftermath`, numbers in `lib/capture`): the box is emptied, Auto
  turned off and the item kept; the city loses a citizen, unless it was incited or retaken by its founder and has
  only one.
  - **Plunder:** the captor takes size × the loser's gold / (the loser's citizens in all its cities + 1), from before
    the capture, clamped to the gold the loser has left after a Palace escape; Barbarians take it but keep none.
    Emits `city:plundered` (city, captor, loser, amount).
  - **Units the city supported:** Partisans lose their home; a computer player's only Defend-role unit in another of
    its cities is rehomed there; the rest are disbanded.
  - **Partisans:** when the city survives, the loser has a city left, the captor isn't its founder (or a Spy's
    subverting Diplomat), and the loser is Communist or a Democracy, knows Communism, or anyone knows Guerrilla
    Warfare: (size + 5) / 8 × (government and power-rank differences + 1) / 2, halved when incited, −1 without
    Conscription, none without Guerrilla Warfare unless the loser knows Communism and Gunpowder, then doubled against
    a captor without Guerrilla Warfare or +1 against one with it. Each goes fortified to the best free land square of
    the city's 20 (terrain defence × 2, +1 road, +1 railroad, × 2 fortress), Civ2's square order on a tie. Emits
    `city:partisans` (city, loser, units, captor).
- **Defence:** a city whose defender loses an attack loses a citizen (unless it has City Walls or its owner the Great
  Wall, the attack came from the sea, or it is a person's city on Chieftain); that is civ2-unit's rule, so it isn't
  here. `Rules/Unit/defeated` only tells the client of a defeat.

## Not yet (Civ2 M2a deviations and gaps)

- **Civ1-shaped specialists:** no "Entertainers only below size 5".
- **Corruption and waste:** no alliances in civ2 yet, so every other player's city and unit blocks the capital link
  (`CapitalLink`'s `allied` option). Land masses are the world's as built: Civ2 recounts them when terrain changes. On a
  hexagonal grid there's no logical square axis, so the distance is the rounded straight line and no road links.
- **Capture:** the city's founder is its original player (Civ2 records the last owner before each capture); no civil
  war. Power ranks are taken as the capture starts, not at the start of the turn, and reputation and vendettas
  aren't modelled, so Partisans are never veterans unless a ruleset passes `reputation`/`vendetta`. Not yet: a
  person's captured city starting in disorder under a Republic or Democracy, the captor's new build (Settlers for a
  computer player, the best defender when the item can't be built), the size-1 city a computer player may keep whole,
  and the "defender lost" mark on the city a disbanded unit stood in.
- **Growth limits and the Granary:** the Aqueduct (8) and Sewer System (12) caps and the Granary's or Pyramids' half
  box are civ2-city-improvement's and civ2-wonder's.
- **The computer players' late-game food box:** after turn 200, above Warlord, Civ2 takes up to 2 rows off while a
  person leads (civ2-difficulty's `foodBoxRows` leaves it out).
- **Fanatics** are exempt from support by their class (`base-unit-fanatic`), not by a unit flag or trait.
- **A city destroyed** (`city_delete`) disbands the units it supported: no partisans and no rehoming.
- **Defence:** City Walls and the Great Wall don't spare the city yet (civ2-city-improvement, civ2-wonder).
- **Famine:** Civ2 leaves a computer player's unseen city's settlers alone; this disbands them. No food caravans.
- **Auto build:** a city on Auto doesn't choose for itself (`building-cancelled`, `building-complete` and turn-start
  auto rules: R3b).
- **Trade routes:** none in M2a.
