import { useStore } from "../../hooks/useStore";
import { store as VS } from "../../store/voteStore";
import type { CSSVars } from "../style";

export function VoterToggle() {
  useStore();
  const me = VS.getMe();
  return (
    <div className="voteras">
      <span className="voteras-lbl">Voting as</span>
      <div className="avatars">
        {VS.USERS.map((u) => (
          <button
            key={u.id}
            className={"av" + (u.id === me ? " on" : "")}
            style={{ "--vc": u.color } as CSSVars}
            onClick={() => VS.setMe(u.id)}
            title={u.name}
          >
            {u.init}
          </button>
        ))}
      </div>
    </div>
  );
}
