import type { Metadata } from "next";

/** Unknown paths keep the app shell (header, footer) and are never indexed. */
export const metadata: Metadata = {
  robots: { index: false },
};

const NotFound = () => null;

export default NotFound;
