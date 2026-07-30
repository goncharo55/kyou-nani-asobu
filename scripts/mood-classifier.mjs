// ゲームのジャンル・説明文(英語/日本語どちらでも)から気分タグを推定するルールベース分類器。
// 1000本規模になると手動判定・検索キーワード単位の分類はスケールしないため、
// 説明文そのものを見て複数タグを付与できるようにしている。
// 完璧な精度は狙わず、「レビュー品質フィルタで質を担保しつつ、気分はざっくり当てる」設計。
const MOOD_KEYWORDS = {
  laugh: {
    en: [
      "comedy",
      "comedic",
      "funny",
      "hilarious",
      "humor",
      "humour",
      "silly",
      "ridiculous",
      "wacky",
      "whacky",
      "goofy",
      "party game",
      "chaotic",
      "physics-based",
      "slapstick",
      "absurd",
    ],
    ja: ["コメディ", "面白", "爆笑", "ばか", "おかしな", "パーティー", "ハチャメチャ", "はちゃめちゃ", "ドタバタ"],
  },
  scary: {
    en: [
      "horror",
      "scary",
      "terrifying",
      "terror",
      "survival horror",
      "zombie",
      "ghost",
      "haunted",
      "nightmare",
      "creepy",
      "dread",
      "psychological horror",
      "monster",
    ],
    ja: ["ホラー", "恐怖", "怖い", "幽霊", "ゾンビ", "戦慄", "恐ろしい", "怪物"],
  },
  brain: {
    en: [
      "puzzle",
      "strategy",
      "tactics",
      "tactical",
      "logic",
      "riddle",
      "deduction",
      "chess",
      "turn-based",
      "brain teaser",
      "escape room",
      "management",
    ],
    ja: ["パズル", "謎", "戦略", "頭脳", "推理", "脱出", "戦術"],
  },
  chill: {
    en: [
      "relax",
      "relaxing",
      "cozy",
      "peaceful",
      "calm",
      "farm",
      "farming",
      "sandbox",
      "slow-paced",
      "life sim",
      "wholesome",
    ],
    ja: ["のんびり", "癒し", "農場", "まったり", "ゆったり", "牧場"],
  },
};

// appdetailsはl=japaneseで取得しているため、genresは「アクション」等の日本語文字列で
// 返ってくる。英語名の正規名(GENRE_FALLBACK等で使う)に変換するための対応表。
// (Steamの公式ジャンル一覧は数十種類程度の閉じた集合なので、手動対応表で足りる)
const GENRE_JA_TO_EN = {
  アクション: "Action",
  アドベンチャー: "Adventure",
  カジュアル: "Casual",
  インディー: "Indie",
  RPG: "RPG",
  ロールプレイング: "RPG",
  ストラテジー: "Strategy",
  シミュレーション: "Simulation",
  レース: "Racing",
  スポーツ: "Sports",
  "大規模マルチプレイヤー": "Massively Multiplayer",
  MMO: "Massively Multiplayer",
  無料プレイ: "Free To Play",
  早期アクセス: "Early Access",
  "バイオレンス": "Violent",
  "ギョア": "Gore",
};

function normalizeGenres(genres) {
  return genres.map((g) => GENRE_JA_TO_EN[g] ?? g);
}

const GENRE_FALLBACK = {
  laugh: ["Action", "Sports", "Racing"],
  brain: ["RPG", "Strategy"],
  chill: ["Casual", "Simulation"],
};

export function classifyMood(genres, shortDescription) {
  const normalizedGenres = normalizeGenres(genres);
  const text = `${normalizedGenres.join(" ")} ${shortDescription ?? ""}`.toLowerCase();
  const moods = new Set();

  for (const [mood, dict] of Object.entries(MOOD_KEYWORDS)) {
    const hit = dict.en.some((kw) => text.includes(kw)) || dict.ja.some((kw) => text.includes(kw));
    if (hit) moods.add(mood);
  }

  if (moods.size === 0) {
    for (const [mood, genreList] of Object.entries(GENRE_FALLBACK)) {
      if (genreList.some((g) => normalizedGenres.includes(g))) {
        moods.add(mood);
        break;
      }
    }
  }

  return [...moods];
}

export function estimateSessionMinutes(genres) {
  const normalizedGenres = normalizeGenres(genres);
  if (normalizedGenres.some((g) => ["RPG", "Strategy", "Simulation", "Massively Multiplayer"].includes(g))) return 180;
  if (normalizedGenres.includes("Casual") || normalizedGenres.includes("Sports") || normalizedGenres.includes("Racing"))
    return 30;
  return 60;
}
