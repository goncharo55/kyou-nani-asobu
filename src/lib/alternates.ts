import { routing } from "@/i18n/routing";

// 各ページで「他言語版はここにある」とGoogleに伝えるhreflang代替リンクを組み立てる。
// 多言語サイトが重複コンテンツ扱いされず、適切な言語版がそれぞれ検索結果に出るために必要。
export function buildAlternates(pathname: string): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = `/${locale}${pathname}`;
  }
  return { languages };
}
