import { useMemo, useRef, useState } from "react";
import { useStore } from "../../hooks/useStore";
import { store as MVS } from "../../store/voteStore";
import { FESTIVAL, mainStagesOf } from "../../data/festival";
import { MAvatars } from "./MAvatars";
import { MGrid } from "./MGrid";
import { MTray } from "./MTray";
import type { CSSVars } from "../style";
import type { Act, Stage } from "../../types";
import type { FilterMode } from "../desktop/TimeGrid";

interface Anchor {
  act: Act;
  stage: Stage;
  rect: DOMRect;
}

const FILTERS: [FilterMode, string][] = [
  ["all", "All"],
  ["picks", "Picks"],
  ["mine", "Mine"],
];

export function MobileApp() {
  useStore();
  const [dayIdx, setDayIdx] = useState(1);
  const day = FESTIVAL.days[dayIdx];
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sheet, setSheet] = useState<Anchor | null>(null);
  const visRef = useRef<Record<number, Set<string>>>({});
  const [, bump] = useState(0);
  if (!visRef.current[dayIdx]) visRef.current[dayIdx] = new Set(mainStagesOf(day));
  const visible = visRef.current[dayIdx];
  const setVisible = (n: Set<string>) => {
    visRef.current[dayIdx] = n;
    bump((x) => x + 1);
  };
  const names = day.stages.map((s) => s.name);
  const main = mainStagesOf(day);
  const allOn = visible.size === names.length;
  const isMain = visible.size === main.length && main.every((n) => visible.has(n));
  const toggle = (n: string) => {
    const x = new Set(visible);
    if (x.has(n)) {
      if (x.size > 1) x.delete(n);
    } else {
      x.add(n);
    }
    setVisible(x);
  };

  const clashSet = useMemo(() => {
    const musts: Act[] = [];
    day.stages.forEach((s) =>
      s.acts.forEach((a) => {
        if (MVS.tally(a.id).must >= 2) musts.push(a);
      }),
    );
    const set = new Set<string>();
    for (let i = 0; i < musts.length; i++)
      for (let j = i + 1; j < musts.length; j++) {
        const A = musts[i],
          B = musts[j];
        if (A.sm < B.em && B.sm < A.em) {
          set.add(A.id);
          set.add(B.id);
        }
      }
    return set;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, JSON.stringify(MVS.all())]);

  const clashes = (clashSet.size / 2) | 0;

  return (
    <div className="mroot">
      <header className="m-header">
        <div className="m-row1">
          <div className="m-brand">
            DEF<b>QON</b>.1
          </div>
          <MAvatars />
        </div>
        <div className="m-days">
          {FESTIVAL.days.map((d, i) => (
            <button
              key={d.day}
              className={"m-day" + (i === dayIdx ? " on" : "")}
              onClick={() => setDayIdx(i)}
            >
              <span className="m-day-d">{d.day.slice(0, 3)}</span>
              <span className="m-day-n">{d.date.slice(8)}</span>
            </button>
          ))}
        </div>
        <div className="m-controls">
          <div className="m-presets">
            <button
              className={"m-preset" + (isMain ? " on" : "")}
              onClick={() => setVisible(new Set(main))}
            >
              Main
            </button>
            <button
              className={"m-preset" + (allOn ? " on" : "")}
              onClick={() => setVisible(new Set(names))}
            >
              All
            </button>
          </div>
          <div className="m-seg">
            {FILTERS.map(([k, l]) => (
              <button
                key={k}
                className={"m-segbtn" + (filter === k ? " on" : "")}
                onClick={() => setFilter(k)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="m-chiprow">
          {day.stages.map((s) => {
            const on = visible.has(s.name);
            return (
              <button
                key={s.name}
                className={"m-schip" + (on ? " on" : "") + (s.minor ? " minor" : "")}
                style={{ "--sc": s.color } as CSSVars}
                onClick={() => toggle(s.name)}
              >
                <span className="m-sdot"></span>
                {s.name}
              </button>
            );
          })}
        </div>
      </header>
      <MGrid
        day={day}
        visible={visible}
        filter={filter}
        clashSet={clashSet}
        onOpen={(act, stage, rect) => setSheet({ act, stage, rect })}
      />
      {clashes > 0 && (
        <div className="m-clashbar">
          {clashes} clash{clashes > 1 ? "es" : ""} in your group picks
        </div>
      )}
      {sheet && (
        <MTray act={sheet.act} stage={sheet.stage} rect={sheet.rect} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}
