import { useMemo } from "react";
import { useStore } from "../../hooks/useStore";
import { store as VS } from "../../store/voteStore";
import { hhmm } from "../../data/festival";
import { ActBlock } from "./ActBlock";
import type { CSSVars } from "../style";
import type { Act, Day, Stage } from "../../types";

const PPM = 2.0; // px per minute
const GUTTER = 54; // time gutter width

export type FilterMode = "all" | "picks" | "mine";

interface Props {
  day: Day;
  visible: Set<string>;
  filter: FilterMode;
  clashSet: Set<string>;
  onOpen: (act: Act, stage: Stage, rect: DOMRect) => void;
}

export function TimeGrid({ day, visible, filter, clashSet, onOpen }: Props) {
  useStore();
  const me = VS.getMe();
  // axis bounds from ALL acts of the day (stable regardless of visibility)
  const bounds = useMemo(() => {
    let lo = Infinity,
      hi = -Infinity;
    day.stages.forEach((s) =>
      s.acts.forEach((a) => {
        lo = Math.min(lo, a.sm);
        hi = Math.max(hi, a.em);
      }),
    );
    lo = Math.floor(lo / 60) * 60;
    hi = Math.ceil(hi / 60) * 60;
    return { lo, hi };
  }, [day]);
  const H = (bounds.hi - bounds.lo) * PPM;

  const ticks: number[] = [];
  for (let m = bounds.lo; m <= bounds.hi; m += 60) ticks.push(m);

  const cols = day.stages.filter((s) => visible.has(s.name));

  const matchFilter = (a: Act): boolean => {
    if (filter === "all") return true;
    const t = VS.tally(a.id);
    if (filter === "picks") return t.must >= 1;
    if (filter === "mine") {
      const v = VS.votesFor(a.id)[me];
      return v === "must" || v === "maybe";
    }
    return true;
  };

  return (
    <div className="gridscroll">
      <div className="grid" style={{ minHeight: H + 40 }}>
        <div className="gutcol" style={{ width: GUTTER }}>
          <div className="colhead gutterhead">Time</div>
          <div className="gutbody" style={{ height: H }}>
            {ticks.map((m) => (
              <div key={m} className="tick" style={{ top: (m - bounds.lo) * PPM }}>
                <span>{hhmm(m)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="cols">
          {cols.map((s) => (
            <div key={s.name} className={"col" + (s.minor ? " minor" : "")}>
              <div className="colhead" style={{ "--sc": s.color } as CSSVars}>
                <span className="sdot"></span>
                <span className="colhead-n">{s.name}</span>
              </div>
              <div
                className="colbody"
                style={{ height: H, backgroundSize: `100% ${60 * PPM}px` }}
              >
                {s.acts.map((a) => {
                  const top = (a.sm - bounds.lo) * PPM;
                  const height = Math.max(24, (a.em - a.sm) * PPM - 3);
                  return (
                    <ActBlock
                      key={a.id}
                      act={a}
                      stage={s}
                      top={top}
                      height={height}
                      dim={!matchFilter(a)}
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
