import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { getGraphAccessToken } from "./auth";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Inbox,
  Mail,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import "./styles.css";

declare const Office: any;

type InboxMessage = {
  id: string;
  subject: string;
  sender: string;
  sender_email: string;
  received_at?: string;
  age_hours: number;
  preview: string;
  category: string;
  excluded: boolean;
  exclusion_reason?: string;
  sla_hours: number;
  status: "needs_response" | "overdue" | "excluded";
  status_label: string;
  is_read?: boolean;
  web_link?: string;
};

type InboxPayload = {
  mode: "live";
  summary: {
    total: number;
    relevant: number;
    needs_response: number;
    overdue: number;
    excluded: number;
    customer_vendor?: number;
    response_score?: number;
    open_commitments?: number;
    coaching_signals?: number;
  };
  messages: InboxMessage[];
  message?: string;
};

const API = import.meta.env.VITE_API_BASE_URL || "/api/v1";
const SPIKEOS_URL = import.meta.env.VITE_SPIKEOS_URL || "http://localhost:5173";


function formatAge(hours: number) {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
}

async function getGraphToken(): Promise<string | null> {
  return getGraphAccessToken();
}

async function requireGraphToken(): Promise<string> {
  const token = await getGraphToken();
  if (!token) throw new Error("Microsoft Graph authentication failed. Check Entra/NAA configuration.");
  return token;
}

async function loadInbox(): Promise<InboxPayload> {
  try {
    const accessToken = await getGraphToken();
    if (!accessToken) throw new Error("Microsoft Graph authentication failed. Check Entra/NAA configuration.");
    const response = await fetch(`${API}/outlook/inbox-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ top: 25 }),
    });
    if (!response.ok) throw new Error(`Backend returned ${response.status}`);
    const data = (await response.json()) as InboxPayload;
    return data;
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unable to load live Outlook data");
  }
}

function App() {
  const [view, setView] = useState<"summary" | "detail">("summary");
  const [selected, setSelected] = useState<InboxMessage | null>(null);
  const [inbox, setInbox] = useState<InboxPayload | null>(null);
  const [compact, setCompact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setRefreshing(true);
    try {
      const data = await loadInbox();
      setInbox(data);
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load live Outlook data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (typeof Office === "undefined") {
      setError("Office.js is not running. Open this page from Outlook.");
      setLoading(false);
      return;
    }

    Office.onReady(async () => {
      await load();

      // Keep the summary as the default view, but react when the user selects
      // a message while the pane is pinned in Outlook.
      try {
        Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, () => {
          const item = Office.context.mailbox.item;
          if (!item) {
            setSelected(null);
            setView("summary");
            return;
          }
          setView("summary");
          setSelected(null);
        });
      } catch {
        // Older Outlook clients may not expose ItemChanged in this context.
      }
    });
  }, []);

  const summary = inbox?.summary;
  const attention = useMemo(
    () => (inbox?.messages || []).filter((m) => m.status !== "excluded").slice(0, 6),
    [inbox],
  );

  const openMessage = async (message: InboxMessage) => {
    setSelected(message);
    setView("detail");
    try {
      await fetch(`${API}/outlook/context`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await requireGraphToken()}` },
        body: JSON.stringify({
          message_id: message.id,
          subject: message.subject,
          sender: message.sender_email,
          body_preview: message.preview,
        }),
      });
    } catch {
      // The detail view remains usable if the backend is temporarily unavailable.
    }
  };

  return (
    <div className={`panel ${compact ? "compact" : ""}`}>
      <header>
        <div className="brand">
          <div className="bolt">⚡</div>
          <div>
            <strong>SPIKEOS</strong>
            <small>Communication Intelligence</small>
          </div>
        </div>
        <div className="actions">
          <button className="icon-button" title="Refresh inbox" onClick={load}>
            <RefreshCw size={13} className={refreshing ? "spin" : ""} />
          </button>
          <button className="icon-button" title="Collapse" onClick={() => setCompact(!compact)}>
            {compact ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <span className="bell"><Bell size={11} /> {summary?.overdue || 0}</span>
        </div>
      </header>

      {error && <div className="notice">{error}</div>}

      {loading ? (
        <div className="loading"><RefreshCw size={16} className="spin" /> Loading your communication summary…</div>
      ) : view === "summary" ? (
        <main>
          <div className="eyebrow"><Inbox size={11} /> YOUR COMMUNICATION TODAY</div>
          <h1>Inbox Intelligence</h1>
          <p className="subtext">A summary of the messages in your Outlook inbox that may require attention.</p>

          <section className="metric-grid">
            <Metric value={summary?.total ?? 0} label="Inbox" />
            <Metric value={summary?.needs_response ?? 0} label="Need reply" tone="amber" />
            <Metric value={summary?.overdue ?? 0} label="Overdue" tone="red" />
            <Metric value={summary?.excluded ?? 0} label="Excluded" tone="muted" />
          </section>

          {!compact && (
            <>
              <section className="score-card">
                <div>
                  <div className="muted">TODAY'S RESPONSE SCORE</div>
                  <strong>{summary?.response_score ?? 0}</strong><span>/100</span>
                </div>
                <div className="score-ring"><CheckCircle2 size={20} /></div>
              </section>

              <div className="section-heading">
                <span>Attention needed</span>
                <span className="count">{attention.length}</span>
              </div>

              <section className="message-list">
                {attention.map((message) => (
                  <button className="message-row" key={message.id} onClick={() => openMessage(message)}>
                    <div className="status-dot" data-status={message.status} />
                    <div className="message-copy">
                      <div className="message-top"><strong>{message.sender}</strong><span>{formatAge(message.age_hours)}</span></div>
                      <div className="message-subject">{message.subject}</div>
                      <div className="message-preview">{message.preview}</div>
                    </div>
                    <ChevronDown size={13} className="row-arrow" />
                  </button>
                ))}
              </section>

              <div className="quick-grid">
                <div><Clock3 size={14} /><span>Open commitments</span><b>{summary?.open_commitments ?? 0}</b></div>
                <div><Sparkles size={14} /><span>Coaching signals</span><b>{summary?.coaching_signals ?? 0}</b></div>
              </div>

              <button className="dashboard-button" onClick={() => window.open(`${SPIKEOS_URL}/#/dashboard`, "_blank")}>
                Open full SpikeOS dashboard →
              </button>
            </>
          )}
        </main>
      ) : (
        <main>
          <button className="back-button" onClick={() => setView("summary")}><ArrowLeft size={14} /> Back to inbox summary</button>
          {selected && (
            <>
              <div className="eyebrow"><Mail size={11} /> MESSAGE INTELLIGENCE</div>
              <h1>{selected.subject}</h1>
              <p className="sender">{selected.sender} · {selected.sender_email}</p>

              <section className={`alert ${selected.status}`}>
                <div className="alert-title">
                  {selected.status === "overdue" ? <><AlertTriangle size={14} /> RESPONSE OVERDUE</> : <><Clock3 size={14} /> RESPONSE NEEDED</>}
                </div>
                <div>{formatAge(selected.age_hours)} open · SLA {selected.sla_hours}h · {selected.category}</div>
              </section>

              <div className="lifecycle">
                <span className="active">RECEIVED</span><span>ACKNOWLEDGED</span><span>ANSWERED</span><span>CLOSED</span>
              </div>

              <div className="card">
                <div className="muted">Message preview</div>
                <p>{selected.preview}</p>
              </div>

              <div className="card">
                <div className="muted">Recommended action</div>
                <strong>{selected.status === "overdue" ? "Respond now and record the next step" : "Review and respond within the SLA"}</strong>
                <button className="primary" onClick={() => selected.web_link && window.open(selected.web_link, "_blank")}>Open message in Outlook</button>
              </div>

              <div className="stats"><div><b>88</b><small>Response score</small></div><div><b>{summary?.overdue ?? 0}</b><small>Overdue</small></div><div><b>92%</b><small>Within 24h</small></div></div>

              <button className="link" onClick={() => window.open(`${SPIKEOS_URL}/#/communication`, "_blank")}>View full record in SpikeOS →</button>
            </>
          )}
        </main>
      )}

      <footer>AI-assisted findings are informational and require human review before negative performance use.</footer>
    </div>
  );
}

function Metric({ value, label, tone = "" }: { value: number; label: string; tone?: string }) {
  return <div className={`metric ${tone}`}><b>{value}</b><span>{label}</span></div>;
}

createRoot(document.getElementById("root")!).render(<App />);
