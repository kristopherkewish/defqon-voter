import { useMemo } from "react";
import { useStore } from "../../hooks/useStore";
import { store as MVS } from "../../store/voteStore";
import { hhmm } from "../../data/festival";
import { MBlock } from "./MBlock";
import type { CSSVars } from "../style";
import type { Act, Day, Stage } from "../../types";
import type { FilterMode } from "../desktop/TimeGrid";

const MPPM = 1.7;
const MGUT = 44;
const MCOL = 150;

interface Props {
  day: Day;
  visible: Set<string>;
  filter: FilterMode;
  clashSet: Set<string>;
  onOpen: (act: Act, stage: Stage, rect: DOMRect) => void;
}

export function MGrid({ day, visible, filter, clashSet, onOpen }: Props) {
  useStore();
  const me = MVS.getMe();
  const bounds = useMemo(() => {
    let lo = Infinity,
      hi = -Infinity;
    day.stages.forEach((s) =>
      s.acts.forEach((a) => {
        lo = Math.min(lo, a.sm);
        hi = Math.max(hi, a.em);
      }),
    );
    return { lo: Math.floor(lo / 60) * 60, hi: Math.ceil(hi / 60) * 60 };
  }, [day]);
  const H = (bounds.hi - bounds.lo) * MPPM;
  const ticks: number[] = [];
  for (let m = bounds.lo; m <= bounds.hi; m += 60) ticks.push(m);
  const cols = day.stages.filter((s) => visible.has(s.name));
  const match = (a: Act): boolean => {
    if (filter === "all") return true;
    const t = MVS.tally(a.id);
    if (filter === "picks") return t.must >= 1;
    if (filter === "mine") {
      const v = MVS.votesFor(a.id)[me];
      return v === "must" || v === "maybe";
    }
    return true;
  };
  return (
    <div className="m-gridscroll">
      <div className="m-grid">
        <div className="m-gutcol" style={{ width: MGUT }}>
          <div className="m-colhead m-gutterhead"></div>
          <div className="m-gutbody" style={{ height: H }}>
            {ticks.map((m) => (
              <div key={m} className="m-tick" style={{ top: (m - bounds.lo) * MPPM }}>
                <span>{hhmm(m)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="m-cols">
          {cols.map((s) => (
            <div key={s.name} className={"m-col" + (s.minor ? " minor" : "")} style={{ width: MCOL }}>
              <div className="m-colhead" style={{ "--sc": s.color } as CSSVars}>
                <span className="m-sdot"></span>
                <span className="m-colhead-n">{s.name}</span>
              </div>
              <div
                className="m-colbody"
                style={{ height: H, backgroundSize: `100% ${60 * MPPM}px` }}
              >
                {s.acts.map((a) => {
                  const top = (a.sm - bounds.lo) * MPPM;
                  const height = Math.max(22, (a.em - a.sm) * MPPM - 3);
                  return (
                    <MBlock
                      key={a.id}
                      act={a}
                      stage={s}
                      top={top}
                      height={height}
                      dim={!match(a)}
                      clash={clashSet.has(a.id)}
                      onOpen={onOpen}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
