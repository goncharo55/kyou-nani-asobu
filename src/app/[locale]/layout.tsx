import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/alternates";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  const siteName = t("name");
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL("https://example.com"),
    title: {
      default: title,
      template: `%s｜${siteName}`,
    },
    description,
    alternates: buildAlternates(""),
    openGraph: {
      type: "website",
      locale,
      siteName,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale });

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <NextIntlClientProvider>
          <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-lg font-bold tracking-tight">
                {t("site.name")}
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium">
                <Link href="/quiz" className="hover:underline">
                  {t("nav.quiz")}
                </Link>
                <Link href="/browse" className="hover:underline">
                  {t("nav.browse")}
                </Link>
                <LocaleSwitcher />
              </nav>
            </div>
          </header>
          <main className="flex flex-1 flex-col">{children}</main>
          <footer className="border-t border-zinc-200 px-4 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
            <nav className="mb-3 flex justify-center gap-4">
              <Link href="/about" className="hover:underline">
                {t("footer.about")}
              </Link>
              <Link href="/privacy" className="hover:underline">
                {t("footer.privacy")}
              </Link>
              <Link href="/terms" className="hover:underline">
                {t("footer.terms")}
              </Link>
            </nav>
            <p>{t("footer.disclaimer")}</p>
            <p className="mt-1">{t("footer.copyright", { year: new Date().getFullYear(), name: t("site.name") })}</p>
          </footer>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
