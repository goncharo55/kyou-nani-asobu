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
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("pageTitle"),
    alternates: buildAlternates("/privacy"),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold">{t("pageTitle")}</h1>
      <p className="text-zinc-700 dark:text-zinc-300">{t("intro")}</p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("cookieTitle")}</h2>
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{t("cookieBody")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("adsTitle")}</h2>
        <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{t("adsBody")}</p>
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
