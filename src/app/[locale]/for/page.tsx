import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LANDING_PAGES } from "@/lib/landing-pages";
import { buildAlternates } from "@/lib/alternates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.hub" });
  return {
    title: t("pageTitle"),
    description: t("intro"),
    alternates: buildAlternates("/for"),
  };
}

export default async function LandingHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing.hub");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
      <p className="text-zinc-600 dark:text-zinc-400">{t("intro")}</p>

      <ul className="flex flex-col gap-3">
        {LANDING_PAGES.map((p) => (
          <LandingCard key={p.slug} slug={p.slug} />
        ))}
      </ul>
    </div>
  );
}

async function LandingCard({ slug }: { slug: string }) {
  const t = await getTranslations(`landing.${slug}`);
  return (
    <li>
      <Link
        href={`/for/${slug}`}
        className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
      >
        <span className="font-semibold">{t("title")}</span>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">{t("lead")}</span>
      </Link>
    </li>
  );
}
