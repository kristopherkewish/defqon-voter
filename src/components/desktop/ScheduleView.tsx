import { hhmm } from "../../data/festival";
import type { CSSVars } from "../style";
import type { Act, Stage } from "../../types";
import type { ScheduledAct } from "../../lib/schedule";

const PPM = 2.0; // px per minute — matches the grid
const GUTTER = 54;

interface Props {
  scheduled: ScheduledAct[];
  dayName: string;
  onOpen: (act: Act, stage: Stage, rect: DOMRect) => void;
}

export function ScheduleView({ scheduled, dayName, onOpen }: Props) {
  if (scheduled.length === 0) {
    return (
      <div className="gridscroll">
        <div className="sched-empty">
          No must-sees yet for <b>{dayName}</b>.
          <br />
          Tap 🔥 on acts in the grid to build your schedule.
        </div>
      </div>
    );
  }

  // Compact axis: from the first pick's start to the last pick's end, snapped to the hour.
  let lo = Infinity,
    hi = -Infinity;
  for (const s of scheduled) {
    lo = Math.min(lo, s.act.sm);
    hi = Math.max(hi, s.act.em);
  }
  lo = Math.floor(lo / 60) * 60;
  hi = Math.ceil(hi / 60) * 60;
  const H = (hi - lo) * PPM;

  const ticks: number[] = [];
  for (let m = lo; m <= hi; m += 60) ticks.push(m);

  return (
    <div className="gridscroll">
      <div className="sched">
        <div className="gutcol" style={{ width: GUTTER }}>
          <div className="colhead gutterhead">Time</div>
          <div className="gutbody" style={{ height: H }}>
            {ticks.map((m) => (
              <div key={m} className="tick" style={{ top: (m - lo) * PPM }}>
                <span>{hhmm(m)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sched-col">
          <div className="colhead sched-head">My must-sees</div>
          <div className="sched-body" style={{ height: H, backgroundSize: `100% ${60 * PPM}px` }}>
            {scheduled.map(({ act, stage, lane, cols }) => {
              const top = (act.sm - lo) * PPM;
              const height = Math.max(24, (act.em - act.sm) * PPM - 3);
              const leftPct = (lane * 100) / cols;
              const widthPct = 100 / cols;
              return (
                <div
                  key={act.id}
                  className={"sched-blk" + (cols > 1 ? " conflict" : "")}
                  style={
                    {
                      top,
                      height,
                      left: `calc(${leftPct}% + 3px)`,
                      width: `calc(${widthPct}% - 6px)`,
                      "--sc": stage.color,
                      animationDelay: Math.min(top / 3.2, 460) + "ms",
                    } as CSSVars
                  }
                  onClick={(e) => onOpen(act, stage, e.currentTarget.getBoundingClientRect())}
                >
                  <div className="sched-blk-stage">
                    <span className="sched-dot"></span>
                    <span className="sched-blk-stage-n">{stage.name}</span>
                  </div>
                  <div className="sched-blk-n">{act.name}</div>
                  <div className="sched-blk-t">
                    {act.start}–{act.end}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
