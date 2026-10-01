import AboutPageContent from "./aboutPageContent.tsx";
import type { Metadata } from "next";
import { publicUrl } from "@/src/lib/application/seo/publicPages.ts";
import { pageTitles } from "@/src/lib/application/seo/siteMetadata.ts";
import { routes } from "@/src/lib/application/routes.ts";

export const metadata: Metadata = {
  title: pageTitles[routes.about],
  alternates: { canonical: publicUrl(routes.about) },
  openGraph: { url: publicUrl(routes.about) },
};

const AboutPage = () => {
  return <AboutPageContent />;
};

export default AboutPage;
