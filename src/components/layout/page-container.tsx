import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared content width for all app pages. */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
