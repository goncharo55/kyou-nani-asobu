import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildAlternates } from "@/lib/alternates";
import ContactLink from "@/components/ContactLink";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("pageTitle"),
    alternates: buildAlternates("/about"),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
      <p className="text-zinc-700 dark:text-zinc-300">{t("intro")}</p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("whatTitle")}</h2>
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{t("whatBody")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("dataTitle")}</h2>
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{t("dataBody")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("contactTitle")}</h2>
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{t("contactBody")}</p>
        <ContactLink label={t("contactFormLabel")} unavailable={t("contactUnavailable")} />
      </section>
    </div>
  );
}
