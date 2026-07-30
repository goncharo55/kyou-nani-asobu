import { defineRouting } from "next-intl/routing";

// 対応言語はこの配列に増やすだけでスケールする(Steamへの再取得は不要。
// UI文言はsrc/messages/*.json、ゲーム説明文の翻訳は別途のキャッシュで対応する設計)
export const routing = defineRouting({
  locales: ["ja", "en"],
  defaultLocale: "ja",
});

export type AppLocale = (typeof routing.locales)[number];
