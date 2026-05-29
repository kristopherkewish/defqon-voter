import type { TierKey } from "../types";

/** Tier → emoji. Change here to remap the reaction icons everywhere. */
export const TIER_EMOJI: Record<TierKey, string> = {
  must: "🔥",
  maybe: "🤔",
  skip: "💤",
};
