import { Anarchy } from '@civ-clone/base-government-anarchy/Anarchy';
import { Communism } from '@civ-clone/base-government-communism/Communism';
import { Democracy } from '@civ-clone/base-government-democracy/Democracy';
import { Despotism } from '@civ-clone/base-government-despotism/Despotism';
import { Fundamentalism } from '@civ-clone/base-government-fundamentalism/Fundamentalism';
import Government from '@civ-clone/core-government/Government';
import { Monarchy } from '@civ-clone/base-government-monarchy/Monarchy';
import { Republic } from '@civ-clone/base-government-republic/Republic';

export {
  Anarchy,
  Communism,
  Democracy,
  Despotism,
  Fundamentalism,
  Monarchy,
  Republic,
};

/** Civilization II's governments in its own order (civ2-rules `data/governments`), which many rules compare. */
export const governments: readonly (typeof Government)[] = [
  Anarchy,
  Despotism,
  Monarchy,
  Communism,
  Fundamentalism,
  Republic,
  Democracy,
];
