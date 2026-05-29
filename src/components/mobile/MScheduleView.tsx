import { hhmm } from "../../data/festival";
import type { CSSVars } from "../style";
import type { Act, Stage } from "../../types";
import type { ScheduledAct } from "../../lib/schedule";

const MPPM = 1.7;
const MGUT = 44;

interface Props {
  scheduled: ScheduledAct[];
  dayName: string;
  onOpen: (act: Act, stage: Stage, rect: DOMRect) => void;
}

export function MScheduleView({ scheduled, dayName, onOpen }: Props) {
  if (scheduled.length === 0) {
    return (
      <div className="m-gridscroll">
        <div className="m-sched-empty">
          No must-sees yet for <b>{dayName}</b>.
          <br />
          Tap 🔥 on acts to build your schedule.
        </div>
      </div>
    );
  }

  let lo = Infinity,
    hi = -Infinity;
  for (const s of scheduled) {
    lo = Math.min(lo, s.act.sm);
    hi = Math.max(hi, s.act.em);
  }
  lo = Math.floor(lo / 60) * 60;
  hi = Math.ceil(hi / 60) * 60;
  const H = (hi - lo) * MPPM;

  const ticks: number[] = [];
  for (let m = lo; m <= hi; m += 60) ticks.push(m);

  return (
    <div className="m-gridscroll">
      <div className="m-sched">
        <div className="m-gutcol" style={{ width: MGUT }}>
          <div className="m-colhead m-gutterhead"></div>
          <div className="m-gutbody" style={{ height: H }}>
            {ticks.map((m) => (
              <div key={m} className="m-tick" style={{ top: (m - lo) * MPPM }}>
                <span>{hhmm(m)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="m-sched-col">
          <div className="m-colhead m-sched-head">My must-sees</div>
          <div className="m-sched-body" style={{ height: H, backgroundSize: `100% ${60 * MPPM}px` }}>
            {scheduled.map(({ act, stage, lane, cols }) => {
              const top = (act.sm - lo) * MPPM;
              const height = Math.max(22, (act.em - act.sm) * MPPM - 3);
              const leftPct = (lane * 100) / cols;
              const widthPct = 100 / cols;
              return (
                <div
                  key={act.id}
                  className={"m-sched-blk" + (cols > 1 ? " conflict" : "")}
                  style={
                    {
                      top,
                      height,
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      "--sc": stage.color,
                      animationDelay: Math.min(top / 3.2, 440) + "ms",
                    } as CSSVars
                  }
                  onClick={(e) => onOpen(act, stage, e.currentTarget.getBoundingClientRect())}
                >
                  <div className="m-sched-blk-stage">
                    <span className="m-sched-dot"></span>
                    <span className="m-sched-blk-stage-n">{stage.name}</span>
                  </div>
                  <div className="m-sched-blk-n">{act.name}</div>
                  <div className="m-sched-blk-t">
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
