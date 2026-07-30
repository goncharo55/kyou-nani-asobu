// mood-classifier.mjs を更新した際に、既存の data/games.json (verified:false の自動発見分)を
// Steamに再アクセスせず、ローカルデータだけで再分類するためのスクリプト。
// 使い方: node scripts/reclassify.mjs
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyMood, estimateSessionMinutes } from "./mood-classifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "..", "data", "games.json");

async function main() {
  const data = JSON.parse(await readFile(OUT_FILE, "utf-8"));
  let changed = 0;
  let emptyBefore = 0;
  let emptyAfter = 0;

  const games = data.games.map((g) => {
    if (g.verified) return g;
    if (g.moodTags.length === 0) emptyBefore++;
    const moodTags = classifyMood(g.genres, g.shortDescription);
    const estimatedSessionMinutes = estimateSessionMinutes(g.genres);
    if (moodTags.length === 0) emptyAfter++;
    if (JSON.stringify(moodTags) !== JSON.stringify(g.moodTags) || estimatedSessionMinutes !== g.estimatedSessionMinutes) {
      changed++;
    }
    return { ...g, moodTags, estimatedSessionMinutes };
  });

  await writeFile(OUT_FILE, JSON.stringify({ fetchedAt: data.fetchedAt, games }, null, 2), "utf-8");
  console.log(`再分類完了: ${changed}件を更新 (気分タグなし: ${emptyBefore}件 → ${emptyAfter}件)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
