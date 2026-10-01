import type { Metadata } from "next";

import { publicUrl } from "@/lib/public-pages.ts";
import { pageTitles } from "@/lib/site-metadata.ts";
import AboutPage from "@/src/client/pages/AboutPage.tsx";

export const metadata: Metadata = {
  title: pageTitles["/about"],
  alternates: { canonical: publicUrl('/about') },
  openGraph: { url: publicUrl('/about') },
};

const AboutRoute = () => <AboutPage />;

export default AboutRoute;
