import { setRequestLocale } from "next-intl/server";
import { HistoryPanel } from "@/components/history/history-panel";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HistoryPanel />;
}
