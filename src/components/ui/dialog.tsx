"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-brand-ink/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-border bg-card p-5 shadow-xl",
          className,
        )}
      >
        <h2 className="shrink-0 text-lg font-semibold text-brand-ink">{title}</h2>
        <div className="mt-3 min-h-0 flex-1 overflow-auto text-sm text-muted">
          {children}
        </div>
        {footer ? (
          <div className="mt-5 flex shrink-0 justify-end gap-2">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
