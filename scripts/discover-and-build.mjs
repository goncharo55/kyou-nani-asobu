// curated-seed.mjs の手動リストに加えて、Steam公式APIだけで「まだ知名度は高くないが
// 一定の質が担保されている協力/対戦ゲーム」を大規模に自動発見し、data/games.json を拡充する。
//
// 手順:
//  1. 協力/マルチ/対戦の各カテゴリ(id単体、OR的に扱うため個別にクエリする)を
//     レビュー評価順にページングして候補appidを収集
//     (store.steampowered.com/search/results は公式の検索フロントエンド。Cloudflare等の
//      ボット判定なしでアクセス可能)
//  2. 各候補について appreviews API でレビュー数・高評価率を取得し、
//     「レビュー300件以上 かつ 高評価率75%以上」を満たすものだけ採用する
//     (無名すぎる/質の低いゲームを機械的に除外するための品質ゲート)
//  3. appdetails で価格・画像・説明・カテゴリを取得し、type=game かつ
//     協力/マルチ系カテゴリを持つものだけ最終採用
//  4. mood-classifier.mjs でジャンル+説明文から気分タグを推定
//  5. curated-seed.mjs の手動データ(人数・プレイ時間は実際の値)とマージして保存
//
// 1000本規模の候補を捌く長時間バッチのため、SAVE_INTERVAL件ごとに data/games.json へ
// 途中経過を保存する(中断しても採用済み分は残る)。
//
// 使い方:
//   node scripts/discover-and-build.mjs [評価する候補数の上限(既定6000)] [カテゴリごとの取得ページ数(既定10)]

import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURATED_SEED } from "./curated-seed.mjs";
import { classifyMood, estimateSessionMinutes } from "./mood-classifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "data");
const OUT_FILE = path.join(OUT_DIR, "games.json");

const CANDIDATE_LIMIT = Number(process.argv[2] ?? 6000);
const PAGES_PER_CATEGORY = Number(process.argv[3] ?? 10);
const SAVE_INTERVAL = 50;

const CATEGORY = {
  MULTI_PLAYER: 1,
  COOP: 9,
  ONLINE_COOP: 38,
  SPLIT_SCREEN_COOP: 39,
  SPLIT_SCREEN: 24,
  PVP: 49,
  ONLINE_PVP: 36,
  SPLIT_SCREEN_PVP: 37,
};
const TOGETHER_CATEGORY_IDS = new Set(Object.values(CATEGORY));
const SINGLE_PLAYER_CATEGORY_ID = 2;

const QUALITY_MIN_REVIEWS = 300;
const QUALITY_MIN_POSITIVE_RATIO = 0.75;
const COUNT_PER_PAGE = 50;

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
  throw new Error(`429 retries exhausted for ${url}`);
}

// Steamの検索フロントエンドは同一ソート条件だと一定件数(実測で1000件強)より深くは
// ページングしても新しい結果が出てこない(短いページが返って打ち切られる)ため、
// 複数のソート条件を切り替えて候補プールを広げる。
const SORT_STRATEGIES = ["Reviews_DESC", "Released_DESC", ""]; // ""=関連度/人気順(既定)

async function collectCandidatesForCategory(categoryId, candidateSet) {
  for (const sortBy of SORT_STRATEGIES) {
    for (let page = 0; page < PAGES_PER_CATEGORY; page++) {
      const start = page * COUNT_PER_PAGE;
      const sortParam = sortBy ? `&sort_by=${sortBy}` : "";
      const url = `https://store.steampowered.com/search/results/?query&start=${start}&count=${COUNT_PER_PAGE}&category2=${categoryId}&supportedlang=japanese&infinite=1${sortParam}`;
      const data = await fetchJson(url);
      const html = data?.results_html ?? "";
      const appids = [...html.matchAll(/data-ds-appid="(\d+)"/g)].map((m) => Number(m[1]));
      appids.forEach((id) => candidateSet.add(id));
      if (appids.length < COUNT_PER_PAGE) break; // このソート条件での結果を使い切った
      await sleep(1200);
    }
    await sleep(1200);
  }
}

// カテゴリ横断のソート済み一覧だけだと母数が頭打ちになるため、気分キーワード検索でも
// 長尾(ロングテール)の候補を補う。あくまで候補集めであり、実際の採用可否は
// レビュー品質フィルタ(QUALITY_MIN_REVIEWS等)で判定するため、キーワードの精度自体は問わない。
const MOOD_QUERIES = {
  laugh: ["comedy party", "funny co-op", "party game multiplayer", "chaotic couch co-op"],
  scary: ["horror co-op", "survival horror", "psychological horror multiplayer", "asymmetric horror"],
  brain: ["puzzle co-op", "strategy co-op", "tactics multiplayer", "board game digital"],
  chill: ["cozy co-op", "relaxing multiplayer", "farming co-op", "sandbox building multiplayer"],
};

async function collectCandidatesByTerms(candidateSet) {
  for (const terms of Object.values(MOOD_QUERIES)) {
    for (const term of terms) {
      for (const start of [0, 50]) {
        const url = `https://store.steampowered.com/search/results/?term=${encodeURIComponent(
          term
        )}&start=${start}&count=${COUNT_PER_PAGE}&supportedlang=japanese&infinite=1`;
        const data = await fetchJson(url);
        const html = data?.results_html ?? "";
        const appids = [...html.matchAll(/data-ds-appid="(\d+)"/g)].map((m) => Number(m[1]));
        appids.forEach((id) => candidateSet.add(id));
        await sleep(1000);
      }
    }
  }
}

async function fetchReviewStats(appid) {
  const url = `https://store.steampowered.com/appreviews/${appid}?json=1&language=all&purpose=print&num_per_page=0`;
  const data = await fetchJson(url);
  const q = data?.query_summary;
  if (!q) return null;
  return {
    totalReviews: q.total_reviews ?? 0,
    totalPositive: q.total_positive ?? 0,
    reviewScoreDesc: q.review_score_desc ?? "",
  };
}

async function fetchStoreDetail(appid, lang = "japanese") {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=${lang}&cc=jp`;
  const data = await fetchJson(url);
  const entry = data?.[String(appid)];
  if (!entry?.success) return null;
  return entry.data;
}

async function loadExistingGames(curatedAppIds) {
  try {
    const existing = JSON.parse(await readFile(OUT_FILE, "utf-8"));
    // curated-seed.mjsに載っているappidは常にverified:trueの手動データを正とする
    return existing.games.map((g) => (curatedAppIds.has(g.appid) ? { ...g, verified: true } : g));
  } catch {
    console.warn("既存の games.json が読めなかったため、先に `npm run data:curated` を実行してください");
    return [];
  }
}

async function saveProgress(keepGames, discovered) {
  const merged = [...keepGames, ...discovered];
  await writeFile(OUT_FILE, JSON.stringify({ fetchedAt: new Date().toISOString(), games: merged }, null, 2), "utf-8");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const curatedAppIds = new Set(CURATED_SEED.map((s) => s.appid));
  const existingGames = await loadExistingGames(curatedAppIds);
  const existingAppIds = new Set(existingGames.map((g) => g.appid));
  console.log(`既存データ ${existingGames.length}件(うち手動選定 ${curatedAppIds.size}件)は保持し、新規分のみ評価します`);

  console.log("=== 候補収集フェーズ(カテゴリ別) ===");
  const candidateSet = new Set();
  for (const [name, id] of Object.entries(CATEGORY)) {
    console.log(`[discover] category=${name}(${id})`);
    await collectCandidatesForCategory(id, candidateSet);
    console.log(`  現在のユニーク候補数: ${candidateSet.size}`);
  }

  console.log("=== 候補収集フェーズ(気分キーワード検索) ===");
  await collectCandidatesByTerms(candidateSet);
  console.log(`  現在のユニーク候補数: ${candidateSet.size}`);

  const candidates = [...candidateSet].filter((id) => !existingAppIds.has(id)).slice(0, CANDIDATE_LIMIT);
  console.log(`=== 品質フィルタ・詳細取得フェーズ (新規候補 ${candidates.length} 件) ===`);

  const discovered = [];
  const startTime = Date.now();
  for (const [i, appid] of candidates.entries()) {
    try {
      const stats = await fetchReviewStats(appid);
      await sleep(700);
      if (!stats || stats.totalReviews < QUALITY_MIN_REVIEWS) continue;
      const positiveRatio = stats.totalPositive / stats.totalReviews;
      if (positiveRatio < QUALITY_MIN_POSITIVE_RATIO) continue;

      const store = await fetchStoreDetail(appid, "japanese");
      await sleep(700);
      if (!store || store.type !== "game") continue;

      const categoryIds = (store.categories ?? []).map((c) => c.id);
      if (!categoryIds.some((id) => TOGETHER_CATEGORY_IDS.has(id))) continue;

      const storeEn = await fetchStoreDetail(appid, "english");
      await sleep(700);

      const genreNames = (store.genres ?? []).map((g) => g.description);
      const priceOverview = store.price_overview;
      const isFree = Boolean(store.is_free);

      discovered.push({
        appid,
        name: store.name,
        nameEn: storeEn?.name ?? store.name,
        headerImage: store.header_image,
        shortDescription: store.short_description,
        shortDescriptionEn: storeEn?.short_description ?? store.short_description,
        isFree,
        priceJpy: isFree ? 0 : priceOverview?.final ? Math.round(priceOverview.final / 100) : null,
        genres: genreNames,
        moodTags: classifyMood(genreNames, store.short_description),
        estimatedSessionMinutes: estimateSessionMinutes(genreNames),
        minPlayers: 2,
        maxPlayers: 4,
        verified: false,
        reviewStats: stats,
        coop: {
          coop: categoryIds.includes(CATEGORY.COOP),
          onlineCoop: categoryIds.includes(CATEGORY.ONLINE_COOP),
          localCoop: categoryIds.includes(CATEGORY.SPLIT_SCREEN_COOP) || categoryIds.includes(CATEGORY.SPLIT_SCREEN),
          multiplayer: categoryIds.includes(CATEGORY.MULTI_PLAYER),
          singlePlayer: categoryIds.includes(SINGLE_PLAYER_CATEGORY_ID),
        },
        steamUrl: `https://store.steampowered.com/app/${appid}`,
      });
    } catch (err) {
      console.error(`  -> エラー appid=${appid}: ${err.message}`);
    }

    if ((i + 1) % SAVE_INTERVAL === 0) {
      await saveProgress(existingGames, discovered);
      const elapsedMin = ((Date.now() - startTime) / 60000).toFixed(1);
      console.log(
        `[進捗 ${i + 1}/${candidates.length}] 新規採用累計 ${discovered.length}件 (経過${elapsedMin}分) ※途中経過を保存しました`
      );
    }
  }

  await saveProgress(existingGames, discovered);
  console.log(
    `完了: 既存 ${existingGames.length}件 + 新規発見 ${discovered.length}件 = 合計 ${existingGames.length + discovered.length}件`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
