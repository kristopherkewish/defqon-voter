import { useStore } from "../../hooks/useStore";
import { store as VS } from "../../store/voteStore";
import { TIER_EMOJI } from "../constants";
import type { CSSVars } from "../style";
import type { Act, Stage, TierKey } from "../../types";

interface Props {
  act: Act;
  stage: Stage;
  rect: DOMRect;
  onClose: () => void;
}

export function ReactTray({ act, rect, onClose }: Props) {
  useStore();
  const me = VS.getMe();
  const meUser = VS.user(me);
  const mine = VS.votesFor(act.id)[me] || null;
  const pick = (tier: TierKey) => {
    VS.setVote(act.id, me, mine === tier ? null : tier);
    onClose();
  };
  const W = 176;
  const above = rect.top > 96;
  const top = above ? rect.top - 70 : rect.bottom + 10;
  let left = rect.left + rect.width / 2 - W / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - W - 8));
  return (
    <>
      <div className="tray-catch" onClick={onClose}></div>
      <div className={"tray " + (above ? "above" : "below")} style={{ top, left, width: W }}>
        <span className="tray-as" style={{ "--vc": meUser.color } as CSSVars}>
          {meUser.init}
        </span>
        {Object.values(VS.TIERS).map((tier) => (
          <button
            key={tier.key}
            className={"tray-btn " + tier.key + (mine === tier.key ? " on" : "")}
            onClick={() => pick(tier.key)}
          >
            <span className="tray-em">{TIER_EMOJI[tier.key]}</span>
            <span className="tray-lb">{tier.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
