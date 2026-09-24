import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useSession } from "../../lib/SessionContext";

export function ToastContainer() {
  const { toasts } = useSession();
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-sm shadow-lg animate-[fadein_0.15s_ease-out]"
        >
          {t.tone === "success" && <CheckCircle2 size={16} className="text-[var(--color-green-600)]" />}
          {t.tone === "error" && <AlertCircle size={16} className="text-[var(--color-red-600)]" />}
          {t.tone === "default" && <Info size={16} className="text-[var(--color-blue-600)]" />}
          <span className="text-[var(--color-ink-900)]">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
