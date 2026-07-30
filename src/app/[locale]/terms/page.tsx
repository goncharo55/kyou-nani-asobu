import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/alternates";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  return {
    title: t("pageTitle"),
    alternates: buildAlternates("/terms"),
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terms");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
      <p className="text-zinc-700 dark:text-zinc-300">{t("intro")}</p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("disclaimerTitle")}</h2>
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{t("disclaimerBody")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("unofficialTitle")}</h2>
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{t("unofficialBody")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("liabilityTitle")}</h2>
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{t("liabilityBody")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("changesTitle")}</h2>
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{t("changesBody")}</p>
      </section>
    </div>
  );
}
