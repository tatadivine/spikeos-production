import { useEffect, useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastContainer } from "../ui/Toast";
import { ProductTour } from "./ProductTour";

export function AppShell({
  pageTitle,
  children,
}: {
  pageTitle: string;
  children: ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMobileNavOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-surface)]">
      <Header
        pageTitle={pageTitle}
        onMenuClick={() => setMobileNavOpen((open) => !open)}
      />

      <div className="flex min-h-0 flex-1">
        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <Sidebar
          mobileOpen={mobileNavOpen}
          onNavigate={() => setMobileNavOpen(false)}
        />

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
          {children}
        </main>
      </div>

      <ToastContainer />

      <ProductTour />
    </div>
  );
}