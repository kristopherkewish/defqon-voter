import { useMemo, useRef, useState } from "react";
import { useStore } from "../../hooks/useStore";
import { store as VS } from "../../store/voteStore";
import { FESTIVAL, mainStagesOf } from "../../data/festival";
import { VoterToggle } from "./VoterToggle";
import { StageBar } from "./StageBar";
import { TimeGrid, type FilterMode } from "./TimeGrid";
import { ReactTray } from "./ReactTray";
import type { Act, Stage } from "../../types";

interface Anchor {
  act: Act;
  stage: Stage;
  rect: DOMRect;
}

const FILTERS: [FilterMode, string][] = [
  ["all", "All"],
  ["picks", "Group picks"],
  ["mine", "My picks"],
];

export function DesktopApp() {
  useStore();
  const [dayIdx, setDayIdx] = useState(1); // Friday default
  const day = FESTIVAL.days[dayIdx];
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sheet, setSheet] = useState<Anchor | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // per-day stage visibility, lazily initialised to "Main"
  const visRef = useRef<Record<number, Set<string>>>({});
  const [, bump] = useState(0);
  if (!visRef.current[dayIdx]) visRef.current[dayIdx] = new Set(mainStagesOf(day));
  const visible = visRef.current[dayIdx];
  const setVisible = (next: Set<string>) => {
    visRef.current[dayIdx] = next;
    bump((n) => n + 1);
  };

  // live clash set: acts with >=2 group must-votes that overlap another such act
  const clashSet = useMemo(() => {
    const musts: Act[] = [];
    day.stages.forEach((s) =>
      s.acts.forEach((a) => {
        if (VS.tally(a.id).must >= 2) musts.push(a);
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
  }, [day, JSON.stringify(VS.all())]);

  const mustCount = useMemo(() => {
    let c = 0;
    day.stages.forEach((s) =>
      s.acts.forEach((a) => {
        if (VS.tally(a.id).must >= 1) c++;
      }),
    );
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day, JSON.stringify(VS.all())]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          DEF<b>QON</b>.1 <span className="brand-sub">VOTER</span>
        </div>
        <nav className="daytabs">
          {FESTIVAL.days.map((d, i) => (
            <button
              key={d.day}
              className={"daytab" + (i === dayIdx ? " on" : "")}
              onClick={() => setDayIdx(i)}
            >
              <span className="dt-day">{d.day.slice(0, 3)}</span>
              <span className="dt-date">{d.date.slice(8)}</span>
            </button>
          ))}
        </nav>
        <div className="top-right">
          <VoterToggle />
          <div className="menuwrap">
            <button className="iconbtn" onClick={() => setMenuOpen((o) => !o)} title="Options">
              ⋯
            </button>
            {menuOpen && (
              <div className="menu" onMouseLeave={() => setMenuOpen(false)}>
                <button
                  onClick={() => {
                    VS.loadSample();
                    setMenuOpen(false);
                  }}
                >
                  Load sample votes
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    if (window.confirm("Clear ALL votes for everyone?")) VS.reset();
                    setMenuOpen(false);
                  }}
                >
                  Reset all votes
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="subbar">
        <StageBar day={day} visible={visible} setVisible={setVisible} />
        <div className="subbar-right">
          <div className="seg">
            {FILTERS.map(([k, l]) => (
              <button
                key={k}
                className={"segbtn" + (filter === k ? " on" : "")}
                onClick={() => setFilter(k)}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="stats">
            <span className="stat">
              <b>{mustCount}</b> must-sees
            </span>
            <span className={"stat clashstat" + (clashSet.size ? " active" : "")}>
              <b>{(clashSet.size / 2) | 0}</b> clashes
            </span>
          </div>
        </div>
      </div>

      <TimeGrid
        day={day}
        visible={visible}
        filter={filter}
        clashSet={clashSet}
        onOpen={(act, stage, rect) => setSheet({ act, stage, rect })}
      />

      {sheet && (
        <ReactTray
          act={sheet.act}
          stage={sheet.stage}
          rect={sheet.rect}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
