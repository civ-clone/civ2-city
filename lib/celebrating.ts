import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';
import { cityStatus } from '@civ-clone/base-city-happiness-status/lib/cityStatus';

/** civ2-city-happiness' status for a city celebrating its leader (`CITYF_CELEBRATING`), named here so civ2-city needn't depend on it. */
export const LEADER_CELEBRATION = 'civ2-city-happiness:leader-celebration';

/** Whether `city` is celebrating its leader: whether civ2-city-happiness has recorded the status on it. */
export const celebrating = (
  city: City,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): boolean => cityStatus(LEADER_CELEBRATION, city, pendingEffects) !== null;

export default celebrating;
