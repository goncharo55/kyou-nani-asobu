// 既存の data/games.json の各ゲームに、Steamの「シングルプレイヤー」カテゴリ(id=2)を
// 持っているかどうかを追加する一回限りのマイグレーション。
// 「何人で遊ぶ？」で1人(ソロ)を選んだときに、実際にソロプレイ対応のゲームだけを
// 表示できるようにするために必要。
// 使い方: node scripts/add-singleplayer-flag.mjs
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "..", "data", "games.json");
const SAVE_INTERVAL = 50;
const SINGLE_PLAYER_CATEGORY_ID = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, { retries = 5 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) kyou-nani-asobu-bot/0.1" },
      });
      if (res.status === 429) {
        const wait = 5000 * attempt;
        console.warn(`  429 Too Many Requests。${wait / 1000}秒待機してリトライ (${attempt}/${retries})`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1000 * attempt);
    }
  }
  throw new Error(`retries exhausted for ${url}`);
}

async function fetchSinglePlayerFlag(appid) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=japanese&cc=jp&filters=categories`;
  const data = await fetchJson(url);
  const entry = data?.[String(appid)];
  if (!entry?.success) return null;
  const categoryIds = (entry.data?.categories ?? []).map((c) => c.id);
  return categoryIds.includes(SINGLE_PLAYER_CATEGORY_ID);
}

async function main() {
  const data = JSON.parse(await readFile(OUT_FILE, "utf-8"));
  const games = data.games;
  const todo = games.filter((g) => g.coop.singlePlayer === undefined);
  console.log(`対象 ${todo.length}件 (既に設定済み: ${games.length - todo.length}件)`);

  let done = 0;
  for (const game of todo) {
    try {
      const singlePlayer = await fetchSinglePlayerFlag(game.appid);
      game.coop.singlePlayer = singlePlayer ?? false;
      await sleep(500);
    } catch (err) {
      console.error(`  -> エラー appid=${game.appid}: ${err.message}`);
      game.coop.singlePlayer = false;
    }
    done++;
    if (done % SAVE_INTERVAL === 0) {
      await writeFile(OUT_FILE, JSON.stringify({ fetchedAt: data.fetchedAt, games }, null, 2), "utf-8");
      console.log(`[進捗 ${done}/${todo.length}] 保存しました`);
    }
  }

  await writeFile(OUT_FILE, JSON.stringify({ fetchedAt: data.fetchedAt, games }, null, 2), "utf-8");
  const soloCount = games.filter((g) => g.coop.singlePlayer).length;
  console.log(`完了: ${done}件処理。ソロプレイ対応: ${soloCount}/${games.length}件`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
