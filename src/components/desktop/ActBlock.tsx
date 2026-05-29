import { store as VS } from "../../store/voteStore";
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

export function ActBlock({ act, stage, top, height, dim, clash, onOpen }: Props) {
  const t = VS.tally(act.id);
  const compact = height < 48;
  const hot = t.must >= 2;
  const me = VS.getMe();
  return (
    <div
      className={
        "blk" +
        (hot ? " hot" : "") +
        (clash ? " clash" : "") +
        (dim ? " dim" : "") +
        (compact ? " compact" : "")
      }
      style={
        { top, height, "--sc": stage.color, animationDelay: Math.min(top / 3.2, 460) + "ms" } as CSSVars
      }
      onClick={(e) => onOpen(act, stage, e.currentTarget.getBoundingClientRect())}
    >
      {clash && <span className="clashtag">CLASH</span>}
      <div className="blk-t">{act.start}</div>
      <div className="blk-n">{act.name}</div>
      {!compact && t.voters.length > 0 && (
        <div className="chips">
          {t.voters.map((v) => (
            <span
              key={v.user.id}
              className={"chip " + v.tier + (v.user.id === me ? " mine" : "")}
              title={v.user.name + " · " + VS.TIERS[v.tier].label}
            >
              {v.user.init}
              <span className="chip-em">{TIER_EMOJI[v.tier]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
