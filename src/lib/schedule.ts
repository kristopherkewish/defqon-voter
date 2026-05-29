import type { Act, Day, Stage } from "../types";

/** A must-see pick placed into a lane for the single-column schedule view. */
export interface ScheduledAct {
  act: Act;
  stage: Stage;
  lane: number; // 0-based column within its overlap cluster
  cols: number; // number of columns (lanes) in its cluster; >1 means it overlaps another pick
}

/** Collect the acts the predicate marks (with their stage), sorted by start then end. */
export function collectMustSees(
  day: Day,
  isMust: (actId: string) => boolean,
): { act: Act; stage: Stage }[] {
  const items: { act: Act; stage: Stage }[] = [];
  for (const stage of day.stages) {
    for (const act of stage.acts) {
      if (isMust(act.id)) items.push({ act, stage });
    }
  }
  items.sort((a, b) => a.act.sm - b.act.sm || a.act.em - b.act.em);
  return items;
}

/**
 * Lay sorted picks into side-by-side lanes. Picks that overlap in time form a
 * cluster; within a cluster each pick takes the first lane whose previous act
 * has already ended (greedy interval partitioning, which uses exactly the
 * minimum number of lanes = the cluster's max concurrency). Every pick in a
 * cluster shares that `cols` count, so they split the column width equally.
 */
export function layoutSchedule(items: { act: Act; stage: Stage }[]): ScheduledAct[] {
  const out: ScheduledAct[] = [];
  let i = 0;
  while (i < items.length) {
    // Grow a cluster of transitively-overlapping picks (items are start-sorted).
    let clusterEnd = items[i].act.em;
    let j = i + 1;
    while (j < items.length && items[j].act.sm < clusterEnd) {
      clusterEnd = Math.max(clusterEnd, items[j].act.em);
      j++;
    }
    const cluster = items.slice(i, j);

    // Greedy lane assignment within the cluster.
    const laneEnds: number[] = []; // laneEnds[l] = end minute of the last act in lane l
    const lanes: number[] = []; // chosen lane index, per cluster item
    for (const it of cluster) {
      let placed = laneEnds.findIndex((end) => end <= it.act.sm);
      if (placed === -1) {
        placed = laneEnds.length;
        laneEnds.push(it.act.em);
      } else {
        laneEnds[placed] = it.act.em;
      }
      lanes.push(placed);
    }
    const cols = laneEnds.length;
    cluster.forEach((it, k) =>
      out.push({ act: it.act, stage: it.stage, lane: lanes[k], cols }),
    );
    i = j;
  }
  return out;
}

/** Build the current user's must-see schedule for a day, laid out into lanes. */
export function buildSchedule(day: Day, isMust: (actId: string) => boolean): ScheduledAct[] {
  return layoutSchedule(collectMustSees(day, isMust));
}
