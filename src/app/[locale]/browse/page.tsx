import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BrowseClient, { type InitialFilters } from "./BrowseClient";
import type { BudgetKey, MoodKey } from "@/lib/games";
import { buildAlternates } from "@/lib/alternates";

type SearchParams = {
  players?: string;
  minutes?: string;
  budget?: string;
  mood?: string | string[];
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "browse" });
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: buildAlternates("/browse"),
  };
}

export default async function BrowsePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const moods = sp.mood ? (Array.isArray(sp.mood) ? sp.mood : [sp.mood]) : [];

  const initialFilters: InitialFilters = {
    players: sp.players ? Number(sp.players) : undefined,
    minutes: sp.minutes ? Number(sp.minutes) : undefined,
    budget: (sp.budget as BudgetKey) || undefined,
    moods: moods as MoodKey[],
  };

  return <BrowseClient initialFilters={initialFilters} />;
}
