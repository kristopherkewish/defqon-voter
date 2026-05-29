import festivalJson from "./festival.json";
import type { Festival, Day } from "../types";

/**
 * Festival data, generated from the design handoff's `festival-data.js`
 * via `npm run gen:festival`. Already processed: after-midnight sm/em
 * (+1440) applied, stages sorted by position, acts by sm.
 */
export const FESTIVAL = festivalJson as unknown as Festival;

/** Format a minute-of-day value (may exceed 1440) as "HH:MM". */
export const hhmm = (m: number): string => {
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
};

/**
 * The "Main" stage preset for a day: non-minor stages with position <= 6.
 * Falls back to all non-minor stages if that yields fewer than two.
 */
export const mainStagesOf = (day: Day): string[] => {
  let m = day.stages.filter((s) => !s.minor && s.position <= 6);
  if (m.length < 2) m = day.stages.filter((s) => !s.minor);
  return m.map((s) => s.name);
};
