import { useState } from "react";
import { FileSearch, ChevronRight, CheckCircle2, AlertTriangle, Sparkles, ShieldCheck } from "lucide-react";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { useSession } from "../../lib/SessionContext";
import clsx from "clsx";

export interface EvidenceItem {
  id: string;
  title: string;
  date: string;
  quote: string;
  tag: string;
  positive: boolean;
  aiNote?: string;
}

export function EvidenceCoachingCard({ items }: { items: EvidenceItem[] }) {
  const { pushToast } = useSession();
  const [tab, setTab] = useState<"positive" | "attention">("positive");
  const [activeItem, setActiveItem] = useState<EvidenceItem | null>(null);
  const [appealText, setAppealText] = useState("");
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const positive = items.filter((i) => i.positive);
  const attention = items.filter((i) => !i.positive);
  const shown = tab === "positive" ? positive : attention;

  function sendContext(item: EvidenceItem) {
    setSentIds((prev) => new Set(prev).add(item.id));
    pushToast("Context sent to your manager for review.", "success");
  }

  return (
    <Card padded={false}>
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-3.5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--color-ink-900)]">
          <FileSearch size={16} className="text-[var(--color-blue-600)]" /> Evidence & Coaching
        </h2>
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="flex items-center gap-1 rounded-full bg-[var(--color-purple-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-purple-600)]">
            <Sparkles size={10} /> AI-assisted
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-ink-500)]">
            <ShieldCheck size={10} /> Manager validation required
          </span>
        </div>
      </div>

      <div className="flex gap-1 px-4 pt-3">
        <button
          onClick={() => setTab("positive")}
          className={clsx(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
            tab === "positive" ? "bg-[var(--color-blue-600)] text-white" : "bg-[var(--color-surface)] text-[var(--color-ink-700)]"
          )}
        >
          Positive Examples ({positive.length})
        </button>
        <button
          onClick={() => setTab("attention")}
          className={clsx(
            "rounded-md px-2.5 py-1.5 text-xs font-medium",
            tab === "attention" ? "bg-[var(--color-blue-600)] text-white" : "bg-[var(--color-surface)] text-[var(--color-ink-700)]"
          )}
        >
          Needs Attention ({attention.length})
        </button>
      </div>

      <div className="space-y-2.5 p-4">
        {shown.map((item) => (
          <div key={item.id} className="flex items-start gap-3 rounded-lg border border-[var(--color-line)] p-3">
            <span
              className={clsx(
                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                item.positive ? "bg-[var(--color-green-100)] text-[var(--color-green-600)]" : "bg-[var(--color-amber-100)] text-[var(--color-amber-600)]"
              )}
            >
              {item.positive ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">{item.title}</p>
                <p className="shrink-0 text-[11px] text-[var(--color-ink-400)]">{item.date}</p>
              </div>
              <p className="mt-0.5 truncate text-[12px] italic text-[var(--color-ink-500)]">"{item.quote}"</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-block rounded bg-[var(--color-blue-50)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-blue-600)]">
                  {item.tag}
                </span>
                {sentIds.has(item.id) && (
                  <span className="inline-flex items-center gap-1 rounded bg-[var(--color-green-100)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-green-600)]">
                    <CheckCircle2 size={9} /> Context provided
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setActiveItem(item)}
              className="mt-0.5 flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-[var(--color-blue-600)] hover:underline"
            >
              View Context <ChevronRight size={12} />
            </button>
          </div>
        ))}
      </div>

      <Modal open={!!activeItem} onClose={() => { setActiveItem(null); setAppealText(""); }} title={activeItem?.title ?? ""}>
        {activeItem && (
          <div>
            <p className="mb-2 text-xs text-[var(--color-ink-500)]">
              {activeItem.date} · {activeItem.tag}
            </p>
            <p className="mb-3 rounded-md bg-[var(--color-surface)] p-3 text-[13px] text-[var(--color-ink-700)]">"{activeItem.quote}"</p>

            {!activeItem.positive && (
              <div className="mb-4 flex items-start gap-2 rounded-md bg-[var(--color-purple-100)] p-2.5 text-xs text-[var(--color-purple-600)]">
                <Sparkles size={13} className="mt-0.5 shrink-0" />
                <span>
                  AI-assisted read: {activeItem.aiNote ?? "Flagged by an automated pattern rule, not a content review."} A
                  manager reviews this before it affects any performance rating.
                </span>
              </div>
            )}

            {!activeItem.positive && !sentIds.has(activeItem.id) && (
              <div>
                <p className="mb-1 text-xs font-medium text-[var(--color-ink-700)]">
                  This doesn't reflect what happened? Add context.
                </p>
                <textarea
                  value={appealText}
                  onChange={(e) => setAppealText(e.target.value)}
                  rows={3}
                  placeholder="e.g. I was covering for a teammate on PTO, this was reassigned the same day…"
                  className="mb-3 w-full resize-y rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
                />
                <button
                  disabled={!appealText.trim()}
                  onClick={() => sendContext(activeItem)}
                  className="w-full rounded-md bg-[var(--color-blue-600)] py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  Send context to manager
                </button>
              </div>
            )}

            {sentIds.has(activeItem.id) && (
              <p className="flex items-center gap-1.5 text-sm text-[var(--color-green-600)]">
                <CheckCircle2 size={15} /> Context sent — marked "employee context provided."
              </p>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}
