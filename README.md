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
- **Specialists** (`Rules/City/yield`, `specialist-available`): an Entertainer gives 2 luxuries, a Tax Collector 3
  gold, a Scientist 3 research. Below size 5 a specialist can only be made an Entertainer.
- **Production** (`Rules/City/build`, `process-yield`): Civ2's categories are units, improvements, and everything
  numbered past the Solar Plant (spaceship parts, Capitalization and Wonders). A person who changes to another category
  loses half the box, rounded down (@COSMIC's change penalty), counted from where the turn started, so changing back
  restores it; never on Chieftain. A computer player instead loses half its box, on any level, when it changes from
  anything but a Wonder to a Wonder (shields carried over included). A computer player's finished unit or improvement keeps
  what was over its cost; a person's box, and anyone's after a Wonder, starts again from 0. While a city builds
  Capitalization its shields, after waste and support, go straight into the treasury (none in disorder or Anarchy) and
  the box stays as it was; it isn't announced as waiting.
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
  without one, after more than 50 squares, or at another player's city or unit (a barbarian's unit doesn't block, nor
  does an ally's city or unit: an alliance in force by base-diplomacy's treaty level, `lib/allied`). It stops early,
  linked, at any city of the player's own. On another land mass, an airport at each end gives 1. The cost
  grid is kept per capital square until a square's terrain changes; each player's Palaces and each city's link are
  worked out again when a city is founded, captured or destroyed, an improvement is built, or a road or railroad is
  built, pillaged or removed; a unit moving onto or off the route only counts when the link is next worked out.
- **Capture** (`Rules/City/captured`, `lib/captureAftermath`, numbers in `lib/capture`): the box is emptied, Auto
  turned off and the item kept; the city loses a citizen, unless it was incited or retaken by its founder and has
  only one. The founder is Civ2's (`lib/founder`): the loser of the city's last capture, or its owner once 63 turns
  have passed since, or the player who founded it if it was never taken; kept in the save as a pending effect. A city
  captured in a game saved before this record existed keeps its original player as its founder until it is taken again.
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
- **Incite** (`Rules/City/incited`): a city captured by `InciteRevolt` raises an incident and a forced war (civ2-
  diplomacy's `incited`); by `SubvertCity` (the doubled price under a treaty) the victim holds a vendetta instead. The
  rule that captures the city calls `inciterBecomesFounder` first at the doubled price, so the capture is a liberation.
  Any capture with a person on either side (not a Barbarian) sets civ2-diplomacy's `INCIDENT` both ways.
- **Trade routes** (`Rules/City/trade-routes`, `Rules/Unit/trade-route-established`, numbers in `lib/tradeRoutes`):
  - **Income** each turn per route: (both cities' trade after corruption, without routes, + 4) >> 3, plus link ×
    value / 2 (the road link from `CapitalLink.connection`, at least 1 with Airports in both, +1 for this city's
    Superhighways), halved for an own partner; before corruption, which is worked out on the total. Each route's
    `Trade` is tagged with the partner's id. This city's base trade is worked out each time; a partner's is the one
    it kept at its last processing (`lib/baseTrade`).
  - **Delivery** (base-unit-action-establish-trade-route's `TradeRouteEstablished`): the bonus of
    `unit_caravan_trade_revenue` in gold and as much in research, 10 warmer attitudes both ways (civ2-diplomacy), and
    a route each way. A unit with no home runs from its player's nearest city (`tradeRouteHome`). Emits
    `unit:trade-route-established` (player, home, city, goods, bonus).
  - **Slots:** three a city (`TradeRouteLimit`); a full city replaces its weakest route (the partner's trade with the
    link and Airports, halved if its own) when worth no more than the new partner's trade, the first on a tie.
  - A destroyed city's routes go both ways; a captured city keeps them.
- **Auto build** (`lib/autoMode`, `Rules/City/auto-build`, `Rules/City/build-priority`, scores in
  `lib/chooseProduction`, the survey in `lib/chooseProductionState`): `setAutoMode(cityBuild, mode)` puts a city on Auto
  for anything, units only or improvements only (`'any'`, `'units'`, `'improvements'`; `null` takes it off), and
  chooses at once; the mode is a `civ2-city:auto-mode` pending effect, so it is saved, and goes when the city is
  captured or destroyed. A city on Auto chooses again when its build is finished or can't be built, and at the start
  of its player's turn while it builds nothing, with base-city-auto-build. What it chooses is Civ2's
  `city_choose_production`: each improvement's score from `city_choose_production_improvement_score`, weighed by
  `_try_improvement` (lowest wanted most, nothing over 500), as a `BuildPriority` of 501 − the score, only for a city
  on Auto. With nothing it would choose it stays on Auto (Civ2's code never clears it, for all it means to), building
  another of a unit it has just finished; the `clearWhenNothingChosen` option takes it off Auto instead.
- **Defence:** a city whose defender loses an attack loses a citizen (unless it has City Walls or its owner the Great
  Wall, the attack came from the sea, or it is a person's city on Chieftain); that is civ2-unit's rule, so it isn't
  here. `Rules/Unit/defeated` only tells the client of a defeat.

## Not yet (Civ2 M2a deviations and gaps)

- **Corruption and waste:** an alliance made or ended during a turn is seen when the link is next worked out, the next
  turn, as a unit moving onto or off the route is. Land masses are the world's as built: Civ2 recounts them when
  terrain changes. On a hexagonal grid there's no logical square axis, so the distance is the rounded straight line and
  no road links.
- **Capture:** the civil war is civ2-player's. Power ranks are taken as the capture starts (`powerRanksPriority`, before the
  civil war), not at the start of the turn, and reputation and vendettas
  aren't modelled, so Partisans are never veterans unless a ruleset passes `reputation`/`vendetta`. Not yet: a
  person's captured city starting in disorder under a Republic or Democracy, the captor's new build (Settlers for a
  computer player, the best defender when the item can't be built), the size-1 city a computer player may keep whole,
  and the "defender lost" mark on the city a disbanded unit stood in.
- **Growth limits and the Granary:** the Aqueduct (8) and Sewer System (12) caps and the Granary's or Pyramids' half
  box are civ2-city-improvement's and civ2-wonder's.
- **Fanatics** are exempt from support by their class (`base-unit-fanatic`), not by a unit flag or trait.
- **Famine:** Civ2 leaves a computer player's unseen city's settlers alone; this disbands them. No food caravans.
- **Auto build:** only improvements are scored: Civ2's Wonder and unit scores aren't ported, so units only finds
  nothing, and Wonders rank only by civ2-wonder's own `BuildPriority`. civ2-city-improvement's and civ2-wonder's
  `BuildPriority` rules (on another scale) still add to a city on Auto's ranking until they leave Auto cities alone,
  so an Auto city can choose what Civ2 wouldn't, and seldom finds nothing. No CITYPREF.TXT list. The AI's continent policy (`continent_policy`, 5 assumed), reputation, vendettas,
  power ranks (the first person stands for `best_human_rank`), subversion, the spaceship race and the AEGIS Cruiser
  aren't kept, so their terms are left out; "next to the ocean" is any ocean, not ocean body 1.
- **Trade routes:** goods are names only (`lib/tradeRoutes`'s 16 keys, picked by the unit's id): no supply or demand,
  so the demand bonus is never paid, and a city keeps one route per partner each way (the original keeps a second one
  carrying other goods). No food caravans. A homeless unit's nearest city is by the world's distance, and a unit whose player has no city earns
  nothing (the original falls back on city 0); a route never joins a city to itself. The −10 attitude both ways is
  only for players who have met (the original adjusts it regardless); entering the city makes contact first. Each
  city's base trade (`base_trade`) is kept, and saved, only when its yields are processed at the start of its
  player's turn and when it is captured; a deviation on purpose, as the original rewrites it on every `city_recalc`
  (a window opened or a unit moved included), which would make what a route earns depend on what is looked at. So a
  partner's change during a turn counts from its next processing; a city not yet processed has it worked out when
  read.
