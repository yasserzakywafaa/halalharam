import PrivacyPolicyPageContent from "./privacyPolicyPageContent.tsx";
import type { Metadata } from "next";
import { publicUrl } from "@/src/lib/application/seo/publicPages.ts";
import { pageTitles } from "@/src/lib/application/seo/siteMetadata.ts";
import { routes } from "@/src/lib/application/routes.ts";

export const metadata: Metadata = {
  title: pageTitles[routes.privacyPolicy],
  alternates: { canonical: publicUrl(routes.privacyPolicy) },
  openGraph: { url: publicUrl(routes.privacyPolicy) },
};

const PrivacyPolicyPage = () => {
  return <PrivacyPolicyPageContent />;
};

export default PrivacyPolicyPage;
