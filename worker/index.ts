/// <reference path="../worker-configuration.d.ts" />
/**
 * Defqon Voter — Cloudflare Worker.
 *
 * Serves the JSON vote API under /api/* (backed by D1) and falls through to
 * the static SPA assets for everything else. Sync model: a monotonic `rev`
 * counter in the `meta` table is bumped on every write and returned as an
 * ETag, so polling clients can short-circuit with a 304 when nothing changed.
 */
import festivalJson from "../src/data/festival.json";

type TierKey = "must" | "maybe" | "skip";

const USER_IDS = ["kris", "gary", "tanvir"] as const;
const TIER_KEYS: TierKey[] = ["must", "maybe", "skip"];

interface FestivalLike {
  days: { stages: { minor: boolean; acts: { id: string }[] }[] }[];
}
const FESTIVAL = festivalJson as unknown as FestivalLike;

const json = (data: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...(init.headers ?? {}),
    },
  });

async function getRev(env: Env): Promise<number> {
  const row = await env.DB.prepare("SELECT value FROM meta WHERE key = 'rev'").first<{
    value: number;
  }>();
  return row?.value ?? 0;
}

const bumpRev = (env: Env) =>
  env.DB.prepare("UPDATE meta SET value = value + 1 WHERE key = 'rev'");

/** Read the full vote set folded into { [actId]: { [userId]: tier } }. */
async function readVotes(env: Env): Promise<Record<string, Record<string, TierKey>>> {
  const { results } = await env.DB.prepare(
    "SELECT act_id, user_id, tier FROM votes",
  ).all<{ act_id: string; user_id: string; tier: TierKey }>();
  const votes: Record<string, Record<string, TierKey>> = {};
  for (const r of results) {
    (votes[r.act_id] ??= {})[r.user_id] = r.tier;
  }
  return votes;
}

/* ---- deterministic sample seed (ported verbatim from the prototype store) ---- */
function rng(str: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}
function buildSeedRows() {
  const rows: { actId: string; userId: string; tier: TierKey }[] = [];
  for (const day of FESTIVAL.days) {
    for (const stage of day.stages) {
      if (stage.minor) continue;
      for (const act of stage.acts) {
        USER_IDS.forEach((uid, i) => {
          const r = rng(act.id, i * 97 + 13);
          if (r > 0.66) rows.push({ actId: act.id, userId: uid, tier: "must" });
          else if (r > 0.44) rows.push({ actId: act.id, userId: uid, tier: "maybe" });
        });
      }
    }
  }
  return rows;
}

/** Run statements in transactional chunks (stays under D1 batch limits). */
async function batchChunked(env: Env, stmts: D1PreparedStatement[], size = 50) {
  for (let i = 0; i < stmts.length; i += size) {
    await env.DB.batch(stmts.slice(i, i + size));
  }
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  // GET /api/state — full vote set + rev (ETag / If-None-Match aware)
  if (path === "/api/state" && request.method === "GET") {
    const rev = await getRev(env);
    const etag = `"${rev}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers: { etag } });
    }
    const votes = await readVotes(env);
    return json({ rev, votes }, { headers: { etag } });
  }

  // POST /api/vote — { actId, userId, tier|null }
  if (path === "/api/vote" && request.method === "POST") {
    let body: { actId?: unknown; userId?: unknown; tier?: unknown };
    try {
      body = (await request.json()) as { actId?: unknown; userId?: unknown; tier?: unknown };
    } catch {
      return json({ error: "invalid_json" }, { status: 400 });
    }
    const actId = body.actId;
    const userId = body.userId;
    const tier = body.tier ?? null;
    if (typeof actId !== "string" || !actId) {
      return json({ error: "bad_actId" }, { status: 400 });
    }
    if (typeof userId !== "string" || !USER_IDS.includes(userId as (typeof USER_IDS)[number])) {
      return json({ error: "bad_userId" }, { status: 400 });
    }
    if (tier !== null && (typeof tier !== "string" || !TIER_KEYS.includes(tier as TierKey))) {
      return json({ error: "bad_tier" }, { status: 400 });
    }

    const write =
      tier === null
        ? env.DB.prepare("DELETE FROM votes WHERE act_id = ? AND user_id = ?").bind(
            actId,
            userId,
          )
        : env.DB.prepare(
            `INSERT INTO votes (act_id, user_id, tier, updated_at) VALUES (?, ?, ?, ?)
             ON CONFLICT (act_id, user_id) DO UPDATE SET tier = excluded.tier, updated_at = excluded.updated_at`,
          ).bind(actId, userId, tier, Date.now());

    await env.DB.batch([write, bumpRev(env)]);
    return json({ rev: await getRev(env) });
  }

  // POST /api/reset — clear all votes
  if (path === "/api/reset" && request.method === "POST") {
    await env.DB.batch([env.DB.prepare("DELETE FROM votes"), bumpRev(env)]);
    return json({ rev: await getRev(env) });
  }

  // POST /api/sample — replace votes with the deterministic demo set
  if (path === "/api/sample" && request.method === "POST") {
    const ts = Date.now();
    const rows = buildSeedRows();
    const stmts: D1PreparedStatement[] = [env.DB.prepare("DELETE FROM votes")];
    const insert = env.DB.prepare(
      "INSERT INTO votes (act_id, user_id, tier, updated_at) VALUES (?, ?, ?, ?)",
    );
    for (const r of rows) stmts.push(insert.bind(r.actId, r.userId, r.tier, ts));
    stmts.push(bumpRev(env));
    await batchChunked(env, stmts);
    return json({ rev: await getRev(env) });
  }

  return json({ error: "not_found" }, { status: 404 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(request, env);
      } catch (err) {
        return json({ error: "server_error", detail: String(err) }, { status: 500 });
      }
    }
    // Everything else → static assets (SPA index.html via not_found_handling).
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
