import { useStore } from "../../hooks/useStore";
import { store as MVS } from "../../store/voteStore";
import type { CSSVars } from "../style";

export function MAvatars() {
  useStore();
  const me = MVS.getMe();
  return (
    <div className="m-avatars">
      {MVS.USERS.map((u) => (
        <button
          key={u.id}
          className={"m-av" + (u.id === me ? " on" : "")}
          style={{ "--vc": u.color } as CSSVars}
          onClick={() => MVS.setMe(u.id)}
        >
          {u.init}
        </button>
      ))}
    </div>
  );
}
