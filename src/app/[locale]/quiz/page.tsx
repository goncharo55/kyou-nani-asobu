"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MOOD_KEYS, moodEmoji } from "@/lib/moods";
import { PLAYER_OPTIONS, TIME_OPTIONS, playerOptionLabel, type BudgetKey, type MoodKey } from "@/lib/games";

type Step = 0 | 1 | 2 | 3;

export default function QuizPage() {
  const t = useTranslations();
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [players, setPlayers] = useState<number | null>(null);
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [minutes, setMinutes] = useState<number | null>(null);

  const stepTitles = [t("quiz.stepPlayers"), t("quiz.stepMood"), t("quiz.stepTime"), t("quiz.stepBudget")];
  const progress = useMemo(() => ((step + 1) / stepTitles.length) * 100, [step, stepTitles.length]);
  const playerLabels = { solo: t("players.solo"), unit: t("players.unit"), orMore: t("players.orMore") };

  function goNext() {
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }

  function goBack() {
    setStep((s) => (s > 0 ? ((s - 1) as Step) : s));
  }

  function finish(budget: BudgetKey) {
    const params = new URLSearchParams({
      players: String(players),
      mood: String(mood),
      minutes: String(minutes),
      budget,
    });
    router.push(`/result?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-12">
      <div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-50"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-zinc-500">{t("quiz.stepCounter", { current: step + 1, total: stepTitles.length })}</p>
      </div>

      <h1 className="text-2xl font-bold">{stepTitles[step]}</h1>

      {step === 0 && (
        <div className="grid grid-cols-3 gap-4">
          {PLAYER_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => {
                setPlayers(n);
                goNext();
              }}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-md ${
                players === n
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <span className="text-xl font-bold">{playerOptionLabel(n, playerLabels)}</span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-2 gap-4">
          {MOOD_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => {
                setMood(key);
                goNext();
              }}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-8 transition hover:-translate-y-0.5 hover:shadow-md ${
                mood === key
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <span className="text-4xl">{moodEmoji(key)}</span>
              <span className="font-medium">{t(`mood.${key}`)}</span>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-3 gap-4">
          {TIME_OPTIONS.map((time) => (
            <button
              key={time}
              onClick={() => {
                setMinutes(time);
                goNext();
              }}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-md ${
                minutes === time
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <span className="text-2xl font-bold">
                {time < 60 ? t("time.minutesShort", { n: time }) : t("time.hoursShort", { n: time / 60 })}
              </span>
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => finish("free")}
            className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-8 transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-2xl font-bold">{t("budget.free")}</span>
          </button>
          <button
            onClick={() => finish("under2000")}
            className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-8 transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="text-2xl font-bold">{t("budget.under2000")}</span>
          </button>
        </div>
      )}

      {step > 0 && (
        <button onClick={goBack} className="w-fit text-sm text-zinc-500 hover:underline">
          {t("quiz.back")}
        </button>
      )}
    </div>
  );
}
