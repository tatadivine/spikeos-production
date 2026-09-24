import type { TimelineEvent } from "../../types";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative ml-2 border-l border-[var(--color-line)] pl-5">
      {events.map((e, i) => (
        <li key={e.id} className="mb-5 last:mb-0">
          <span className="absolute -left-[5px] mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-blue-600)]" />
          <p className="text-sm font-medium text-[var(--color-ink-900)]">{e.label}</p>
          <p className="text-xs text-[var(--color-ink-500)]">
            {new Date(e.timestamp).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · {e.actor}
          </p>
        </li>
      ))}
    </ol>
  );
}
