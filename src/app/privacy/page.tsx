import type { Metadata } from "next";

import { publicUrl } from "@/lib/public-pages.js";
import { pageTitles } from "@/lib/site-metadata.js";
import PrivacyPage from "@/src/client/pages/PrivacyPage.jsx";

export const metadata: Metadata = {
  title: pageTitles["/privacy"],
  alternates: { canonical: publicUrl('/privacy') },
  openGraph: { url: publicUrl('/privacy') },
};

const PrivacyRoute = () => <PrivacyPage />;

export default PrivacyRoute;
