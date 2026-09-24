import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastContainer } from "../ui/Toast";
import { ProductTour } from "./ProductTour";

export function AppShell({ pageTitle, children }: { pageTitle: string; children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-surface)]">
      <Header pageTitle={pageTitle} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
      <ToastContainer />
      <ProductTour />
    </div>
  );
}
