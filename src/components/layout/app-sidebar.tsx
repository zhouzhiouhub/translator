"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Languages,
  Bot,
  History,
  HelpCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteLocale } from "@/i18n/use-route-locale";

const navItems = [
  { key: "translator", href: "", icon: Languages },
  { key: "aiConfig", href: "/settings/ai", icon: Bot },
  { key: "history", href: "/history", icon: History },
  { key: "help", href: "/help", icon: HelpCircle },
  { key: "settings", href: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const t = useTranslations("nav");
  const routeLocale = useRouteLocale();
  const pathname = usePathname();

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo.svg"
          alt="kinolin"
          width={110}
          height={30}
          className="h-6 w-auto"
        />
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
          const Icon = item.icon;

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
    </aside>
  );
}
