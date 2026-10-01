import { homeJsonLd } from "@/lib/home-jsonld.ts";

/**
 * The lookup UI lives in the shared shell (src/client/AppShell.tsx) so it stays
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
