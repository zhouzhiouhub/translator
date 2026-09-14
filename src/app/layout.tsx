/** Root layout is locale-aware under `[locale]`. Keep a minimal shell for non-locale routes (api). */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
