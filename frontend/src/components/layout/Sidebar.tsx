import { NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { visibleNav } from "./nav";
import { useSession } from "../../lib/SessionContext";
import { PRIVILEGE_LABELS } from "../../lib/permissions";
import clsx from "clsx";

const ROLE_TO_PRIVILEGE_LABEL: Record<string, string> = {
  employee: PRIVILEGE_LABELS.standard,
  team_lead: PRIVILEGE_LABELS.team_lead,
  manager: PRIVILEGE_LABELS.manager,
  administrator: "Administrator",
};

export function Sidebar() {
  const { role, displayName, title } = useSession();
  const nav = visibleNav(role);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Communication: true,
  });

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-[var(--color-line)] bg-white">
      <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-4 scrollbar-none">
        {nav.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isOpen = openGroups[item.label] ?? false;
          return (
            <div key={item.label} className="mb-0.5">
              {hasChildren ? (
                <button
                  onClick={() => setOpenGroups((s) => ({ ...s, [item.label]: !isOpen }))}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={17} />
                    {item.label}
                  </span>
                  <ChevronDown size={14} className={clsx("transition-transform", isOpen && "rotate-180")} />
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
                      isActive
                        ? "bg-[var(--color-blue-50)] text-[var(--color-blue-600)]"
                        : "text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
                    )
                  }
                >
                  <Icon size={17} />
                  {item.label}
                </NavLink>
              )}
              {hasChildren && isOpen && (
                <div className="ml-6 mt-0.5 space-y-0.5 border-l border-[var(--color-line)] pl-3">
                  {item.children!.map((child) => (
                    <NavLink
                      key={child.path}
                      to={child.path}
                      end
                      className={({ isActive }) =>
                        clsx(
                          "block rounded-md px-2.5 py-1.5 text-[13px]",
                          isActive
                            ? "font-semibold text-[var(--color-blue-600)]"
                            : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
                        )
                      }
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-line)] px-3 py-3">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-blue-600)] text-xs font-semibold text-white">
            {displayName.split(" ").map((n) => n[0]).join("")}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[var(--color-ink-900)]">{displayName}</p>
            <p className="truncate text-[11px] text-[var(--color-ink-400)]">{title}</p>
          </div>
        </div>
        <span className="mt-2 inline-block rounded-full bg-[var(--color-blue-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-blue-600)]">
          {ROLE_TO_PRIVILEGE_LABEL[role] ?? role}
        </span>
      </div>
    </aside>
  );
}
