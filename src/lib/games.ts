import raw from "../../data/games.json";

export type MoodKey = "laugh" | "scary" | "brain" | "chill";

export type Game = {
  appid: number;
  name: string;
  nameEn?: string;
  headerImage: string;
  shortDescription: string;
  shortDescriptionEn?: string;
  isFree: boolean;
  priceJpy: number | null;
  genres: string[];
  moodTags: MoodKey[];
  estimatedSessionMinutes: number;
  minPlayers: number;
  maxPlayers: number;
  coop: {
    coop: boolean;
    onlineCoop: boolean;
    localCoop: boolean;
    multiplayer: boolean;
    singlePlayer?: boolean;
  };
  steamUrl: string;
  // true: 人手で選定・人数やプレイ時間を実際の情報で設定したゲーム
  // false: 自動収集(レビュー数/高評価率でふるい分け)したゲーム。対応人数は暫定値(2〜4人)
  verified?: boolean;
  reviewStats?: {
    totalReviews: number;
    totalPositive: number;
    reviewScoreDesc: string;
  };
};

export type GamesData = {
  fetchedAt: string;
  games: Game[];
};

const data = raw as GamesData;

export const GAMES: Game[] = data.games;
export const DATA_FETCHED_AT = data.fetchedAt;

export type BudgetKey = "free" | "under2000";

export const PLAYER_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
export const MAX_PLAYER_OPTION = PLAYER_OPTIONS[PLAYER_OPTIONS.length - 1];
export const SOLO_PLAYERS = 1;
export const TIME_OPTIONS = [30, 60, 180] as const;

export type PlayerLabels = { solo: string; unit: string; orMore: string };

export function playerOptionLabel(n: number, labels: PlayerLabels): string {
  if (n === SOLO_PLAYERS) return labels.solo;
  return n >= MAX_PLAYER_OPTION ? `${n}${labels.orMore}` : `${n}${labels.unit}`;
}

// 表示用: ソロプレイ対応なら実質1人から遊べるので、その旨を反映した下限人数を返す
export function effectiveMinPlayers(game: Game): number {
  return game.coop.singlePlayer ? 1 : game.minPlayers;
}

// 名前・説明文はSteamから取得した言語(基本は日本語)をデフォルトとし、
// ロケールが英語のときだけ別途取得した英語版に差し替える。
// (Steam自体が日本語ローカライズしていないタイトルは、どちらのフィールドも
//  同じ英語テキストになる。将来他言語を追加する際は、この英語版を翻訳元にする想定)
export function localizedName(game: Game, locale: string): string {
  return locale === "en" && game.nameEn ? game.nameEn : game.name;
}

export function localizedDescription(game: Game, locale: string): string {
  return locale === "en" && game.shortDescriptionEn ? game.shortDescriptionEn : game.shortDescription;
}

export type Filters = {
  players?: number;
  mood?: MoodKey;
  minutes?: number;
  budget?: BudgetKey;
};

export function matchesFilters(game: Game, filters: Filters): boolean {
  if (filters.players === SOLO_PLAYERS && !game.coop.singlePlayer) return false;
  if (filters.players && filters.players !== SOLO_PLAYERS && game.maxPlayers < filters.players) return false;
  if (filters.mood && !game.moodTags.includes(filters.mood)) return false;
  if (filters.minutes && game.estimatedSessionMinutes > filters.minutes) return false;
  if (filters.budget === "free" && !game.isFree) return false;
  if (filters.budget === "under2000" && !(game.isFree || (game.priceJpy ?? Infinity) <= 2000)) return false;
  return true;
}

export function filterGames(filters: Filters): Game[] {
  return GAMES.filter((g) => matchesFilters(g, filters));
}

// 文字列から決定的な32bit整数シードを作る(依存ライブラリなしの簡易ハッシュ)
function hashStringToSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

// mulberry32: シード値から決定的な擬似乱数列を作る軽量PRNG
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * 条件に合うゲームの中から「今日のおすすめ5本」を選ぶ。
 * 日付をシードにしているので、同じ日・同じ条件なら同じ5本が出て共有可能。
 * 日が変われば並びが変わり「今日は何を遊ぶ」の新鮮さを出す。
 */
export function pickDailyTop5(filters: Filters, count = 5): Game[] {
  const candidates = filterGames(filters);
  const seed = hashStringToSeed(`${todayKey()}|${JSON.stringify(filters)}`);
  return seededShuffle(candidates, seed).slice(0, count);
}

export function getGameByAppId(appid: number): Game | undefined {
  return GAMES.find((g) => g.appid === appid);
}
