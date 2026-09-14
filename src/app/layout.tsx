import type { ReactNode } from "react";

/** Required by Next.js; document shell lives in `[locale]/layout`. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
