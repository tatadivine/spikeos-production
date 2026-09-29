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
    const col = columns.find(
      (column) => column.key === sortKey
    );

    if (col?.sortValue) {
      sorted.sort((a, b) => {
        const av = col.sortValue!(a);
        const bv = col.sortValue!(b);

        const cmp =
          av < bv
            ? -1
            : av > bv
              ? 1
              : 0;

        return sortDir === "asc"
          ? cmp
          : -cmp;
      });
    }
  }

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((direction) =>
        direction === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] py-10 text-center text-sm text-[var(--color-ink-500)] sm:py-14">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-white">
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    width: column.width,
                  }}
                  className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-[var(--color-ink-500)]"
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-[var(--color-ink-900)]"
                      onClick={() =>
                        toggleSort(column.key)
                      }
                    >
                      {column.header}

                      {sortKey === column.key &&
                        (sortDir === "asc" ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        ))}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sorted.map((row, index) => (
              <tr
                key={index}
                onClick={() =>
                  onRowClick?.(row)
                }
                className={clsx(
                  "border-b border-[var(--color-line)] last:border-0",
                  onRowClick &&
                    "cursor-pointer transition-colors hover:bg-[var(--color-blue-50)]"
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-2.5 text-[var(--color-ink-700)]"
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card/list view */}
      <div className="divide-y divide-[var(--color-line)] md:hidden">
        {sorted.map((row, index) => (
          <div
            key={index}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={() =>
              onRowClick?.(row)
            }
            onKeyDown={(event) => {
              if (
                onRowClick &&
                (event.key === "Enter" ||
                  event.key === " ")
              ) {
                event.preventDefault();
                onRowClick(row);
              }
            }}
            className={clsx(
              "block w-full px-4 py-4 text-left",
              onRowClick &&
                "cursor-pointer transition-colors hover:bg-[var(--color-blue-50)] active:bg-[var(--color-blue-50)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-blue-500)]",
              !onRowClick &&
                "cursor-default"
            )}
          >
            <div className="space-y-3">
              {columns.map((column, columnIndex) => (
                <div
                  key={column.key}
                  className={clsx(
                    "min-w-0",
                    columnIndex === 0 &&
                      "pb-1"
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-400)]">
                      {column.header}
                    </span>

                    {column.sortValue && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleSort(column.key);
                        }}
                        className="flex shrink-0 items-center text-[var(--color-ink-400)] hover:text-[var(--color-ink-900)]"
                        aria-label={`Sort by ${column.header}`}
                      >
                        {sortKey === column.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp size={13} />
                          ) : (
                            <ChevronDown size={13} />
                          )
                        ) : (
                          <ChevronDown
                            size={13}
                            className="opacity-40"
                          />
                        )}
                      </button>
                    )}
                  </div>

                  <div
                    className={clsx(
                      "min-w-0 text-sm text-[var(--color-ink-700)]",
                      columnIndex === 0 &&
                        "font-medium text-[var(--color-ink-900)]"
                    )}
                  >
                    {column.render(row)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}