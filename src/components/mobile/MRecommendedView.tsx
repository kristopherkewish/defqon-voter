import { hhmm } from "../../data/festival";
import { layoutSchedule } from "../../lib/schedule";
import type { Recommendation } from "../../lib/recommend";
import type { CSSVars } from "../style";
import type { Act, Stage } from "../../types";

const MPPM = 1.7;
const MGUT = 44;

interface Props {
  recommendation: Recommendation;
  dayName: string;
  onOpen: (act: Act, stage: Stage, rect: DOMRect) => void;
}

export function MRecommendedView({ recommendation, dayName, onOpen }: Props) {
  const { picks } = recommendation;
  if (picks.length === 0) {
    return (
      <div className="m-gridscroll">
        <div className="m-sched-empty">
          No votes yet for <b>{dayName}</b>.
          <br />
          A recommended route appears once the group votes.
        </div>
      </div>
    );
  }

  const byId = new Map(picks.map((p) => [p.act.id, p]));
  const laid = layoutSchedule(picks.map((p) => ({ act: p.act, stage: p.stage })));

  let lo = Infinity,
    hi = -Infinity;
  for (const p of picks) {
    lo = Math.min(lo, p.act.sm);
    hi = Math.max(hi, p.act.em);
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
          <div className="m-colhead m-sched-head">Recommended</div>
          <div className="m-sched-body" style={{ height: H, backgroundSize: `100% ${60 * MPPM}px` }}>
            {laid.map(({ act, stage, lane, cols }) => {
              const rec = byId.get(act.id)!;
              const top = (act.sm - lo) * MPPM;
              const height = Math.max(30, (act.em - act.sm) * MPPM - 3);
              const leftPct = (lane * 100) / cols;
              const widthPct = 100 / cols;
              return (
                <div
                  key={act.id}
                  className="m-sched-blk m-rec-blk"
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
                  {rec.walkMetres != null && rec.walkMetres > 0 && (
                    <div className="m-rec-walk">
                      🚶 {rec.walkMetres} m · ~{rec.walkMinutes} min
                    </div>
                  )}
                  <div className="m-sched-blk-stage">
                    <span className="m-sched-dot"></span>
                    <span className="m-sched-blk-stage-n">{stage.name}</span>
                  </div>
                  <div className="m-sched-blk-n">{act.name}</div>
                  <div className="m-rec-blk-bottom">
                    <span className="m-sched-blk-t">
                      {act.start}–{act.end}
                    </span>
                    <span className="m-rec-badge">
                      🔥{rec.must}
                      {rec.maybe > 0 ? ` 🤔${rec.maybe}` : ""}
                    </span>
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
