/**
 * Inter-stage walking distances for Defqon.1 2026.
 *
 * Source: F:\Personal\DQVoter\STAGE_DISTANCES.md — 11 fixed physical stage
 * locations whose *names rotate per day*. The matrix is therefore indexed by
 * physical position, using a canonical label per position (the Thursday name).
 * NOTE: the festival data's `stage.position` is a broadcast ranking, not a
 * physical location, so we map by stage NAME, not by that field.
 *
 * Distances are straight-line metres (centroid-to-centroid); real walks are a
 * bit longer. Good enough for ranking/tiebreaks.
 */

export type Canon =
  | "PURPLE"
  | "RED"
  | "UV"
  | "BLUE"
  | "YELLOW"
  | "MAGENTA"
  | "OLD" // "Orange Light District" (no performance acts)
  | "INDIGO"
  | "GOLD"
  | "BROWN"
  | "BLACK";

const LABELS: Canon[] = [
  "PURPLE", "RED", "UV", "BLUE", "YELLOW", "MAGENTA", "OLD", "INDIGO", "GOLD", "BROWN", "BLACK",
];

// Symmetric metre matrix in LABELS order (diagonal 0).
const M: number[][] = [
  [0, 195, 225, 380, 215, 290, 300, 305, 340, 435, 455],
  [195, 0, 385, 530, 175, 405, 385, 280, 360, 420, 370],
  [225, 385, 0, 155, 290, 120, 175, 310, 280, 385, 475],
  [380, 530, 155, 0, 405, 145, 205, 385, 320, 405, 535],
  [215, 175, 290, 405, 0, 260, 225, 105, 180, 250, 245],
  [290, 405, 120, 145, 260, 0, 65, 240, 185, 280, 395],
  [300, 385, 175, 205, 225, 65, 0, 180, 120, 215, 330],
  [305, 280, 310, 385, 105, 240, 180, 0, 90, 145, 170],
  [340, 360, 280, 320, 180, 185, 120, 90, 0, 105, 210],
  [435, 420, 385, 405, 250, 280, 215, 145, 105, 0, 155],
  [455, 370, 475, 535, 245, 395, 330, 170, 210, 155, 0],
];

const IDX = Object.fromEntries(LABELS.map((l, i) => [l, i])) as Record<Canon, number>;

/** Crowd-realistic walking pace (metres per minute) for the est. walk time. */
export const WALK_MPM = 70;

/** Map a day's festival stage name to its canonical physical-position label. */
export function canonFor(dayName: string, stageName: string): Canon | null {
  const n = stageName.toLowerCase();
  const sunday = dayName === "Sunday";

  let canon: Canon | null = null;
  if (n.includes("closing ceremony")) canon = "RED";
  else if (n.includes("light district")) canon = "OLD";
  else if (n.includes("stampkroeg")) canon = null;
  else if (n.includes("purple")) canon = "PURPLE";
  else if (n.includes("u.v") || /\buv\b/.test(n)) canon = "UV";
  else if (n.includes("red")) canon = "RED";
  else if (n.includes("blue")) canon = "BLUE";
  else if (n.includes("yellow")) canon = "YELLOW";
  else if (n.includes("magenta")) canon = "MAGENTA";
  else if (n.includes("gold")) canon = "GOLD";
  else if (n.includes("indigo")) canon = "INDIGO";
  else if (n.includes("green")) canon = "INDIGO"; // #8 rotates Indigo/Green
  else if (n.includes("orange") || n.includes("silver") || n.includes("pink") || n.includes("brown"))
    canon = "BROWN"; // #10 rotates Brown/Orange/Silver/Pink
  else if (n.includes("black")) canon = "BLACK";

  // Sunday swaps the Black/UV pair (physical #3 and #11 trade names).
  if (sunday) {
    if (canon === "BLACK") canon = "UV";
    else if (canon === "UV") canon = "BLACK";
  }
  return canon;
}

/** Straight-line metres between two stages on a day; 0 if same, null if unmapped. */
export function stageDistance(dayName: string, a: string, b: string): number | null {
  const ca = canonFor(dayName, a);
  const cb = canonFor(dayName, b);
  if (!ca || !cb) return null;
  return M[IDX[ca]][IDX[cb]];
}

/** Estimated walk time in minutes for a metre distance. */
export const walkMinutes = (metres: number): number => Math.max(1, Math.round(metres / WALK_MPM));
