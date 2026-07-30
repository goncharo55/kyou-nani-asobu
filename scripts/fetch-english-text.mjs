// 既存の data/games.json の各ゲームに、Steam公式 appdetails を l=english で取得し直して
// 英語版の name / short_description を追加する一回限りのマイグレーション。
//
// なぜ必要か: これまでは l=japanese でしか取得しておらず、Steamが日本語ローカライズして
// いないタイトルは英語のまま入っていた。英語ロケールで見たときに逆に日本語の説明文が
// 混ざって見えるケースがあったため、英語は英語で正式に取得し直して両方を保持する。
// 英語はSteamのほぼ全タイトルでカバーされているため、将来的に他言語(中国語・韓国語等)へ
// 展開する際もこの英語版を翻訳元として使う想定(README参照)。
//
// 使い方: node scripts/fetch-english-text.mjs
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, "..", "data", "games.json");
const SAVE_INTERVAL = 50;

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

async function fetchEnglishText(appid) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=english&cc=jp`;
  const data = await fetchJson(url);
  const entry = data?.[String(appid)];
  if (!entry?.success) return null;
  return { name: entry.data.name, shortDescription: entry.data.short_description };
}

async function main() {
  const data = JSON.parse(await readFile(OUT_FILE, "utf-8"));
  const games = data.games;
  const todo = games.filter((g) => g.nameEn === undefined);
  console.log(`対象 ${todo.length}件 (既に設定済み: ${games.length - todo.length}件)`);

  let done = 0;
  for (const game of todo) {
    try {
      const en = await fetchEnglishText(game.appid);
      game.nameEn = en?.name ?? game.name;
      game.shortDescriptionEn = en?.shortDescription ?? game.shortDescription;
      await sleep(500);
    } catch (err) {
      console.error(`  -> エラー appid=${game.appid}: ${err.message}`);
      game.nameEn = game.name;
      game.shortDescriptionEn = game.shortDescription;
    }
    done++;
    if (done % SAVE_INTERVAL === 0) {
      await writeFile(OUT_FILE, JSON.stringify({ fetchedAt: data.fetchedAt, games }, null, 2), "utf-8");
      console.log(`[進捗 ${done}/${todo.length}] 保存しました`);
    }
  }

  await writeFile(OUT_FILE, JSON.stringify({ fetchedAt: data.fetchedAt, games }, null, 2), "utf-8");
  console.log(`完了: ${done}件処理`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
