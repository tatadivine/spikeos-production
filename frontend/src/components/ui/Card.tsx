import type { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-[var(--color-line)] bg-white",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-[var(--color-ink-500)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
