import { NavLink } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
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

export function Sidebar({
  mobileOpen = false,
  onNavigate,
}: {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const { role, displayName, title } = useSession();

  const nav = visibleNav(role);

  const [openGroups, setOpenGroups] = useState<
    Record<string, boolean>
  >({
    Communication: true,
  });

  return (
    <aside
      className={clsx(
        "flex flex-col border-r border-[var(--color-line)] bg-white",

        // Mobile/tablet drawer
        "fixed bottom-0 left-0 top-14 z-50 w-72 shadow-xl transition-transform duration-200 sm:top-16",

        // Desktop sidebar
        "lg:static lg:z-auto lg:h-full lg:w-60 lg:translate-x-0 lg:shadow-none",

        // Mobile drawer state
        mobileOpen
          ? "translate-x-0"
          : "-translate-x-full"
      )}
      aria-label="Primary navigation"
    >
      {/* Mobile drawer header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-line)] px-4 lg:hidden">
        <p className="text-sm font-semibold text-[var(--color-ink-900)]">
          Navigation
        </p>

        <button
          type="button"
          onClick={onNavigate}
          aria-label="Close navigation"
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-ink-500)] hover:bg-[var(--color-surface)]"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-4 scrollbar-none">
        {nav.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isOpen =
            openGroups[item.label] ?? false;

          return (
            <div
              key={item.label}
              className="mb-0.5"
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((state) => ({
                      ...state,
                      [item.label]: !isOpen,
                    }))
                  }
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={17} />
                    {item.label}
                  </span>

                  <ChevronDown
                    size={14}
                    className={clsx(
                      "transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium",
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
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        clsx(
                          "block rounded-md px-2.5 py-2 text-[13px]",
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

      {/* User information */}
      <div className="border-t border-[var(--color-line)] px-3 py-3">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-blue-600)] text-xs font-semibold text-white">
            {displayName
              .split(" ")
              .map((name) => name[0])
              .join("")}
          </span>

          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[var(--color-ink-900)]">
              {displayName}
            </p>

            <p className="truncate text-[11px] text-[var(--color-ink-400)]">
              {title}
            </p>
          </div>
        </div>

        <span className="mt-2 inline-block rounded-full bg-[var(--color-blue-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-blue-600)]">
          {ROLE_TO_PRIVILEGE_LABEL[role] ??
            role}
        </span>
      </div>
    </aside>
  );
}