# civ2-city

Civilization II's cities, on `base-city-lifecycle`: founding, the 21 squares a city works, growth and famine with
Civ2's food box, unit support, specialists and trade corruption. The numbers in RULES.TXT come from `civ2-rules`'
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
- **Specialists** (`Rules/City/yield`): an Entertainer gives 2 luxuries, a Tax Collector 3 gold, a Scientist 3 research.
- **Corruption** (`lib/corruption`): distance × trade × 3 / (divisor × 20), divisors 4, 5, 6, 7, 7, 8, 8 in Civ2's
  government order; Communism measures every city at @COSMIC's distance; a person's cities under Anarchy and
  Despotism add the level; none under Fundamentalism and Democracy; halved in the Palace's city.
- **Capture** (`Rules/City/captured`): the box is emptied, Auto turned off and the item kept; the city loses a citizen,
  unless it was incited or retaken by its founder and has only one.
- **Defence** (`Rules/Unit/defeated`): a city whose defender loses an attack loses a citizen, unless the attack came
  from the sea or the city is a person's on Chieftain.

## Not yet (Civ2 M2a deviations and gaps)

- **Civ1-shaped specialists:** no "Entertainers only below size 5".
- **Civ1-shaped corruption:** trade only. No shield waste or capital link, no celebration step in the divisor, no
  Courthouse halving (civ2-city-improvement), and the distance is the world's own, not Civ2's diagonal measure.
- **City square:** irrigation and a road, as Civ1's; Civ2's mine bonus where the terrain can't be irrigated and the
  centre's farmland aren't modelled.
- **Capture:** the city's founder is its original player (Civ2 records the last owner before each capture); no plunder, lost improvements, stolen advance, partisans or civil war; the previous owner's units are
  disbanded, not rehomed.
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
