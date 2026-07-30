"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  ja: "日本語",
  en: "English",
};

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(nextLocale: string) {
    // next-intlのnavigationラッパー経由で遷移すると、Cookie(NEXT_LOCALE)も
    // 自動的に更新されるため、以後は自動判定より明示的な選択が優先される
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <select
      aria-label="Language"
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l] ?? l}
        </option>
      ))}
    </select>
  );
}
