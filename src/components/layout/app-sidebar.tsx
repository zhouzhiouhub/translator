"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Languages,
  Bot,
  History,
  HelpCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { locales, type AppLocale } from "@/i18n/config";
import { useRouteLocale } from "@/i18n/use-route-locale";
import {
  UI_LOCALE_LABELS,
  isFixedUiLocale,
  type UiLocale,
} from "@/i18n/ui-locales";
import { useUiLocaleStore } from "@/stores/ui-locale";

const navItems = [
  { key: "translator", href: "", icon: Languages, phase: 1 },
  { key: "aiConfig", href: "/settings/ai", icon: Bot, phase: 1 },
  { key: "history", href: "/history", icon: History, phase: 1 },
  { key: "help", href: "/help", icon: HelpCircle, phase: 1 },
  { key: "settings", href: "/settings", icon: Settings, phase: 1 },
] as const;

export function AppSidebar() {
  const t = useTranslations("nav");
  const routeLocale = useRouteLocale();
  const pathname = usePathname();
  const router = useRouter();
  const preferredUiLocale = useUiLocaleStore((s) => s.preferredUiLocale);
  const applyLocale = useUiLocaleStore((s) => s.applyLocale);

  const activeUiLocale: UiLocale = !isFixedUiLocale(preferredUiLocale)
    ? preferredUiLocale
    : routeLocale;

  async function onFixedLocaleClick(code: AppLocale) {
    await applyLocale(code);
    router.push(swapLocalePath(pathname, routeLocale, code));
  }

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar/90 backdrop-blur">
      <div className="flex items-center gap-2 border-b border-border px-4 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/symbol.svg"
          alt="Kinolin"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <div className="min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.svg"
            alt="kinolin"
            width={110}
            height={30}
            className="h-6 w-auto"
          />
          <p className="mt-0.5 truncate text-[11px] text-muted">{t("translator")}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const href = `/${routeLocale}${item.href}`;
          const active =
            item.href === ""
              ? pathname === `/${routeLocale}` ||
                pathname === `/${routeLocale}/`
              : item.href === "/settings"
                ? pathname === `/${routeLocale}/settings` ||
                  pathname === `/${routeLocale}/settings/`
                : pathname.startsWith(href);
          const disabled = item.phase > 1;
          const Icon = item.icon;

          if (disabled) {
            return (
              <span
                key={item.key}
                className="flex cursor-not-allowed items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted/70"
                title="Phase 2"
              >
                <Icon className="h-4 w-4" />
                {t(item.key)}
              </span>
            );
          }

          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-foreground hover:bg-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex gap-1">
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => void onFixedLocaleClick(code)}
              className={cn(
                "flex-1 rounded-lg px-2 py-1.5 text-center text-xs",
                activeUiLocale === code
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-muted hover:bg-slate-200",
              )}
            >
              {UI_LOCALE_LABELS[code]}
            </button>
          ))}
        </div>
        {!isFixedUiLocale(activeUiLocale) ? (
          <Link
            href={`/${routeLocale}/settings`}
            className="mt-2 block rounded-lg bg-primary/10 px-2 py-1.5 text-center text-xs font-medium text-primary hover:bg-primary/15"
          >
            {UI_LOCALE_LABELS[activeUiLocale]}
          </Link>
        ) : (
          <Link
            href={`/${routeLocale}/settings`}
            className="mt-2 block text-center text-[11px] text-muted hover:text-foreground"
          >
            {t("settings")}
          </Link>
        )}
      </div>
    </aside>
  );
}

function swapLocalePath(pathname: string, current: string, next: AppLocale) {
  const rest = pathname.replace(new RegExp(`^/${current}`), "") || "";
  return `/${next}${rest}`;
}
