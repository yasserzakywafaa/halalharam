import { homeJsonLd } from "@/src/lib/application/seo/homeJsonLd.ts";

/**
 * The lookup UI lives in the shared shell (src/components/PageContainer/PageContainer.tsx) so it stays
 * mounted across routes. This page only adds the home-only structured data.
 */
const HomeRoute = () => (
  <script
    type="application/ld+json"
    id="home-jsonld"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd).replace(/</g, "\\u003c") }}
  />
);

export default HomeRoute;
