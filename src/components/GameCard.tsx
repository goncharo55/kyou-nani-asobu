import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { effectiveMinPlayers, localizedDescription, localizedName, type Game } from "@/lib/games";
import { moodEmoji } from "@/lib/moods";

export default function GameCard({ game }: { game: Game }) {
  const t = useTranslations();
  const locale = useLocale();
  const minPlayers = effectiveMinPlayers(game);
  const name = localizedName(game, locale);
  const description = localizedDescription(game, locale);
  return (
    <Link
      href={`/games/${game.appid}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative aspect-[460/215] w-full bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={game.headerImage}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform group-hover:scale-105"
          unoptimized
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-semibold text-zinc-900 dark:text-zinc-50">{name}</h3>
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2 text-xs">
          <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {game.isFree ? t("budget.free") : game.priceJpy != null ? `¥${game.priceJpy.toLocaleString()}` : t("game.unknownPrice")}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {minPlayers === game.maxPlayers
              ? t("game.playersExact", { n: game.maxPlayers })
              : t("game.playersRange", { min: minPlayers, max: game.maxPlayers })}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {t("game.sessionMinutes", { n: game.estimatedSessionMinutes })}
          </span>
          {game.moodTags.map((m) => (
            <span key={m} className="text-base leading-none">
              {moodEmoji(m)}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
