import { NavLink, useLocation } from "react-router-dom";
import clsx from "clsx";

const TABS = [
  { label: "General", path: "/settings" },
  { label: "Scoring", path: "/settings/scoring" },
  { label: "Exclusions", path: "/settings/exclusions" },
  { label: "Permissions", path: "/settings/permissions" },
  { label: "Integrations", path: "/settings/integrations" },
  { label: "Audit", path: "/settings/audit" },
];

export function SettingsTabs() {
  const { pathname } = useLocation();
  return (
    <div className="mb-6 flex gap-1 border-b border-[var(--color-line)]">
      {TABS.map((t) => {
        const isActive = pathname === t.path;
        return (
          <NavLink
            key={t.path}
            to={t.path}
            end
            className={clsx(
              "relative px-3 py-2 text-sm font-medium",
              isActive ? "text-[var(--color-blue-600)]" : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
            )}
          >
            {t.label}
            {isActive && <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-[var(--color-blue-600)]" />}
          </NavLink>
        );
      })}
    </div>
  );
}
