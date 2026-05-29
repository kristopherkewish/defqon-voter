import { useEffect, useState } from "react";
import { store } from "../store/voteStore";

/**
 * Subscribe a component to vote-store changes. Mirrors the prototype's
 * `useStore()` helper: it forces a re-render whenever the store emits.
 */
export function useStore(): void {
  const [, force] = useState(0);
  useEffect(() => store.subscribe(() => force((n) => n + 1)), []);
}

/** Reactive `window.matchMedia` hook used to switch desktop/mobile layouts. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = () => setMatches(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}
