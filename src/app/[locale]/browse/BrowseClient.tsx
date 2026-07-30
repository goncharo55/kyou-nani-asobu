"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import GameCard from "@/components/GameCard";
import {
  GAMES,
  matchesFilters,
  PLAYER_OPTIONS,
  TIME_OPTIONS,
  playerOptionLabel,
  type BudgetKey,
  type MoodKey,
} from "@/lib/games";
import { MOOD_KEYS, moodEmoji } from "@/lib/moods";

const PAGE_SIZE = 24;

export type InitialFilters = {
  players?: number;
  minutes?: number;
  budget?: BudgetKey;
  moods: MoodKey[];
};

export default function BrowseClient({ initialFilters }: { initialFilters: InitialFilters }) {
  const t = useTranslations();
  const router = useRouter();

  const [players, setPlayersState] = useState<number | undefined>(initialFilters.players);
  const [minutes, setMinutesState] = useState<number | undefined>(initialFilters.minutes);
  const [budget, setBudgetState] = useState<BudgetKey | undefined>(initialFilters.budget);
  const [selectedMoods, setSelectedMoods] = useState<Set<MoodKey>>(new Set(initialFilters.moods));
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const playerLabels = { solo: t("players.solo"), unit: t("players.unit"), orMore: t("players.orMore") };
  const timeLabels: Record<number, string> = {
    30: t("time.within30"),
    60: t("time.within60"),
    180: t("time.within180"),
  };

  function syncUrl(next: { players?: number; minutes?: number; budget?: BudgetKey; moods: Set<MoodKey> }) {
    const params = new URLSearchParams();
    if (next.players) params.set("players", String(next.players));
    if (next.minutes) params.set("minutes", String(next.minutes));
    if (next.budget) params.set("budget", next.budget);
    next.moods.forEach((m) => params.append("mood", m));
    router.replace(`/browse?${params.toString()}`, { scroll: false });
  }

  function toggleMood(mood: MoodKey) {
    const next = new Set(selectedMoods);
    if (next.has(mood)) next.delete(mood);
    else next.add(mood);
    setSelectedMoods(next);
    syncUrl({ players, minutes, budget, moods: next });
    setVisibleCount(PAGE_SIZE);
  }

  function setPlayers(value: number | undefined) {
    setPlayersState(value);
    syncUrl({ players: value, minutes, budget, moods: selectedMoods });
    setVisibleCount(PAGE_SIZE);
  }

  function setMinutes(value: number | undefined) {
    setMinutesState(value);
    syncUrl({ players, minutes: value, budget, moods: selectedMoods });
    setVisibleCount(PAGE_SIZE);
  }

  function setBudget(value: BudgetKey | undefined) {
    setBudgetState(value);
    syncUrl({ players, minutes, budget: value, moods: selectedMoods });
    setVisibleCount(PAGE_SIZE);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GAMES.filter((g) => {
      if (!matchesFilters(g, { players, minutes, budget })) return false;
      if (selectedMoods.size > 0 && !g.moodTags.some((m) => selectedMoods.has(m))) return false;
      if (q && !g.name.toLowerCase().includes(q) && !(g.nameEn ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [players, minutes, budget, selectedMoods, query]);

  const visibleGames = filtered.slice(0, visibleCount);

  function handleQueryChange(value: string) {
    setQuery(value);
    setVisibleCount(PAGE_SIZE);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-12">
      <aside className="hidden w-56 shrink-0 flex-col gap-6 sm:flex">
        <FilterGroup label={t("browse.filterPlayers")}>
          <FilterChip active={players === undefined} onClick={() => setPlayers(undefined)} label={t("budget.all")} />
          {PLAYER_OPTIONS.map((n) => (
            <FilterChip
              key={n}
              active={players === n}
              onClick={() => setPlayers(n)}
              label={playerOptionLabel(n, playerLabels)}
            />
          ))}
        </FilterGroup>

        <FilterGroup label={t("browse.filterMood")}>
          {MOOD_KEYS.map((key) => (
            <FilterChip
              key={key}
              active={selectedMoods.has(key)}
              onClick={() => toggleMood(key)}
              label={`${moodEmoji(key)} ${t(`mood.${key}`)}`}
            />
          ))}
        </FilterGroup>

        <FilterGroup label={t("browse.filterTime")}>
          <FilterChip active={minutes === undefined} onClick={() => setMinutes(undefined)} label={t("budget.all")} />
          {TIME_OPTIONS.map((time) => (
            <FilterChip key={time} active={minutes === time} onClick={() => setMinutes(time)} label={timeLabels[time]} />
          ))}
        </FilterGroup>

        <FilterGroup label={t("browse.filterBudget")}>
          <FilterChip active={budget === undefined} onClick={() => setBudget(undefined)} label={t("budget.all")} />
          <FilterChip active={budget === "free"} onClick={() => setBudget("free")} label={t("budget.free")} />
          <FilterChip
            active={budget === "under2000"}
            onClick={() => setBudget("under2000")}
            label={t("budget.under2000")}
          />
        </FilterGroup>
      </aside>

      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold">{t("browse.heading")}</h1>
          <p className="shrink-0 text-sm text-zinc-500">
            {filtered.length}
            {t("browse.countSuffix")}
          </p>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t("browse.searchPlaceholder")}
          className="mb-4 w-full rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600"
        />

        {/* モバイル用の簡易フィルタ(横スクロール) */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 sm:hidden">
          {MOOD_KEYS.map((key) => (
            <FilterChip
              key={key}
              active={selectedMoods.has(key)}
              onClick={() => toggleMood(key)}
              label={`${moodEmoji(key)} ${t(`mood.${key}`)}`}
            />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleGames.map((g) => (
            <GameCard key={g.appid} game={g} />
          ))}
        </div>

        {filtered.length === 0 && <p className="mt-8 text-center text-zinc-500">{t("browse.noResults")}</p>}

        {visibleCount < filtered.length && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="rounded-full border border-zinc-200 bg-white px-6 py-2 text-sm font-medium transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {t("browse.loadMore", { count: filtered.length - visibleCount })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}
