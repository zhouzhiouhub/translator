import { setRequestLocale } from "next-intl/server";
import { HelpPanel } from "@/components/help/help-panel";

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HelpPanel />;
}
