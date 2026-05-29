import type { Act, Day, Stage, Tally } from "../types";

/** A set chosen for the recommended group itinerary, with route annotations. */
export interface RecommendedAct {
  act: Act;
  stage: Stage;
  must: number;
  maybe: number;
  /** Walk from the previous sequential pick (the one you'd come from). */
  fromStage: string | null;
  walkMetres: number | null;
  walkMinutes: number | null;
}

export interface Recommendation {
  picks: RecommendedAct[]; // sorted by start time
  setCount: number;
  mustCovered: number;
  totalWalkMetres: number;
}

const DIST_FALLBACK = 280; // ~median spacing, used when a stage can't be mapped

const overlapMin = (a: Act, b: Act): number =>
  Math.min(a.em, b.em) - Math.max(a.sm, b.sm);

/**
 * Two overlapping sets only *hard*-clash when attending both would leave you
 * under 30 minutes of one OR the other (capped at each set's own length).
 * Smaller overlaps are fine — you watch part of one, then walk to the other.
 */
export function hardClash(a: Act, b: Act): boolean {
  const ov = overlapMin(a, b);
  if (ov <= 0) return false;
  const durA = a.em - a.sm;
  const durB = b.em - b.sm;
  return durA - ov < Math.min(30, durA) && durB - ov < Math.min(30, durB);
}

interface Cand {
  act: Act;
  stage: Stage;
  must: number;
  maybe: number;
  score: number;
}

/**
 * Greedy group recommendation: take the most-voted sets first (must, then
 * maybe), skipping any that hard-clash with an already-chosen set; among
 * equally-voted options prefer the one closest to where you already are.
 */
export function recommendSchedule(
  day: Day,
  tally: (actId: string) => Tally,
  distance: (stageA: string, stageB: string) => number | null,
  walkMin: (metres: number) => number,
): Recommendation {
  // 1. candidates: any act with at least one must/maybe vote
  const cands: Cand[] = [];
  for (const stage of day.stages) {
    for (const act of stage.acts) {
      const t = tally(act.id);
      const score = t.must * 10 + t.maybe;
      if (score > 0) cands.push({ act, stage, must: t.must, maybe: t.maybe, score });
    }
  }

  // Sets with any must-see vote — a maybe-only set yields its whole window to
  // any of these it overlaps (must-sees always win over maybes).
  const mustActs = cands.filter((c) => c.must > 0).map((c) => c.act);

  // 2. greedy by score tier (highest first); distance breaks ties within a tier
  const tiers = [...new Set(cands.map((c) => c.score))].sort((a, b) => b - a);
  const chosen: Cand[] = [];

  const distToRoute = (c: Cand): number => {
    if (chosen.length === 0) return c.act.sm; // seed: earliest start
    // temporally-nearest already-chosen set
    let best: Cand | null = null;
    let bestGap = Infinity;
    for (const s of chosen) {
      const ov = overlapMin(c.act, s.act);
      const gap = ov > 0 ? 0 : Math.min(Math.abs(c.act.sm - s.act.em), Math.abs(s.act.sm - c.act.em));
      if (gap < bestGap) {
        bestGap = gap;
        best = s;
      }
    }
    const d = best ? distance(c.stage.name, best.stage.name) : null;
    return d ?? DIST_FALLBACK;
  };

  for (const tier of tiers) {
    const pool = cands.filter((c) => c.score === tier);
    while (pool.length > 0) {
      // pick the pool entry closest to the current route (tiebreak: earlier start)
      let pick = pool[0];
      let pickKey = distToRoute(pick);
      for (const c of pool) {
        const k = distToRoute(c);
        if (k < pickKey || (k === pickKey && c.act.sm < pick.act.sm)) {
          pick = c;
          pickKey = k;
        }
      }
      pool.splice(pool.indexOf(pick), 1);
      if (chosen.some((s) => hardClash(pick.act, s.act))) continue;
      // a maybe-only set can't take a window that overlaps any must-see set
      if (pick.must === 0 && mustActs.some((a) => overlapMin(pick.act, a) > 0)) continue;
      chosen.push(pick);
    }
  }

  // 3. order by start, then annotate route/walk info
  chosen.sort((a, b) => a.act.sm - b.act.sm || a.act.em - b.act.em);

  const picks: RecommendedAct[] = chosen.map((c) => {
    // previous *sequential* pick (largest em that ends by this start)
    let prev: Cand | null = null;
    for (const o of chosen) {
      if (o === c) continue;
      if (o.act.em <= c.act.sm && (!prev || o.act.em > prev.act.em)) prev = o;
    }
    let fromStage: string | null = null;
    let walkMetres: number | null = null;
    let walkMinutes: number | null = null;
    if (prev) {
      walkMetres = distance(prev.stage.name, c.stage.name);
      if (walkMetres != null) {
        fromStage = prev.stage.name;
        walkMinutes = walkMin(walkMetres);
      }
    }
    return {
      act: c.act,
      stage: c.stage,
      must: c.must,
      maybe: c.maybe,
      fromStage,
      walkMetres,
      walkMinutes,
    };
  });

  return {
    picks,
    setCount: picks.length,
    mustCovered: picks.reduce((sum, p) => sum + p.must, 0),
    totalWalkMetres: picks.reduce((sum, p) => sum + (p.walkMetres ?? 0), 0),
  };
}
