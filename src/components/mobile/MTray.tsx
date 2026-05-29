import { useStore } from "../../hooks/useStore";
import { store as MVS } from "../../store/voteStore";
import { TIER_EMOJI } from "../constants";
import type { CSSVars } from "../style";
import type { Act, Stage, TierKey } from "../../types";

interface Props {
  act: Act;
  stage: Stage;
  rect: DOMRect;
  onClose: () => void;
}

export function MTray({ act, rect, onClose }: Props) {
  useStore();
  const me = MVS.getMe();
  const meUser = MVS.user(me);
  const mine = MVS.votesFor(act.id)[me] || null;
  const pick = (tier: TierKey) => {
    MVS.setVote(act.id, me, mine === tier ? null : tier);
    onClose();
  };
  const W = 190;
  const above = rect.top > 150;
  const top = above ? rect.top - 64 : rect.bottom + 10;
  let left = rect.left + rect.width / 2 - W / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - W - 8));
  return (
    <>
      <div className="m-tray-catch" onClick={onClose}></div>
      <div className="m-tray" style={{ top, left, width: W }}>
        <span className="m-tray-as" style={{ "--vc": meUser.color } as CSSVars}>
          {meUser.init}
        </span>
        {Object.values(MVS.TIERS).map((tier) => (
          <button
            key={tier.key}
            className={"m-tray-btn " + tier.key + (mine === tier.key ? " on" : "")}
            onClick={() => pick(tier.key)}
          >
            <span className="m-tray-em">{TIER_EMOJI[tier.key]}</span>
            <span className="m-tray-lb">{tier.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
