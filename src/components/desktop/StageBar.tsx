import { useMemo } from "react";
import { mainStagesOf } from "../../data/festival";
import type { CSSVars } from "../style";
import type { Day } from "../../types";

interface Props {
  day: Day;
  visible: Set<string>;
  setVisible: (next: Set<string>) => void;
}

export function StageBar({ day, visible, setVisible }: Props) {
  const names = day.stages.map((s) => s.name);
  const main = useMemo(() => mainStagesOf(day), [day]);
  const allOn = visible.size === names.length;
  const isMain = visible.size === main.length && main.every((n) => visible.has(n));

  const toggle = (n: string) => {
    const next = new Set(visible);
    if (next.has(n)) {
      if (next.size > 1) next.delete(n);
    } else {
      next.add(n);
    }
    setVisible(next);
  };

  return (
    <div className="stagebar">
      <div className="presets">
        <button className={"preset" + (isMain ? " on" : "")} onClick={() => setVisible(new Set(main))}>
          Main
        </button>
        <button className={"preset" + (allOn ? " on" : "")} onClick={() => setVisible(new Set(names))}>
          All
        </button>
      </div>
      <div className="stagechips">
        {day.stages.map((s) => {
          const on = visible.has(s.name);
          return (
            <button
              key={s.name}
              className={"schip" + (on ? " on" : "") + (s.minor ? " minor" : "")}
              style={{ "--sc": s.color } as CSSVars}
              onClick={() => toggle(s.name)}
              title={s.name}
            >
              <span className="sdot"></span>
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
