import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import GameCard from "@/components/GameCard";
import ShareButtons from "@/components/ShareButtons";
import { pickDailyTop5, playerOptionLabel, type BudgetKey, type MoodKey, type Filters } from "@/lib/games";
import { moodEmoji } from "@/lib/moods";
import { routing } from "@/i18n/routing";

type SearchParams = {
  players?: string;
  mood?: string;
  minutes?: string;
  budget?: string;
};

function parseFilters(sp: SearchParams) {
  const players = sp.players ? Number(sp.players) : undefined;
  const mood = (sp.mood as MoodKey) || undefined;
  const minutes = sp.minutes ? Number(sp.minutes) : undefined;
  const budget = (sp.budget as BudgetKey) || undefined;
  return { players, mood, minutes, budget };
}

async function buildConditionsText(
  t: Awaited<ReturnType<typeof getTranslations>>,
  locale: string,
  filters: Filters
) {
  const playerLabels = { solo: t("players.solo"), unit: t("players.unit"), orMore: t("players.orMore") };
  const parts = [
    filters.players ? playerOptionLabel(filters.players, playerLabels) : null,
    filters.mood ? t(`mood.${filters.mood}`) : null,
    filters.minutes
      ? filters.minutes < 60
        ? t("time.minutesShort", { n: filters.minutes })
        : t("time.hoursShort", { n: filters.minutes / 60 })
      : null,
    filters.budget === "free" ? t("budget.free") : filters.budget === "under2000" ? t("budget.under2000") : null,
  ].filter(Boolean);
  return parts.join(locale === "ja" ? "・" : ", ");
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale });
  const filters = parseFilters(sp);
  const conditions = await buildConditionsText(t, locale, filters);
  const query = new URLSearchParams(sp as Record<string, string>).toString();
  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = `/${l}/result${query ? `?${query}` : ""}`;
  return {
    title: t("result.metaTitle", { conditions }),
    description: t("result.metaDescription", { conditions, players: filters.players ?? "" }),
    alternates: { languages },
  };
}

export default async function ResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const games = pickDailyTop5(filters, 5);
  const playerLabels = { solo: t("players.solo"), unit: t("players.unit"), orMore: t("players.orMore") };
  const conditions = await buildConditionsText(t, locale, filters);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-12">
      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
          👥 {filters.players ? playerOptionLabel(filters.players, playerLabels) : "?"}
        </span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
          {filters.mood ? moodEmoji(filters.mood) : ""} {filters.mood ? t(`mood.${filters.mood}`) : "?"}
        </span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
          ⏱{" "}
          {filters.minutes && filters.minutes < 60
            ? t("time.minutesShort", { n: filters.minutes })
            : t("time.hoursShort", { n: (filters.minutes ?? 0) / 60 })}
        </span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
          💰 {filters.budget === "free" ? t("budget.free") : t("budget.under2000")}
        </span>
        <Link href="/quiz" className="ml-auto text-sm underline">
          {t("result.changeConditions")}
        </Link>
      </div>

      <h1 className="text-2xl font-bold">
        {games.length > 0 ? t("result.recommendationsTitle", { count: games.length }) : t("result.noResultsTitle")}
      </h1>

      {games.length === 0 && (
        <p className="text-zinc-600 dark:text-zinc-400">
          {t.rich("result.noResultsBody", {
            browseLink: (chunks) => (
              <Link href="/browse" className="underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <GameCard key={g.appid} game={g} />
        ))}
      </div>

      {games.length > 0 && (
        <div className="flex justify-center">
          <ShareButtons shareText={t("result.shareText", { conditions })} />
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Link href="/browse" className="text-sm text-zinc-500 hover:underline">
          {t("result.moreLink")}
        </Link>
      </div>
    </div>
  );
}
