import { setRequestLocale } from "next-intl/server";
import { AiConfigForm } from "@/components/ai-config/ai-config-form";

export default async function AiSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AiConfigForm />;
}
