"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UiLocaleSwitcher } from "@/components/layout/ui-locale-switcher";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  const tCommon = useTranslations("common");
  const tBrand = useTranslations("brand");
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="flex h-dvh overflow-hidden">
      <AppSidebar mobileOpen={mobileOpen} onClose={closeMobile} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/80 px-4 backdrop-blur md:justify-end md:px-8">
          <div className="flex items-center gap-2 md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              aria-label={tCommon("openMenu")}
              aria-expanded={mobileOpen}
              aria-controls="app-mobile-sidebar"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/symbol.svg"
              alt=""
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="truncate text-sm font-medium text-brand-ink">
              {tBrand("nameEn")}
            </span>
          </div>
          <UiLocaleSwitcher />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
