"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ShareButtons({ shareText }: { shareText: string }) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  function handleShareX() {
    const url = window.location.href;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleShareX}
        className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {t("result.share")}
      </button>
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {copied ? t("result.linkCopied") : t("result.copyLink")}
      </button>
    </div>
  );
}
