export type TierKey = "must" | "maybe" | "skip";

export interface Act {
  name: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  id: string; // performance_id from the source data
  host: boolean;
  sm: number; // start minute of day (acts before 06:00 are +1440)
  em: number; // end minute of day
}

export interface Stage {
  name: string;
  position: number; // official ordering; lower = bigger stage
  color: string; // hex
  minor: boolean; // silent disco / Stampkroeg / night stages
  acts: Act[];
}

export interface Day {
  day: string; // "Thursday"
  date: string; // "2026-06-25"
  stages: Stage[];
}

export interface Festival {
  event: string;
  location: string;
  days: Day[];
}

export interface User {
  id: string;
  name: string;
  init: string;
  color: string;
}

export interface Tier {
  key: TierKey;
  label: string;
  color: string;
}

/** votes map: { [actId]: { [userId]: tier } } */
export type Votes = Record<string, Record<string, TierKey>>;

/** Result of GET /api/state */
export interface StateResponse {
  rev: number;
  votes: Votes;
}

/** Per-act tally returned by the store. */
export interface Tally {
  must: number;
  maybe: number;
  skip: number;
  total: number;
  voters: { user: User; tier: TierKey }[];
}
