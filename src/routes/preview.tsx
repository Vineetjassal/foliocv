import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/Logo";
import { generatePortfolioHtml } from "@/lib/templates";

export const Route = createFileRoute("/preview")({
  component: PreviewPage,
});

export default function PreviewPage() {
  const navigate = useNavigate();
  const data = useStore((s) => s.data);
  const template = useStore((s) => s.template);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!data) {
      navigate({ to: "/create" });
      return;
    }
    const generated = generatePortfolioHtml(data, template);
    setHtml(generated);
  }, [data, template, navigate]);

  function handleDownload() {
    if (!html || !data) return;
    setDownloading(true);
    try {
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(data.name || "portfolio").toLowerCase().replace(/\s+/g, "-")}-portfolio.html`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  if (!data) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm sm:px-10">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-serif text-lg">FolioCV</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: "/edit" })}
            className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            ← Back to editor
          </button>
          <button
            onClick={handleDownload}
            disabled={!html || downloading}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-1.5 text-xs font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading ? "Preparing…" : "Download HTML"}
          </button>
        </div>
      </header>

      {/* Info bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-6 py-2 text-xs text-muted-foreground sm:px-10">
        <span>
          Previewing <strong className="text-foreground">{data.name || "Your Portfolio"}</strong>
          {" · "}
          <span className="capitalize">{template}</span> template
        </span>
        <span className="hidden sm:inline">This is a live preview — the downloaded file looks identical.</span>
      </div>

      {/* Preview iframe */}
      <div className="relative flex-1">
        {html ? (
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title="Portfolio preview"
            className="h-full w-full border-0"
            style={{ minHeight: "calc(100vh - 100px)" }}
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="flex h-full min-h-96 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Generating preview…
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="shrink-0 border-t border-border bg-background px-6 py-4 sm:px-10">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Your portfolio is a single self-contained HTML file. Host it anywhere — Netlify, GitHub Pages, or Vercel.
          </p>
          <button
            onClick={handleDownload}
            disabled={!html || downloading}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download my portfolio
          </button>
        </div>
      </div>
    </div>
  );
}
