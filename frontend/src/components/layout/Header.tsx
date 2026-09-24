import { useState } from "react";
import { Zap, ChevronDown, Calendar, CheckCircle2, User, Bell, Layers, PlayCircle, LogOut, Repeat } from "lucide-react";
import { useSession } from "../../lib/SessionContext";
import { alertsForOwner } from "../../mock/generator";
import { ALEX_ID } from "../../services";
import { Modal } from "../ui/Modal";
import { HowSpikeOSWorks } from "./HowSpikeOSWorks";
import { ACCOUNT_TYPE_LABELS } from "../../lib/auth";
import clsx from "clsx";

const RANGE_OPTIONS = ["Last 7 Days", "Last 30 Days", "Last Quarter", "Year to Date"];

export function Header({ pageTitle }: { pageTitle: string }) {
  const { accountType, displayName, title, viewMode, setViewMode, canUseManagerView, setTourOpen, pushToast, signOut } =
    useSession();
  const [range, setRange] = useState("Last 30 Days");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const items = alertsForOwner(ALEX_ID).slice(0, 5);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--color-line)] bg-[linear-gradient(90deg,#0d1526_0%,#16233d_100%)] px-6 text-white">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-orange-500)]">
            <Zap size={17} className="text-white" fill="currentColor" />
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-bold uppercase tracking-wide">Spike Electric</p>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-white/15 sm:block" />
        <h1 className="truncate text-lg font-semibold text-white">{pageTitle}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <button
          onClick={() => setHowOpen(true)}
          className="hidden items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 lg:flex"
        >
          <Layers size={14} /> How SpikeOS Works
        </button>
        <button
          onClick={() => {
            setTourOpen(true);
            pushToast("Product tour started.");
          }}
          className="hidden items-center gap-1.5 rounded-md bg-[var(--color-blue-600)] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-blue-500)] lg:flex"
        >
          <PlayCircle size={14} /> Start Product Tour
        </button>

        {/* Date range */}
        <div className="relative">
          <button
            onClick={() => setRangeOpen((v) => !v)}
            className="flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
          >
            <Calendar size={13} />
            {range}
            <ChevronDown size={13} />
          </button>
          {rangeOpen && (
            <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-md border border-[var(--color-line)] bg-white shadow-lg">
              {RANGE_OPTIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRange(r);
                    setRangeOpen(false);
                  }}
                  className={clsx(
                    "block w-full px-3 py-2 text-left text-xs hover:bg-[var(--color-surface)]",
                    r === range ? "font-semibold text-[var(--color-blue-600)]" : "text-[var(--color-ink-700)]"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* My View / Manager View toggle */}
        {canUseManagerView ? (
          <div className="flex rounded-md bg-white/10 p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode("my")}
              className={clsx(
                "rounded px-3 py-1.5 transition-colors",
                viewMode === "my" ? "bg-[var(--color-blue-600)] text-white" : "text-white/70 hover:text-white"
              )}
            >
              My View
            </button>
            <button
              onClick={() => setViewMode("manager")}
              className={clsx(
                "rounded px-3 py-1.5 transition-colors",
                viewMode === "manager" ? "bg-[var(--color-blue-600)] text-white" : "text-white/70 hover:text-white"
              )}
            >
              Manager View
            </button>
          </div>
        ) : (
          <div className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70">My View</div>
        )}

        {/* Monitoring status */}
        <div className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white/80 xl:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-green-600)]" />
          Monitoring Active
          <span className="text-white/30">•</span>
          <CheckCircle2 size={12} className="text-[var(--color-green-600)]" />
          Employee Acknowledged
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10"
          >
            <Bell size={16} />
            {items.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-red-600)]" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-30 mt-2 w-80 rounded-lg border border-[var(--color-line)] bg-white text-[var(--color-ink-900)] shadow-lg">
              <div className="border-b border-[var(--color-line)] px-3 py-2 text-xs font-medium">Notifications</div>
              <div className="max-h-80 overflow-y-auto">
                {items.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setNotifOpen(false);
                      pushToast("Opened notification.");
                    }}
                    className="block w-full border-b border-[var(--color-line)] px-3 py-2.5 text-left text-xs hover:bg-[var(--color-surface)] last:border-0"
                  >
                    <p className="font-medium">{a.reason}</p>
                    <p className="mt-0.5 text-[var(--color-ink-500)]">{a.source}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            title={`${displayName} — ${ACCOUNT_TYPE_LABELS[accountType]}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <User size={16} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 z-30 mt-2 w-72 overflow-hidden rounded-lg border border-[var(--color-line)] bg-white text-[var(--color-ink-900)] shadow-lg">
              <div className="border-b border-[var(--color-line)] px-3.5 py-3">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-[var(--color-ink-500)]">{title}</p>
                <span className="mt-1.5 inline-block rounded-full bg-[var(--color-blue-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-blue-600)]">
                  Signed in via Microsoft — {ACCOUNT_TYPE_LABELS[accountType]}
                </span>
              </div>

              <button
                onClick={() => { setProfileOpen(false); void signOut(); }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal open={howOpen} onClose={() => setHowOpen(false)} title="How SpikeOS Works" width="max-w-2xl">
        <HowSpikeOSWorks />
      </Modal>
    </header>
  );
}
