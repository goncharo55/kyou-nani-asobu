import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { effectiveMinPlayers, GAMES, getGameByAppId, localizedDescription, localizedName } from "@/lib/games";
import { moodEmoji } from "@/lib/moods";
import { buildAlternates } from "@/lib/alternates";
import GameCard from "@/components/GameCard";

export function generateStaticParams() {
  return GAMES.map((g) => ({ appid: String(g.appid) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; appid: string }>;
}): Promise<Metadata> {
  const { locale, appid } = await params;
  const game = getGameByAppId(Number(appid));
  if (!game) return {};
  const t = await getTranslations({ locale, namespace: "game" });
  const minPlayers = effectiveMinPlayers(game);
  const name = localizedName(game, locale);
  const description = localizedDescription(game, locale);
  return {
    title: t("metaTitle", { name, minPlayers, maxPlayers: game.maxPlayers }),
    description,
    alternates: buildAlternates(`/games/${appid}`),
    openGraph: {
      title: name,
      description,
      images: [game.headerImage],
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ locale: string; appid: string }>;
}) {
  const { locale, appid } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const game = getGameByAppId(Number(appid));
  if (!game) notFound();
  const minPlayers = effectiveMinPlayers(game);
  const name = localizedName(game, locale);
  const description = localizedDescription(game, locale);

  const related = GAMES.filter(
    (g) => g.appid !== game.appid && g.moodTags.some((m) => game.moodTags.includes(m))
  ).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name,
    description,
    image: game.headerImage,
    url: game.steamUrl,
    genre: game.genres,
    ...(game.isFree
      ? { offers: { "@type": "Offer", price: "0", priceCurrency: "JPY" } }
      : game.priceJpy != null
        ? { offers: { "@type": "Offer", price: String(game.priceJpy), priceCurrency: "JPY" } }
        : {}),
    ...(game.reviewStats
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round((game.reviewStats.totalPositive / game.reviewStats.totalReviews) * 5 * 10) / 10,
            bestRating: "5",
            ratingCount: game.reviewStats.totalReviews,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/browse" className="text-sm text-zinc-500 hover:underline">
        {t("game.back")}
      </Link>

      <div className="relative aspect-[460/215] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <Image src={game.headerImage} alt={name} fill className="object-cover" unoptimized priority />
      </div>

      <h1 className="text-2xl font-bold">{name}</h1>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
          {game.isFree ? t("budget.free") : game.priceJpy != null ? `¥${game.priceJpy.toLocaleString()}` : t("game.unknownPrice")}
        </span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
          👥 {minPlayers === game.maxPlayers ? game.maxPlayers : `${minPlayers}〜${game.maxPlayers}`}
        </span>
        <span className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
          ⏱ {t("game.sessionMinutes", { n: game.estimatedSessionMinutes })}
        </span>
        {game.moodTags.map((m) => (
          <span key={m} className="rounded-full bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
            {moodEmoji(m)} {t(`mood.${m}`)}
          </span>
        ))}
      </div>

      <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{description}</p>

      {game.verified === false && <p className="text-xs text-zinc-400">{t("game.unverifiedNote")}</p>}

      <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
        {game.genres.map((g) => (
          <span key={g} className="rounded bg-zinc-100 px-2 py-1 dark:bg-zinc-800">
            {g}
          </span>
        ))}
      </div>

      <a
        href={game.steamUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit rounded-full bg-zinc-900 px-6 py-3 font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {t("game.viewOnSteam")}
      </a>

      {related.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold">{t("game.related")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((g) => (
              <GameCard key={g.appid} game={g} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
