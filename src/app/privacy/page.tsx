import type { Metadata } from "next";

import { publicUrl } from "@/lib/public-pages.ts";
import { pageTitles } from "@/lib/site-metadata.ts";
import PrivacyPage from "@/src/client/pages/PrivacyPage.tsx";

export const metadata: Metadata = {
  title: pageTitles["/privacy"],
  alternates: { canonical: publicUrl('/privacy') },
  openGraph: { url: publicUrl('/privacy') },
};

const PrivacyRoute = () => <PrivacyPage />;

export default PrivacyRoute;
