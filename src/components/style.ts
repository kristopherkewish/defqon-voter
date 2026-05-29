import type { CSSProperties } from "react";

/** CSSProperties that also permits CSS custom properties (e.g. `--sc`, `--vc`). */
export type CSSVars = CSSProperties & Record<`--${string}`, string | number>;
