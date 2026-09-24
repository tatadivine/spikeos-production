import type { ReactNode } from "react";
import { Inbox, AlertTriangle } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-line)] bg-white px-6 py-14 text-center">
      <div className="mb-3 text-[var(--color-ink-400)]">{icon ?? <Inbox size={28} />}</div>
      <p className="text-sm font-medium text-[var(--color-ink-900)]">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-[var(--color-ink-500)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--color-line)]/60" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--color-red-100)] bg-[var(--color-red-100)]/40 px-6 py-10 text-center">
      <AlertTriangle size={24} className="mb-2 text-[var(--color-red-600)]" />
      <p className="text-sm font-medium text-[var(--color-red-600)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md border border-[var(--color-red-600)] px-3 py-1.5 text-xs font-medium text-[var(--color-red-600)] hover:bg-white"
        >
          Try again
        </button>
      )}
    </div>
  );
}
