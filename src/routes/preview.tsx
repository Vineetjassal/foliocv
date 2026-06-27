import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/Logo";
import { generatePortfolioHtml } from "@/lib/templates";
import { GitHubPagesDeployPanel } from "@/components/GitHubPagesDeployPanel";
import { VercelDeployPanel } from "@/components/VercelDeployPanel";

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
  const [deployTab, setDeployTab] = useState<"github" | "vercel">("github");
  const [deployOpen, setDeployOpen] = useState(false);

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

      {/* ── Footer: Download CTA + Deploy Section ── */}
      <div className="shrink-0 border-t border-border bg-background">

        {/* Primary CTA row */}
        <div className="flex flex-col items-center gap-3 px-6 py-4 sm:flex-row sm:justify-between sm:px-10">
          <p className="text-xs text-muted-foreground">
            Your portfolio is a single self-contained HTML file. Host it anywhere — Netlify, GitHub Pages, or Vercel.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              disabled={!html || downloading}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download my portfolio
            </button>
            <button
              onClick={() => setDeployOpen((o) => !o)}
              className={`inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-medium transition-all ${
                deployOpen
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-foreground hover:border-foreground"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              {deployOpen ? "Hide deploy" : "Deploy live"}
            </button>
          </div>
        </div>

        {/* Deploy panel — toggleable */}
        {deployOpen && (
          <div className="border-t border-border px-6 pb-8 pt-6 sm:px-10">
            <div className="mx-auto max-w-2xl">

              {/* Section heading */}
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/5 border border-border">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Deploy your portfolio</h2>
                  <p className="text-xs text-muted-foreground">Go live in minutes with GitHub Pages or Vercel</p>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="mb-5 flex rounded-xl border border-border bg-muted/30 p-1 w-fit">
                <button
                  onClick={() => setDeployTab("github")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                    deployTab === "github"
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub Pages
                </button>
                <button
                  onClick={() => setDeployTab("vercel")}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                    deployTab === "vercel"
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 22.525H0l12-21.05 12 21.05z"/>
                  </svg>
                  Vercel
                </button>
              </div>

              {/* Panel content */}
              <div className="transition-all">
                {deployTab === "github" ? (
                  <GitHubPagesDeployPanel />
                ) : (
                  <VercelDeployPanel />
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
