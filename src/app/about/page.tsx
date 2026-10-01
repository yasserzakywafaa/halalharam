import type { Metadata } from "next";

import { publicUrl } from "@/lib/public-pages.js";
import { pageTitles } from "@/lib/site-metadata.js";
import AboutPage from "@/src/client/pages/AboutPage.jsx";

export const metadata: Metadata = {
  title: pageTitles["/about"],
  alternates: { canonical: publicUrl('/about') },
  openGraph: { url: publicUrl('/about') },
};

const AboutRoute = () => <AboutPage />;

export default AboutRoute;
