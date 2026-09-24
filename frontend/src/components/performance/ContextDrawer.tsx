import { useState } from "react";
import { Drawer } from "../ui/Modal";
import { useSession } from "../../lib/SessionContext";

const CATEGORIES = ["PTO", "Delegation", "System issue", "Customer delay", "Wrong classification", "Workload", "Other"];

export function ContextDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pushToast } = useSession();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    setSubmitted(true);
    pushToast("Context submitted for review.", "success");
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setSubmitted(false);
      setDescription("");
    }, 200);
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Provide Context"
      subtitle="Something about this finding may not reflect the full context?"
    >
      {submitted ? (
        <div className="rounded-lg border border-[var(--color-green-100)] bg-[var(--color-green-100)]/50 p-4 text-sm text-[var(--color-green-600)]">
          Context submitted for review. Your manager will see this alongside the AI finding.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-700)]">
              Context category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-700)]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Explain what happened..."
              className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--color-ink-700)]">
              Attachment / supporting evidence
            </label>
            <div className="rounded-md border border-dashed border-[var(--color-line)] px-3 py-4 text-center text-xs text-[var(--color-ink-400)]">
              Drop a file here or click to attach (demo placeholder)
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="rounded-md bg-[var(--color-blue-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-blue-500)]"
            >
              Submit context
            </button>
            <button onClick={handleClose} className="rounded-md px-3 py-2 text-sm text-[var(--color-ink-500)]">
              Cancel
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
