import { useMemo, useRef, useState } from "react";
import { useStore } from "../../hooks/useStore";
import { store as VS } from "../../store/voteStore";
import { FESTIVAL, mainStagesOf } from "../../data/festival";
import { VoterToggle } from "./VoterToggle";
import { StageBar } from "./StageBar";
import { TimeGrid, type FilterMode } from "./TimeGrid";
import { ScheduleView } from "./ScheduleView";
import { RecommendedView } from "./RecommendedView";
import { ReactTray } from "./ReactTray";
import { buildSchedule } from "../../lib/schedule";
import { recommendSchedule } from "../../lib/recommend";
import { stageDistance, walkMinutes } from "../../data/stageDistances";
import type { Act, Stage } from "../../types";

type View = "grid" | "schedule" | "recommended";

const VIEWS: [View, string][] = [
  ["grid", "Grid"],
  ["schedule", "My schedule"],
  ["recommended", "Recommended"],
];

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
  const [view, setView] = useState<View>("grid");
  const [sheet, setSheet] = useState<Anchor | null>(null);

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

  // current user's must-see schedule for the day (laid out into overlap lanes)
  const me = VS.getMe();
  const scheduled = useMemo(
    () => buildSchedule(day, (id) => VS.votesFor(id)[me] === "must"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day, me, JSON.stringify(VS.all())],
  );
  const conflicts = scheduled.filter((s) => s.cols > 1).length;

  // group recommendation (cheap; recomputed when votes or day change)
  const recommendation = useMemo(
    () =>
      recommendSchedule(
        day,
        (id) => VS.tally(id),
        (a, b) => stageDistance(day.day, a, b),
        walkMinutes,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day, JSON.stringify(VS.all())],
  );

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
        </div>
      </header>

      <div className="subbar">
        {view === "grid" && <StageBar day={day} visible={visible} setVisible={setVisible} />}
        <div className="subbar-right">
          <div className="viewtoggle">
            {VIEWS.map(([v, label]) => (
              <button
                key={v}
                className={"vt-btn" + (view === v ? " on" : "")}
                onClick={() => setView(v)}
              >
                {label}
              </button>
            ))}
          </div>
          {view === "grid" && (
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
          )}
          <div className="stats">
            {view === "grid" && (
              <>
                <span className="stat">
                  <b>{mustCount}</b> must-sees
                </span>
                <span className={"stat clashstat" + (clashSet.size ? " active" : "")}>
                  <b>{(clashSet.size / 2) | 0}</b> clashes
                </span>
              </>
            )}
            {view === "schedule" && (
              <>
                <span className="stat">
                  <b>{scheduled.length}</b> must-sees
                </span>
                <span className={"stat clashstat" + (conflicts ? " active" : "")}>
                  <b>{conflicts}</b> conflicts
                </span>
              </>
            )}
            {view === "recommended" && (
              <>
                <span className="stat">
                  <b>{recommendation.setCount}</b> sets
                </span>
                <span className="stat">
                  ~<b>{recommendation.totalWalkMetres}</b> m walk
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {view === "grid" && (
        <TimeGrid
          day={day}
          visible={visible}
          filter={filter}
          clashSet={clashSet}
          onOpen={(act, stage, rect) => setSheet({ act, stage, rect })}
        />
      )}
      {view === "schedule" && (
        <ScheduleView
          scheduled={scheduled}
          dayName={day.day}
          onOpen={(act, stage, rect) => setSheet({ act, stage, rect })}
        />
      )}
      {view === "recommended" && (
        <RecommendedView
          recommendation={recommendation}
          dayName={day.day}
          onOpen={(act, stage, rect) => setSheet({ act, stage, rect })}
        />
      )}

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
