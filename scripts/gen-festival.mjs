// One-off generator: converts the design handoff's `festival-data.js`
// (a `window.FESTIVAL = {...};` global) into a plain typed JSON module the
// app can import. The handoff data is already fully processed (after-midnight
// sm/em +1440 rule applied, stages sorted by position, acts by sm), so we
// reuse it verbatim — this script just unwraps the global assignment.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const SRC = resolve(
  root,
  "..",
  "DQ Timetable Voter",
  "design_handoff_defqon_voter",
  "festival-data.js",
);
const OUT = resolve(root, "src", "data", "festival.json");

const raw = readFileSync(SRC, "utf8");
const json = raw
  .replace(/^\s*window\.FESTIVAL\s*=\s*/, "")
  .replace(/;\s*$/, "")
  .trim();

const data = JSON.parse(json);

// Light sanity checks so a malformed source fails loudly here, not at runtime.
if (!data.event || !Array.isArray(data.days) || data.days.length === 0) {
  throw new Error("Parsed festival data is missing event/days");
}
let actCount = 0;
for (const day of data.days) {
  if (!Array.isArray(day.stages)) throw new Error(`Day ${day.day} has no stages`);
  for (const stage of day.stages) {
    for (const act of stage.acts) {
      if (typeof act.sm !== "number" || typeof act.em !== "number" || !act.id) {
        throw new Error(`Bad act in ${day.day}/${stage.name}: ${act.name}`);
      }
      actCount++;
    }
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
console.log(
  `Wrote ${OUT}\n  ${data.event} — ${data.days.length} days, ${actCount} acts`,
);
