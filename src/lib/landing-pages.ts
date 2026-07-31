import type { LandingFilters } from "./games";

// 検索意図に合わせたSEOランディングページの定義。
// 「今日ナニ遊ぶ？」という検索は母数が少ないため、実際の検索ボリュームがある
// 周辺キーワード(「大学生 遊び おすすめ」等)ごとに専用ページを用意する。
// 文言は src/messages/*.json の "landing.<slug>" 名前空間で管理する。
export type LandingPageConfig = {
  slug: string;
  filters: LandingFilters;
};

export const LANDING_PAGES: LandingPageConfig[] = [
  {
    slug: "university-students",
    filters: { moods: ["laugh"], players: 3, budget: "under2000" },
  },
  {
    slug: "rainy-day-date",
    filters: { moods: ["chill", "brain"], players: 2 },
  },
  {
    slug: "indoor-with-friends",
    filters: { moods: ["laugh", "scary"], players: 3 },
  },
  {
    slug: "two-people-bored",
    filters: { players: 2, minutes: 30 },
  },
  {
    slug: "couple-ideas",
    filters: { moods: ["chill", "laugh"], players: 2 },
  },
];

export function getLandingPage(slug: string): LandingPageConfig | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}
