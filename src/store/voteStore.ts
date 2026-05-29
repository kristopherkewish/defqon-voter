/**
 * Defqon Voter — shared vote store.
 *
 * Backed by the Cloudflare Worker API (D1) instead of localStorage. Keeps the
 * same surface the prototype's `window.VoteStore` exposed so the ported
 * components work unchanged. Writes are optimistic (apply locally + emit, then
 * POST); other people's votes arrive via a polling loop that uses the server's
 * `rev` as an ETag to skip no-op updates.
 */
import type { Tally, TierKey, User, Tier, Votes, StateResponse } from "../types";

const ME_KEY = "defqon.me.v1";
const POLL_MS = 4000;

const USERS: User[] = [
  { id: "kris", name: "Kris", init: "K", color: "#FF4D6D" },
  { id: "gary", name: "Gary", init: "G", color: "#4DA3FF" },
  { id: "tanvir", name: "Tanvir", init: "T", color: "#46E891" },
];

const TIERS: Record<TierKey, Tier> = {
  must: { key: "must", label: "Must-see", color: "#FFC400" },
  maybe: { key: "maybe", label: "Maybe", color: "#19C8E6" },
  skip: { key: "skip", label: "Skip", color: "#6A6A78" },
};

let state: Votes = {};
let rev = 0;
let me = readMe();
const subs = new Set<() => void>();
let started = false;

function readMe(): string {
  try {
    const v = localStorage.getItem(ME_KEY);
    if (v && USERS.some((u) => u.id === v)) return v;
  } catch {
    /* ignore */
  }
  return "kris";
}

function emit() {
  subs.forEach((f) => f());
}

/** Fetch the authoritative state. `force` skips the conditional ETag check. */
async function fetchState(force: boolean): Promise<void> {
  const headers: Record<string, string> = {};
  if (!force && rev) headers["if-none-match"] = `"${rev}"`;
  const res = await fetch("/api/state", { headers, cache: "no-store" });
  if (res.status === 304) return;
  if (!res.ok) throw new Error(`state fetch failed: ${res.status}`);
  const data = (await res.json()) as StateResponse;
  state = data.votes ?? {};
  rev = data.rev ?? 0;
  emit();
}

function applyLocal(actId: string, userId: string, tier: TierKey | null) {
  if (tier == null) {
    const row = state[actId];
    if (row) {
      delete row[userId];
      if (Object.keys(row).length === 0) delete state[actId];
    }
  } else {
    (state[actId] ??= {})[userId] = tier;
  }
}

function startPolling() {
  const poll = () => {
    if (!document.hidden) void fetchState(false).catch(() => {});
  };
  window.setInterval(poll, POLL_MS);
  document.addEventListener("visibilitychange", poll);
  window.addEventListener("focus", poll);
}

export const store = {
  USERS,
  TIERS,

  getMe: () => me,
  setMe(id: string) {
    me = id;
    try {
      localStorage.setItem(ME_KEY, id);
    } catch {
      /* ignore */
    }
    emit();
  },
  user: (id: string): User => USERS.find((u) => u.id === id) ?? USERS[0],

  votesFor: (actId: string): Record<string, TierKey> => state[actId] ?? {},

  tally(actId: string): Tally {
    const v = state[actId] ?? {};
    const out: Tally = { must: 0, maybe: 0, skip: 0, total: 0, voters: [] };
    for (const u of USERS) {
      const t = v[u.id];
      if (!t) continue;
      out.voters.push({ user: u, tier: t });
      out.total++;
      out[t]++;
    }
    return out;
  },

  all: (): Votes => state,

  /** Optimistic write: apply locally + emit, then POST; reconcile/revert after. */
  async setVote(actId: string, userId: string, tier: TierKey | null): Promise<void> {
    applyLocal(actId, userId, tier);
    emit();
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actId, userId, tier }),
      });
      if (!res.ok) throw new Error(`vote failed: ${res.status}`);
      const data = (await res.json()) as { rev: number };
      rev = data.rev ?? rev;
    } catch {
      // Reconcile with the server if the write didn't land.
      await fetchState(true).catch(() => {});
    }
  },

  subscribe(f: () => void): () => void {
    subs.add(f);
    return () => subs.delete(f);
  },
};

/** Load initial state then start polling. Resolves even if the backend is down. */
export async function initStore(): Promise<void> {
  if (started) return;
  started = true;
  await fetchState(true).catch(() => {});
  startPolling();
}

export type Store = typeof store;
