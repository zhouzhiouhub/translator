import { setRequestLocale } from "next-intl/server";
import { SettingsPanel } from "@/components/settings/settings-panel";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SettingsPanel />;
}
