// scripts/curated-seed.js の手動選定リストをもとに、Steam公式appdetails APIから
// 実データ(価格・画像・説明・対応カテゴリ)を取得して data/games.json を作る。
//
// 使い方: node scripts/fetch-curated-games.mjs

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURATED_SEED } from "./curated-seed.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "data");
const OUT_FILE = path.join(OUT_DIR, "games.json");

const CATEGORY = {
  SINGLE_PLAYER: 2,
  MULTI_PLAYER: 1,
  COOP: 9,
  ONLINE_COOP: 38,
  SPLIT_SCREEN_COOP: 39,
  SPLIT_SCREEN: 24,
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, { retries = 3 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) kyou-nani-asobu-bot/0.1" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(800 * attempt);
    }
  }
}

async function fetchStoreDetail(appid, lang) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=${lang}&cc=jp`;
  const data = await fetchJson(url);
  const entry = data?.[String(appid)];
  if (!entry?.success) return null;
  return entry.data;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const seen = new Set();
  const games = [];

  for (const seed of CURATED_SEED) {
    if (seen.has(seed.appid)) continue;
    seen.add(seed.appid);

    console.log(`[appdetails] appid=${seed.appid}`);
    const store = await fetchStoreDetail(seed.appid, "japanese");
    await sleep(400);

    if (!store) {
      console.warn(`  -> 取得失敗。スキップ`);
      continue;
    }
    console.log(`  -> ${store.name}`);

    const storeEn = await fetchStoreDetail(seed.appid, "english");
    await sleep(400);

    const categoryIds = (store.categories ?? []).map((c) => c.id);
    const priceOverview = store.price_overview;
    const isFree = Boolean(store.is_free);

    games.push({
      appid: seed.appid,
      name: store.name,
      nameEn: storeEn?.name ?? store.name,
      headerImage: store.header_image,
      shortDescription: store.short_description,
      shortDescriptionEn: storeEn?.short_description ?? store.short_description,
      isFree: seed.priceOverrideJpy === 0 ? true : isFree,
      priceJpy:
        seed.priceOverrideJpy !== undefined
          ? seed.priceOverrideJpy
          : isFree
            ? 0
            : priceOverview?.final
              ? Math.round(priceOverview.final / 100)
              : null,
      genres: (store.genres ?? []).map((g) => g.description),
      moodTags: seed.moods,
      estimatedSessionMinutes: seed.sessionMinutes,
      minPlayers: seed.players[0],
      maxPlayers: seed.players[1],
      verified: true,
      coop: {
        coop: categoryIds.includes(CATEGORY.COOP),
        onlineCoop: categoryIds.includes(CATEGORY.ONLINE_COOP),
        localCoop: categoryIds.includes(CATEGORY.SPLIT_SCREEN_COOP) || categoryIds.includes(CATEGORY.SPLIT_SCREEN),
        multiplayer: categoryIds.includes(CATEGORY.MULTI_PLAYER),
        singlePlayer: categoryIds.includes(CATEGORY.SINGLE_PLAYER),
      },
      steamUrl: `https://store.steampowered.com/app/${seed.appid}`,
    });
  }

  await writeFile(OUT_FILE, JSON.stringify({ fetchedAt: new Date().toISOString(), games }, null, 2), "utf-8");
  console.log(`完了: ${games.length} 件を ${OUT_FILE} に保存しました`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
