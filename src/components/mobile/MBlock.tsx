import { store as MVS } from "../../store/voteStore";
import { TIER_EMOJI } from "../constants";
import type { CSSVars } from "../style";
import type { Act, Stage } from "../../types";

interface Props {
  act: Act;
  stage: Stage;
  top: number;
  height: number;
  dim: boolean;
  clash: boolean;
  onOpen: (act: Act, stage: Stage, rect: DOMRect) => void;
}

export function MBlock({ act, stage, top, height, dim, clash, onOpen }: Props) {
  const t = MVS.tally(act.id);
  const compact = height < 42;
  const hot = t.must >= 2;
  const me = MVS.getMe();
  return (
    <div
      className={
        "m-blk" +
        (hot ? " hot" : "") +
        (clash ? " clash" : "") +
        (dim ? " dim" : "") +
        (compact ? " compact" : "")
      }
      style={
        { top, height, "--sc": stage.color, animationDelay: Math.min(top / 3.2, 440) + "ms" } as CSSVars
      }
      onClick={(e) => onOpen(act, stage, e.currentTarget.getBoundingClientRect())}
    >
      {clash && <span className="m-clashtag">CLASH</span>}
      <div className="m-blk-t">{act.start}</div>
      <div className="m-blk-n">{act.name}</div>
      {!compact && t.voters.length > 0 && (
        <div className="m-chips">
          {t.voters.map((v) => (
            <span key={v.user.id} className={"m-chip " + v.tier + (v.user.id === me ? " mine" : "")}>
              {v.user.init}
              <span className="m-chip-em">{TIER_EMOJI[v.tier]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
