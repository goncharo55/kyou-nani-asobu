import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MOOD_KEYS, moodEmoji } from "@/lib/moods";
import { GAMES } from "@/lib/games";
import { LANDING_PAGES } from "@/lib/landing-pages";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-4 py-16 text-center sm:py-24">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("home.title")}</h1>
        <p className="max-w-xl whitespace-pre-line text-zinc-600 dark:text-zinc-400">{t("home.description")}</p>

        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Link
            href="/quiz"
            className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-2xl">🎯</span>
            <span className="text-lg font-semibold">{t("home.quizCardTitle")}</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("home.quizCardDesc")}</span>
          </Link>
          <Link
            href="/browse"
            className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-2xl">🔍</span>
            <span className="text-lg font-semibold">{t("home.browseCardTitle")}</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("home.browseCardDesc")}</span>
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-zinc-500">
          <span>{t("home.moodTagsLabel")}</span>
          {MOOD_KEYS.map((key) => (
            <span key={key} className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
              {moodEmoji(key)} {t(`mood.${key}`)}
            </span>
          ))}
        </div>
        <p className="text-xs text-zinc-400">{t("home.gameCount", { count: GAMES.length })}</p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {LANDING_PAGES.map((p) => (
            <LandingPill key={p.slug} slug={p.slug} />
          ))}
        </div>
      </section>
    </div>
  );
}

async function LandingPill({ slug }: { slug: string }) {
  const t = await getTranslations(`landing.${slug}`);
  return (
    <Link
      href={`/for/${slug}`}
      className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
    >
      {t("title")}
    </Link>
  );
}
