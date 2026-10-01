import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";

import { publicUrl } from "@/lib/public-pages.ts";
import { siteMetadata } from "@/lib/site-metadata.ts";
import AppShell from "@/src/client/AppShell.tsx";
import AppProviders from "@/src/client/providers.tsx";
import { LATIN_FONT_STYLESHEET } from "@/src/client/fonts.ts";
import {
  LANGUAGE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  isLanguageCode,
  isThemeOption,
  languageMeta,
} from "@/src/client/preferences.ts";
import "@/src/client/index.css";

// The `lookupVerdict` server action runs inside this function. Keep it above the
// 55s OpenRouter budget (lib/openrouter.js) so a slow model returns JSON, not a 504.
export const maxDuration = 60;

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.origin),
  title: siteMetadata.title,
  description: siteMetadata.description,
  applicationName: siteMetadata.name,
  alternates: { canonical: publicUrl('/') },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo.svg?v=3", type: "image/svg+xml" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: siteMetadata.name },
  other: { "mobile-web-app-capable": "yes" },
  openGraph: {
    type: "website",
    siteName: siteMetadata.name,
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: publicUrl('/'),
    images: [siteMetadata.ogImage],
    locale: siteMetadata.ogLocale,
    alternateLocale: siteMetadata.ogAlternateLocales,
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.title,
    description: siteMetadata.description,
    images: [{ url: siteMetadata.ogImage.url, alt: siteMetadata.ogImage.alt }],
  },
};

export const viewport: Viewport = {
  themeColor: siteMetadata.themeColorLight,
  colorScheme: "light dark",
};

/**
 * Runs before paint: localStorage wins over the cookie (they normally match), resolves
 * "system" against prefers-color-scheme, and loads the Arabic face only when needed.
 */
const bootScript = `(function () {
  try {
    var lang = localStorage.getItem('languagePreference') || document.documentElement.lang || 'en'
    var dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    if (lang === 'ar' && !document.head.querySelector('link[data-arabic-font]')) {
      var font = document.createElement('link')
      font.rel = 'stylesheet'
      font.href = 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap'
      font.setAttribute('data-arabic-font', 'true')
      document.head.appendChild(font)
    }
    var pref = localStorage.getItem('themePreference') || 'system'
    var mode = pref === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : pref
    document.documentElement.dataset.theme = mode
    var theme = document.querySelector('meta[name="theme-color"]')
    if (theme) theme.setAttribute('content', mode === 'dark' ? '${siteMetadata.themeColorDark}' : '${siteMetadata.themeColorLight}')
  } catch (e) {}
})()`;

export interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = async ({ children }: Readonly<RootLayoutProps>) => {
  const cookieStore = await cookies();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const storedLanguage = cookieStore.get(LANGUAGE_STORAGE_KEY)?.value;
  const storedTheme = cookieStore.get(THEME_STORAGE_KEY)?.value;
  const language = isLanguageCode(storedLanguage) ? storedLanguage : "en";
  const themePreference = isThemeOption(storedTheme) ? storedTheme : "system";
  const direction = languageMeta(language).dir;
  const ssrMode = themePreference === "dark" ? "dark" : "light";

  return (
    <html lang={language} dir={direction} data-theme={ssrMode} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={LATIN_FONT_STYLESHEET} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body dir={direction} suppressHydrationWarning>
        <AppProviders initialLanguage={language} initialThemePreference={themePreference}>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
};

export default RootLayout;
