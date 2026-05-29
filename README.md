# Defqon.1 Timetable Voter

A small web app for a crew (Kris, Gary, Tanvir) to vote on which sets to see at
**Defqon.1 2026** — a 4-day hardstyle festival with up to 13 stages running at
once. The core view is a **festival timetable grid**: time runs vertically,
stages are side-by-side columns. Each person reacts to acts (🔥 Must-see /
🤔 Maybe / 💤 Skip); the app surfaces group consensus and **clashes** (two acts
the group collectively must-sees that overlap in time).

🌐 **Live:** https://defqon-voter.kristopherkewish.workers.dev

There are two layouts that share the same data and voting model:

- **Desktop** — a full column grid that flexes to fill the width.
- **Mobile** (≤ 760px) — a swipeable grid with a pinned time gutter and
  fixed-width snap columns.

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend + hosting:** a single Cloudflare Worker that serves the built SPA
  and a JSON `/api` backend
- **Storage:** Cloudflare **D1** (SQLite) — one row per `(act, user)`
- **Sync:** polling. Your own votes apply optimistically (instant); everyone
  else's arrive within a few seconds. A monotonic `rev` counter is returned as
  an `ETag` so idle polls short-circuit with a `304`.

## Local development

```bash
npm install
npm run gen:festival                       # (re)generate src/data/festival.json from the handoff source
npx wrangler d1 migrations apply defqon-voter-db --local   # set up the local DB (first run only)
npm run dev                                # http://localhost:5173
```

`npm run dev` runs Vite and the Worker together (via `@cloudflare/vite-plugin`)
against a **local** D1 database, so local changes never touch production data.

### Useful scripts

| Script                 | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Vite + Worker dev server                       |
| `npm run build`        | Type-check (`tsc -b`) + build client & worker  |
| `npm run deploy`       | Build, then `wrangler deploy` to Cloudflare    |
| `npm run cf-typegen`   | Regenerate `worker-configuration.d.ts`         |
| `npm run gen:festival` | Rebuild the festival data JSON                 |

## API

| Method | Path          | Body                                | Notes                                  |
| ------ | ------------- | ----------------------------------- | -------------------------------------- |
| GET    | `/api/state`  | —                                   | `{ rev, votes }`; honours `If-None-Match` → `304` |
| POST   | `/api/vote`   | `{ actId, userId, tier \| null }`   | upsert; `tier: null` clears the vote   |
| POST   | `/api/reset`  | —                                   | clears all votes                       |
| POST   | `/api/sample` | —                                   | replaces votes with a deterministic demo set |

`userId` is one of `kris` / `gary` / `tanvir`; `tier` is `must` / `maybe` / `skip`.

## Deployment & CI

Deploys run from `wrangler` using the account in `wrangler.jsonc`. Pushing to
`main` triggers `.github/workflows/deploy.yml`, which applies D1 migrations,
builds, and deploys.

**One-time setup to enable CI** (manual deploys with `npm run deploy` work
without it):

1. Create a Cloudflare API token at
   https://dash.cloudflare.com/profile/api-tokens with permissions:
   - **Account → Workers Scripts → Edit**
   - **Account → D1 → Edit**
   - **Account → Workers R2 Storage / Account Settings → Read** (used for asset uploads)
   (the *Edit Cloudflare Workers* template covers all of these).
2. Add it as a repo secret:
   ```bash
   gh secret set CLOUDFLARE_API_TOKEN -R kristopherkewish/defqon-voter
   ```

## Database commands

```bash
# Inspect remote votes
npx wrangler d1 execute defqon-voter-db --remote --command "SELECT * FROM votes"

# Apply migrations
npx wrangler d1 migrations apply defqon-voter-db --remote   # or --local
```

## Project structure

```
worker/index.ts          API routes + D1 + static-asset fallthrough
migrations/              D1 schema
src/
  main.tsx               bootstraps the store, then mounts <App/>
  App.tsx                responsive switch: Desktop vs Mobile
  styles.css             all styles (shared tokens + desktop + mobile)
  data/festival.ts       typed festival data (generated JSON)
  store/voteStore.ts     backend-backed, polling-synced vote store
  hooks/useStore.ts      store subscription + useMediaQuery
  components/desktop/     DesktopApp, TopBar, StageBar, TimeGrid, ActBlock, ReactTray
  components/mobile/      MobileApp, MAvatars, MGrid, MBlock, MTray
scripts/gen-festival.mjs  regenerates src/data/festival.json from the design handoff
```

## Credits

Built from the `design_handoff_defqon_voter` design bundle. Timetable data
sourced from the published Defqon.1 2026 schedule.
