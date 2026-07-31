import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import GameCard from "@/components/GameCard";
import { LANDING_PAGES, getLandingPage } from "@/lib/landing-pages";
import { pickForLanding, localizedName } from "@/lib/games";
import { buildAlternates } from "@/lib/alternates";

export function generateStaticParams() {
  return LANDING_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getLandingPage(slug);
  if (!page) return {};
  const t = await getTranslations({ locale, namespace: `landing.${slug}` });
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: buildAlternates(`/for/${slug}`),
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const page = getLandingPage(slug);
  if (!page) notFound();
  setRequestLocale(locale);
  const t = await getTranslations(`landing.${slug}`);
  const tCommon = await getTranslations("landing");

  const games = pickForLanding(page.filters, 8);
  const otherPages = LANDING_PAGES.filter((p) => p.slug !== slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("title"),
    itemListElement: games.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: localizedName(g, locale),
      url: `https://example.com/${locale}/games/${g.appid}`,
    })),
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/for" className="text-sm text-zinc-500 hover:underline">
        ← {tCommon("hub.pageTitle")}
      </Link>

      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("lead")}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <GameCard key={g.appid} game={g} />
        ))}
      </div>

      <div className="mt-2 flex justify-center">
        <Link href="/quiz" className="text-sm text-zinc-500 hover:underline">
          {tCommon("quizCta")}
        </Link>
      </div>

      {otherPages.length > 0 && (
        <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <h2 className="mb-4 text-lg font-bold">{tCommon("moreScenes")}</h2>
          <ul className="flex flex-col gap-2">
            {otherPages.map((p) => (
              <LandingLink key={p.slug} slug={p.slug} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

async function LandingLink({ slug }: { slug: string }) {
  const t = await getTranslations(`landing.${slug}`);
  return (
    <li>
      <Link href={`/for/${slug}`} className="text-sm underline">
        {t("title")}
      </Link>
    </li>
  );
}
