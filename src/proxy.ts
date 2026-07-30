import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

// 接続元の国 → 表示言語の対応表。ここに追加するだけで新しい言語をロールアウトできる
// (Steamへの再取得は不要。UI文言はsrc/messages配下に追加するだけでよい)
const COUNTRY_TO_LOCALE: Record<string, string> = {
  JP: "ja",
};

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // ユーザーがヘッダーの言語切り替えで明示的に選んだ場合はCookieが優先される
  // (next-intlの既定動作)。Cookie未設定の初回アクセス時のみ、接続元の国から推定する。
  const hasLocaleCookie = request.cookies.has("NEXT_LOCALE");

  if (!hasLocaleCookie) {
    // VercelにデプロイするとEdge Networkがこのヘッダーを自動付与する
    // (ローカル開発や他ホストでは undefined になり、Accept-Languageベースの
    //  next-intl標準の判定にフォールバックする)
    const country = request.headers.get("x-vercel-ip-country");
    const guessedLocale = country ? COUNTRY_TO_LOCALE[country] : undefined;

    if (guessedLocale && (routing.locales as readonly string[]).includes(guessedLocale)) {
      const response = intlMiddleware(request);
      response.cookies.set("NEXT_LOCALE", guessedLocale);
      return response;
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
