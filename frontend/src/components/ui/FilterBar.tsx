import { Search } from "lucide-react";
import type { ReactNode } from "react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:w-56">
      <Search
        size={15}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)]"
      />

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-md border border-[var(--color-line)] bg-white py-2 pl-8 pr-3 text-sm text-[var(--color-ink-900)] outline-none placeholder:text-[var(--color-ink-400)] focus:border-[var(--color-blue-500)] focus:ring-1 focus:ring-[var(--color-blue-500)]"
      />
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: {
    value: string;
    label: string;
  }[];
  label?: string;
}) {
  return (
    <label className="flex min-w-0 w-full items-center gap-2 text-xs text-[var(--color-ink-500)] sm:w-auto">
      {label && (
        <span className="shrink-0">
          {label}
        </span>
      )}

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="min-w-0 w-full rounded-md border border-[var(--color-line)] bg-white px-2.5 py-2 text-sm text-[var(--color-ink-900)] outline-none focus:border-[var(--color-blue-500)] focus:ring-1 focus:ring-[var(--color-blue-500)] sm:w-auto"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mb-4 flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      {children}
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: {
    key: string;
    label: string;
    count?: number;
  }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="mb-4 overflow-x-auto border-b border-[var(--color-line)] scrollbar-none">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() =>
              onChange(tab.key)
            }
            className={`relative shrink-0 px-3 py-2.5 text-sm font-medium transition-colors ${
              active === tab.key
                ? "text-[var(--color-blue-600)]"
                : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
            }`}
          >
            {tab.label}

            {typeof tab.count ===
              "number" && (
              <span className="ml-1.5 rounded-full bg-[var(--color-surface)] px-1.5 py-0.5 text-[11px]">
                {tab.count}
              </span>
            )}

            {active === tab.key && (
              <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[var(--color-blue-600)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}