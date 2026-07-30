// Steamのゲームデータを収集して data/games.json に保存するスクリプト。
//
// データソースはSteam公式のストアフロントAPI(認証不要・公開)のみを使用する。
// SteamSpyはCloudflareのボット判定で弾かれるため採用しない。
//
//  - storesearch : キーワード検索でappidの候補を集める(気分タグの推定にも利用)
//  - featuredcategories : 人気タイトル/新作/セール中を候補に混ぜる
//  - appdetails : ジャンル・カテゴリ(協力/対戦/マルチ等)・価格・画像・説明を取得
//
// 使い方: node scripts/fetch-steam-data.mjs [取得件数の上限(既定50)]

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "data");
const OUT_FILE = path.join(OUT_DIR, "games.json");

const LIMIT = Number(process.argv[2] ?? 50);

// 気分タグ -> Steam検索キーワード (この検索で見つかったゲームにその気分タグを付与する)
const MOOD_SEARCH_TERMS = {
  laugh: ["comedy party game", "funny multiplayer"],
  scary: ["horror co-op", "survival horror multiplayer"],
  brain: ["puzzle co-op", "strategy multiplayer"],
  chill: ["relaxing co-op", "cozy multiplayer"],
};

// Steamカテゴリの数値ID (locale非依存。 https://partner.steamgames.com 系資料で公開されている値)
const CATEGORY = {
  SINGLE_PLAYER: 2,
  MULTI_PLAYER: 1,
  PVP: 49,
  ONLINE_PVP: 36,
  SPLIT_SCREEN_PVP: 37,
  COOP: 9,
  ONLINE_COOP: 38,
  SPLIT_SCREEN_COOP: 39,
  SPLIT_SCREEN: 24,
};

const TOGETHER_CATEGORY_IDS = new Set([
  CATEGORY.MULTI_PLAYER,
  CATEGORY.PVP,
  CATEGORY.ONLINE_PVP,
  CATEGORY.SPLIT_SCREEN_PVP,
  CATEGORY.COOP,
  CATEGORY.ONLINE_COOP,
  CATEGORY.SPLIT_SCREEN_COOP,
  CATEGORY.SPLIT_SCREEN,
]);

// セッション長(目安)の推定ルール。Steam公式APIには「1回のプレイ時間」データが無いため、
// ジャンル/検索経路からの粗い推定値として扱う(UI上も「目安」と明記する)。
function estimateSessionMinutes({ genres, foundViaMoodTerms }) {
  if (foundViaMoodTerms.includes("laugh") && genres.includes("Casual")) return 30;
  if (genres.some((g) => ["RPG", "Strategy", "Simulation", "Massively Multiplayer"].includes(g))) return 180;
  if (genres.includes("Casual") || genres.includes("Sports") || genres.includes("Racing")) return 30;
  return 60;
}

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

// appid -> Set<mood> のマップを作りながら候補集合を返す
async function collectCandidates() {
  const moodsByAppId = new Map();
  const addCandidate = (appid, mood) => {
    if (!moodsByAppId.has(appid)) moodsByAppId.set(appid, new Set());
    if (mood) moodsByAppId.get(appid).add(mood);
  };

  for (const [mood, terms] of Object.entries(MOOD_SEARCH_TERMS)) {
    for (const term of terms) {
      console.log(`[storesearch] mood=${mood} term="${term}"`);
      const data = await fetchJson(
        `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&l=japanese&cc=jp`
      );
      for (const item of data?.items ?? []) {
        if (item.type !== "app") continue;
        addCandidate(item.id, mood);
      }
      await sleep(500);
    }
  }

  console.log("[featuredcategories] fetching popular titles");
  const featured = await fetchJson("https://store.steampowered.com/api/featuredcategories?l=japanese&cc=jp");
  for (const bucket of ["top_sellers", "new_releases", "specials"]) {
    for (const item of featured?.[bucket]?.items ?? []) {
      addCandidate(item.id, null);
    }
  }

  return moodsByAppId;
}

async function fetchStoreDetail(appid) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=japanese&cc=jp`;
  const data = await fetchJson(url);
  const entry = data?.[String(appid)];
  if (!entry?.success) return null;
  return entry.data;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const moodsByAppId = await collectCandidates();
  const appIds = [...moodsByAppId.keys()].slice(0, LIMIT * 2); // co-op系フィルタで減る分、多めに候補を持つ

  console.log(`候補 ${appIds.length} 件のゲームを詳細取得します...`);

  const games = [];
  for (const [i, appid] of appIds.entries()) {
    if (games.length >= LIMIT) break;
    try {
      console.log(`[${i + 1}/${appIds.length}] appid=${appid} (${games.length}/${LIMIT} 件確保済み)`);
      const store = await fetchStoreDetail(appid);
      await sleep(500);

      if (!store || store.type !== "game") continue;

      const categoryIds = (store.categories ?? []).map((c) => c.id);
      const isTogether = categoryIds.some((id) => TOGETHER_CATEGORY_IDS.has(id));
      if (!isTogether) continue; // 一人プレイ専用は今回のサイトの対象外

      const genreNames = (store.genres ?? []).map((g) => g.description);
      const foundViaMoodTerms = [...(moodsByAppId.get(appid) ?? [])];
      const priceOverview = store.price_overview;
      const isFree = Boolean(store.is_free);

      games.push({
        appid,
        name: store.name,
        headerImage: store.header_image,
        shortDescription: store.short_description,
        isFree,
        priceJpy: isFree ? 0 : priceOverview?.final ? Math.round(priceOverview.final / 100) : null,
        genres: genreNames,
        moodTags: foundViaMoodTerms,
        estimatedSessionMinutes: estimateSessionMinutes({ genres: genreNames, foundViaMoodTerms }),
        coop: {
          coop: categoryIds.includes(CATEGORY.COOP),
          onlineCoop: categoryIds.includes(CATEGORY.ONLINE_COOP),
          localCoop: categoryIds.includes(CATEGORY.SPLIT_SCREEN_COOP) || categoryIds.includes(CATEGORY.SPLIT_SCREEN),
          multiplayer: categoryIds.includes(CATEGORY.MULTI_PLAYER),
          pvp: categoryIds.includes(CATEGORY.PVP),
        },
        steamUrl: `https://store.steampowered.com/app/${appid}`,
      });
    } catch (err) {
      console.error(`  -> エラー appid=${appid}: ${err.message}`);
    }
  }

  await writeFile(OUT_FILE, JSON.stringify({ fetchedAt: new Date().toISOString(), games }, null, 2), "utf-8");
  console.log(`完了: ${games.length} 件を ${OUT_FILE} に保存しました`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
