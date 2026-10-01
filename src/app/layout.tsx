import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";

import { publicUrl } from "@/src/lib/application/seo/publicPages.ts";
import { siteMetadata } from "@/src/lib/application/seo/siteMetadata.ts";
import AppContentClient from "@/src/lib/application/AppContentClient.tsx";
import AppContextProviders from "@/src/lib/application/AppContextProviders.tsx";
import { FONT_STYLESHEET } from "@/src/lib/utils/fonts.ts";
import {
  LANGUAGE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  isLanguageCode,
  isThemeOption,
  languageMeta,
} from "@/src/lib/application/shared/preferences.ts";

// The `lookupVerdict` server action runs inside this function. Keep it above the
// 55s OpenRouter budget (src/lib/ai/openRouterClient.ts) so a slow model returns JSON, not a 504.
export const maxDuration = 60;

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.origin),
  title: siteMetadata.title,
  description: siteMetadata.description,
  applicationName: siteMetadata.name,
  alternates: { canonical: publicUrl('/') },
  icons: {
    icon: [
      { url: "/icons/favicon.svg?v=4", type: "image/svg+xml" },
      { url: "/icons/favicon_32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/icons/apple_touch_icon.png",
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
 * "system" against prefers-color-scheme.
 */
const bootScript = `(function () {
  try {
    var lang = localStorage.getItem('languagePreference') || document.documentElement.lang || 'en'
    var dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
    document.documentElement.dir = dir
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
        <link rel="stylesheet" href={FONT_STYLESHEET} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body dir={direction} suppressHydrationWarning>
        <AppContextProviders initialLanguage={language} initialThemePreference={themePreference}>
          <AppContentClient>{children}</AppContentClient>
        </AppContextProviders>
      </body>
    </html>
  );
};

export default RootLayout;
