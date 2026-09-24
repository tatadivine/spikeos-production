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
    <div className="relative">
      <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-56 rounded-md border border-[var(--color-line)] bg-white py-1.5 pl-8 pr-3 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-400)] focus:border-[var(--color-blue-500)]"
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
  options: { value: string; label: string }[];
  label?: string;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-[var(--color-ink-500)]">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-[var(--color-line)] bg-white px-2 py-1.5 text-sm text-[var(--color-ink-900)] focus:border-[var(--color-blue-500)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-3">{children}</div>;
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="mb-4 flex gap-1 border-b border-[var(--color-line)]">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`relative px-3 py-2 text-sm font-medium transition-colors ${
            active === t.key
              ? "text-[var(--color-blue-600)]"
              : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
          }`}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span className="ml-1.5 rounded-full bg-[var(--color-surface)] px-1.5 py-0.5 text-[11px]">
              {t.count}
            </span>
          )}
          {active === t.key && (
            <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-[var(--color-blue-600)]" />
          )}
        </button>
      ))}
    </div>
  );
}
