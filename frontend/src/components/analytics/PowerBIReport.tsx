import { useEffect, useRef, useState } from "react";
import { factories, models, service, type Embed } from "powerbi-client";
import { api } from "../../lib/api";

interface PowerBIConfig {
  type: "report";
  reportId: string;
  embedUrl: string;
  embedToken: string;
  expiration?: string;
  role: string;
  rlsEnabled: boolean;
}

const powerbi = new service.Service(
  factories.hpmFactory,
  factories.wpmpFactory,
  factories.routerFactory,
);

export function PowerBIReport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const embedRef = useRef<Embed | null>(null);
  const [config, setConfig] = useState<PowerBIConfig | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const next = await api<PowerBIConfig>("/analytics/powerbi/embed");
        if (!cancelled) setConfig(next);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Power BI could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!config || !containerRef.current) return;

    const container = containerRef.current;
    powerbi.reset(container);

    const embedConfig: models.IReportEmbedConfiguration = {
      type: "report",
      id: config.reportId,
      embedUrl: config.embedUrl,
      accessToken: config.embedToken,
      tokenType: models.TokenType.Embed,
      settings: {
        panes: {
          filters: { visible: false, expanded: false },
          pageNavigation: { visible: true },
        },
        background: models.BackgroundType.Transparent,
      },
    };

    const embedded = powerbi.embed(container, embedConfig);
    embedRef.current = embedded;
    embedded.on("loaded", () => console.info("Power BI report loaded"));
    embedded.on("rendered", () => console.info("Power BI report rendered"));
    embedded.on("error", (event: any) => console.error("Power BI report error", event?.detail));

    return () => {
      embedded.off("loaded");
      embedded.off("rendered");
      embedded.off("error");
      powerbi.reset(container);
      embedRef.current = null;
    };
  }, [config]);

  if (loading) {
    return <div className="flex min-h-[680px] items-center justify-center rounded-lg border border-[var(--color-line)] bg-white text-sm text-[var(--color-ink-500)]">Loading Power BI report…</div>;
  }

  if (error || !config) {
    return <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-[var(--color-line)] bg-white p-6 text-center"><div><p className="text-sm font-medium text-[var(--color-ink-900)]">Power BI is not available</p><p className="mt-2 max-w-xl text-xs text-[var(--color-ink-500)]">{error || "The backend did not return an embed configuration."}</p></div></div>;
  }

  return <div ref={containerRef} className="h-[680px] w-full overflow-hidden rounded-lg border border-[var(--color-line)] bg-white" />;
}
