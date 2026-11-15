import { Land, Water } from '@civ-clone/core-terrain/Types';
import FillGenerator from '@civ-clone/core-world/tests/lib/FillGenerator';
import LandMassRegistry from '@civ-clone/core-world/LandMassRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import World from '@civ-clone/core-world/World';

/** A generator that lays out `rows`: `.` (or any letter) land, `~` water. */
class MapGenerator extends FillGenerator {
  #rows: string[];

  constructor(rows: string[], options: { [key: string]: any } = {}) {
    super(rows.length, rows[0].length, Land, options);

    this.#rows = rows;
  }

  async generate(): Promise<Terrain[]> {
    return this.#rows.flatMap((row: string): Terrain[] =>
      row
        .split('')
        .map(
          (square: string): Terrain =>
            square === '~' ? new Water() : new Land()
        )
    );
  }
}

/** A world laid out as `rows`, its land masses in `landMassRegistry`. */
export const mapWorld = (
  rows: string[],
  ruleRegistry: RuleRegistry,
  landMassRegistry: LandMassRegistry,
  options: { [key: string]: any } = {}
): Promise<World> =>
  new World(
    new MapGenerator(rows, options),
    ruleRegistry,
    landMassRegistry
  ).build();

export default mapWorld;
