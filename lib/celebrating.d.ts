import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';
/** civ2-city-happiness' status for a city celebrating its leader (`CITYF_CELEBRATING`), named here so civ2-city needn't depend on it. */
export declare const LEADER_CELEBRATION =
  'civ2-city-happiness:leader-celebration';
/** Whether `city` is celebrating its leader: whether civ2-city-happiness has recorded the status on it. */
export declare const celebrating: (
  city: City,
  pendingEffects?: PendingEffectRegistry
) => boolean;
export default celebrating;
