import { hhmm } from "../../data/festival";
import { layoutSchedule } from "../../lib/schedule";
import type { Recommendation } from "../../lib/recommend";
import type { CSSVars } from "../style";
import type { Act, Stage } from "../../types";

const PPM = 2.0;
const GUTTER = 54;

interface Props {
  recommendation: Recommendation;
  dayName: string;
  onOpen: (act: Act, stage: Stage, rect: DOMRect) => void;
}

export function RecommendedView({ recommendation, dayName, onOpen }: Props) {
  const { picks } = recommendation;
  if (picks.length === 0) {
    return (
      <div className="gridscroll">
        <div className="sched-empty">
          No votes yet for <b>{dayName}</b>.
          <br />
          Once the group reacts to acts, a recommended route appears here.
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
          <div className="colhead sched-head">Recommended</div>
          <div className="sched-body" style={{ height: H, backgroundSize: `100% ${60 * PPM}px` }}>
            {laid.map(({ act, stage, lane, cols }) => {
              const rec = byId.get(act.id)!;
              const top = (act.sm - lo) * PPM;
              const height = Math.max(30, (act.em - act.sm) * PPM - 3);
              const leftPct = (lane * 100) / cols;
              const widthPct = 100 / cols;
              return (
                <div
                  key={act.id}
                  className="sched-blk rec-blk"
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
                  {rec.walkMetres != null && rec.walkMetres > 0 && (
                    <div className="rec-walk">
                      🚶 {rec.walkMetres} m{rec.fromStage ? ` from ${rec.fromStage}` : ""} · ~{rec.walkMinutes} min
                    </div>
                  )}
                  <div className="sched-blk-stage">
                    <span className="sched-dot"></span>
                    <span className="sched-blk-stage-n">{stage.name}</span>
                  </div>
                  <div className="sched-blk-n">{act.name}</div>
                  <div className="rec-blk-bottom">
                    <span className="sched-blk-t">
                      {act.start}–{act.end}
                    </span>
                    <span className="rec-badge">
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
