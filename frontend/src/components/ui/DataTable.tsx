import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import clsx from "clsx";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  width?: string;
}

export function DataTable<T>({
  columns,
  rows,
  onRowClick,
  emptyMessage = "No records match your filters.",
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = [...rows];
  if (sortKey) {
    const col = columns.find((c) => c.key === sortKey);
    if (col?.sortValue) {
      sorted.sort((a, b) => {
        const av = col.sortValue!(a);
        const bv = col.sortValue!(b);
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
  }

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] py-14 text-center text-sm text-[var(--color-ink-500)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-line)] bg-white">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-ink-500)]"
              >
                {col.sortValue ? (
                  <button
                    className="inline-flex items-center gap-1 hover:text-[var(--color-ink-900)]"
                    onClick={() => toggleSort(col.key)}
                  >
                    {col.header}
                    {sortKey === col.key &&
                      (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                "border-b border-[var(--color-line)] last:border-0",
                onRowClick && "cursor-pointer hover:bg-[var(--color-blue-50)] transition-colors"
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2.5 text-[var(--color-ink-700)]">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
