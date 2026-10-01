import { useState } from "react";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Layers,
  LogOut,
  Menu,
  PlayCircle,
  User,
  X,
  Zap,
} from "lucide-react";
import {
  useSession,
  type DateRange,
} from "../../lib/SessionContext";
import { alertsForOwner } from "../../mock/generator";
import { ALEX_ID } from "../../services";
import { Modal } from "../ui/Modal";
import { HowSpikeOSWorks } from "./HowSpikeOSWorks";
import { ACCOUNT_TYPE_LABELS } from "../../lib/auth";
import clsx from "clsx";

const RANGE_OPTIONS: DateRange[] = [
  "Last 7 Days",
  "Last 30 Days",
  "Last Quarter",
  "Year to Date",
];

export function Header({
  pageTitle,
  onMenuClick,
}: {
  pageTitle: string;
  onMenuClick?: () => void;
}) {
  const {
    accountType,
    displayName,
    title,
    setTourOpen,
    pushToast,
    signOut,
    dateRange,
    setDateRange,
  } = useSession();

  const [rangeOpen, setRangeOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const items = alertsForOwner(ALEX_ID).slice(0, 5);

  const closeMenus = () => {
    setRangeOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  };

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[var(--color-line)] bg-[linear-gradient(90deg,#0d1526_0%,#16233d_100%)] px-3 text-white sm:h-16 sm:gap-3 sm:px-4 lg:px-6">
      {/* Left side */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3 lg:gap-4">
        {/* Mobile / tablet menu */}
        <button
          type="button"
          onClick={() => {
            closeMenus();
            onMenuClick?.();
          }}
          aria-label="Open navigation"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white/80 hover:bg-white/10 lg:hidden"
        >
          <Menu size={19} />
        </button>

        {/* Brand */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-orange-500)] sm:h-9 sm:w-9">
            <Zap
              size={17}
              className="text-white"
              fill="currentColor"
            />
          </span>

          <div className="hidden leading-tight sm:block">
            <p className="text-[13px] font-bold uppercase tracking-wide">
              Spike Electric
            </p>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-white/15 sm:block" />

        {/* Page title */}
        <h1 className="min-w-0 truncate text-sm font-semibold text-white sm:text-base lg:text-lg">
          {pageTitle}
        </h1>
      </div>

      {/* Right side */}
      <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2.5">
        {/* How SpikeOS Works */}
        <button
          type="button"
          onClick={() => setHowOpen(true)}
          className="hidden items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 lg:flex"
        >
          <Layers size={14} />
          How SpikeOS Works
        </button>

        {/* Product Tour */}
        <button
          type="button"
          onClick={() => {
            setTourOpen(true);
            pushToast("Product tour started.");
          }}
          className="hidden items-center gap-1.5 rounded-md bg-[var(--color-blue-600)] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-blue-500)] lg:flex"
        >
          <PlayCircle size={14} />
          Start Product Tour
        </button>

        {/* Date range */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => {
              setNotifOpen(false);
              setProfileOpen(false);
              setRangeOpen((open) => !open);
            }}
            aria-expanded={rangeOpen}
            className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/10 sm:px-3"
          >
            <Calendar size={13} />

            <span className="hidden md:inline">
              {dateRange}
            </span>

            <span className="md:hidden">
              30 Days
            </span>

            <ChevronDown size={13} />
          </button>

          {rangeOpen && (
            <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-md border border-[var(--color-line)] bg-white shadow-lg">
              {RANGE_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => {
                    setDateRange(option);
                    setRangeOpen(false);
                  }}
                  className={clsx(
                    "block w-full px-3 py-2 text-left text-xs hover:bg-[var(--color-surface)]",
                    option === dateRange
                      ? "font-semibold text-[var(--color-blue-600)]"
                      : "text-[var(--color-ink-700)]"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Monitoring status */}
        <div className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/80 xl:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-green-600)]" />

          Monitoring Active

          <span className="text-white/30">
            •
          </span>

          <CheckCircle2
            size={12}
            className="text-[var(--color-green-600)]"
          />

          Employee Acknowledged
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setRangeOpen(false);
              setProfileOpen(false);
              setNotifOpen((open) => !open);
            }}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-white/70 hover:bg-white/10"
          >
            <Bell size={17} />

            {items.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-red-600)]" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-lg border border-[var(--color-line)] bg-white text-[var(--color-ink-900)] shadow-lg">
              <div className="flex items-center justify-between border-b border-[var(--color-line)] px-3 py-2">
                <span className="text-xs font-medium">
                  Notifications
                </span>

                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  aria-label="Close notifications"
                  className="rounded p-1 text-[var(--color-ink-400)] hover:bg-[var(--color-surface)]"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {items.length > 0 ? (
                  items.map((alert) => (
                    <button
                      type="button"
                      key={alert.id}
                      onClick={() => {
                        setNotifOpen(false);
                        pushToast("Opened notification.");
                      }}
                      className="block w-full border-b border-[var(--color-line)] px-3 py-2.5 text-left text-xs hover:bg-[var(--color-surface)] last:border-0"
                    >
                      <p className="font-medium">
                        {alert.reason}
                      </p>

                      <p className="mt-0.5 text-[var(--color-ink-500)]">
                        {alert.source}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-4 text-xs text-[var(--color-ink-500)]">
                    No notifications.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setRangeOpen(false);
              setNotifOpen(false);
              setProfileOpen((open) => !open);
            }}
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            title={`${displayName} — ${ACCOUNT_TYPE_LABELS[accountType]}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <User size={16} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-[var(--color-line)] bg-white text-[var(--color-ink-900)] shadow-lg">
              <div className="border-b border-[var(--color-line)] px-3.5 py-3">
                <p className="text-sm font-semibold">
                  {displayName}
                </p>

                <p className="text-xs text-[var(--color-ink-500)]">
                  {title}
                </p>

                <span className="mt-1.5 inline-block rounded-full bg-[var(--color-blue-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-blue-600)]">
                  Signed in via Microsoft —{" "}
                  {ACCOUNT_TYPE_LABELS[accountType]}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  void signOut();
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={howOpen}
        onClose={() => setHowOpen(false)}
        title="How SpikeOS Works"
        width="max-w-2xl"
      >
        <HowSpikeOSWorks />
      </Modal>
    </header>
  );
}