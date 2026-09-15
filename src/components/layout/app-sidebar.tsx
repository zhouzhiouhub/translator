"use client";

import { useEffect, useRef, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Languages,
  Bot,
  History,
  HelpCircle,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteLocale } from "@/i18n/use-route-locale";
import { Button } from "@/components/ui/button";

const navItems = [
  { key: "translator", href: "", icon: Languages },
  { key: "aiConfig", href: "/settings/ai", icon: Bot },
  { key: "history", href: "/history", icon: History },
  { key: "help", href: "/help", icon: HelpCircle },
  { key: "settings", href: "/settings", icon: Settings },
] as const;

export function AppSidebar({
  mobileOpen,
  onClose,
  menuButtonRef,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const routeLocale = useRouteLocale();
  const pathname = usePathname();
  const mobileAsideRef = useRef<HTMLElement>(null);
  const wasMobileOpen = useRef(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onClose]);

  useEffect(() => {
    if (!mobileOpen) {
      if (wasMobileOpen.current) {
        menuButtonRef.current?.focus();
      }
      wasMobileOpen.current = false;
      return;
    }

    wasMobileOpen.current = true;
    const frame = window.requestAnimationFrame(() => {
      mobileAsideRef.current?.querySelector<HTMLElement>(
        "button, a, [tabindex]:not([tabindex='-1'])",
      )?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [mobileOpen, menuButtonRef]);

  useEffect(() => {
    if (!mobileOpen) return;
    const media = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) onClose();
    };
    media.addEventListener("change", closeOnDesktop);
    return () => media.removeEventListener("change", closeOnDesktop);
  }, [mobileOpen, onClose]);

  function trapMobileFocus(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab" || !mobileAsideRef.current) return;
    const focusable = Array.from(
      mobileAsideRef.current.querySelectorAll<HTMLElement>(
        "button, a, [tabindex]:not([tabindex='-1'])",
      ),
    ).filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  const nav = (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-5">
        <div className="flex min-w-0 items-center gap-2">
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 md:hidden"
          aria-label={tCommon("closeMenu")}
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
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
              onClick={onClose}
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
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden h-full w-[220px] shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar/90 backdrop-blur md:flex">
        {nav}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-slate-900/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          aria-label={tCommon("closeMenu")}
          onClick={onClose}
        />
        <aside
          id="app-mobile-sidebar"
          ref={mobileAsideRef}
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(220px,85vw)] flex-col overflow-y-auto border-r border-border bg-sidebar shadow-xl transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label={tCommon("navigation")}
          onKeyDown={trapMobileFocus}
        >
          {nav}
        </aside>
      </div>
    </>
  );
}
