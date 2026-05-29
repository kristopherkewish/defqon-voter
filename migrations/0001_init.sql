-- Defqon Voter — initial schema.
-- One row per (act, user). Votes are keyed by performance_id (act.id) + user id.
CREATE TABLE IF NOT EXISTS votes (
  act_id     TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  tier       TEXT NOT NULL CHECK (tier IN ('must', 'maybe', 'skip')),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (act_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_act ON votes (act_id);

-- meta holds a monotonic revision counter, bumped on every write. Clients poll
-- GET /api/state with If-None-Match: <rev>; unchanged rev => 304.
CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);

INSERT INTO meta (key, value) VALUES ('rev', 0)
  ON CONFLICT (key) DO NOTHING;
