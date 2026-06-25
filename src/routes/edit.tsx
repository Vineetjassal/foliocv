import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { buildSite } from "@/lib/templates";
import { enhanceBio } from "@/lib/aiBio";
import { screenshotUrl, pushPortfolioJson, extractUsername, deployToGitHubPages, deployToVercel } from "@/lib/github";
import type { PortfolioData, Project, TemplateId } from "@/lib/types";
import { toggleAppTheme, useAppTheme } from "./__root";
import { SortableSectionList, type Section } from "@/components/SortableSectionList";

export const Route = createFileRoute("/edit")({
  head: () => ({ meta: [{ title: "Editor — FolioCV" }] }),
  component: Editor,
});

const TEMPLATES: { id: TemplateId; name: string; tagline: string }[] = [
  { id: "centered", name: "Quiet", tagline: "Centered & minimal · read.cv inspired" },
  { id: "split", name: "Studio", tagline: "Sidebar + content · structured" },
  { id: "editorial", name: "Editorial", tagline: "Bold serif · magazine layout" },
  { id: "minimal", name: "Minimal", tagline: "Clean light · typographic" },
];

const DEFAULT_SECTIONS: Section[] = [
  { id: "hero", label: "Hero / Intro" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "links", label: "Links" },
];

const MAX_GALLERY_IMAGES = 15;

const BONDR_FEATURES = [
  { icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", label: "Swipe-to-match" },
  { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", label: "Bento profiles" },
  { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", label: "Verified badges" },
  { icon: "M15 10l4.553-2.069A1 1 0 0121 8.868V15.13a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z", label: "Video intros" },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Keyboard Shortcuts Modal ──────────────────────────────────────────────────
const SHORTCUTS = [
  { key: "1", desc: "Design tab" },
  { key: "2", desc: "Content tab" },
  { key: "3", desc: "Projects tab" },
  { key: "T", desc: "Toggle preview theme" },
  { key: "↑↓", desc: "Change template (in Design tab)" },
  { key: "Ctrl+D", desc: "Download portfolio" },
  { key: "?", desc: "Show this help" },
];

function KeyboardShortcutsModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl mx-4">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h4" />
            </svg>
            <span className="text-sm font-medium">Keyboard shortcuts</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="divide-y divide-border">
          {SHORTCUTS.map(({ key, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-2.5">
              <span className="text-xs text-muted-foreground">{desc}</span>
              <kbd className="rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-foreground shadow-sm">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">Press <kbd className="rounded border border-border bg-muted px-1 font-mono text-[9px]">Esc</kbd> or click outside to close</p>
        </div>
      </div>
    </div>
  );
}

// ── Bondr ad (sidebar) ────────────────────────────────────────────────────────
function BondrAd() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-4 mx-5 mb-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full"
        style={{ background: "radial-gradient(circle, oklch(0.65 0.2 340 / 0.14), transparent 70%)" }}
      />
      <div className="relative">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
          Also by Vineet
        </div>
        <div className="flex items-center gap-2 mb-2">
          <svg width="24" height="24" viewBox="0 0 36 36" fill="none" aria-label="Bondr logo">
            <rect width="36" height="36" rx="10" fill="oklch(0.55 0.22 340)" />
            <path d="M18 27s-9-5.5-9-12a5 5 0 0110 0 5 5 0 0110 0c0 6.5-11 12-11 12z" fill="white" opacity="0.9" />
          </svg>
          <span className="font-serif text-base tracking-tight">Bondr</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
          <span className="text-foreground font-medium">Hinge, but for builders.</span>{" "}
          Find co-founders by swiping on dev profiles.
        </p>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {BONDR_FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-1.5 rounded-lg border border-border bg-background/60 px-2 py-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
                <path d={f.icon} />
              </svg>
              <span className="text-[10px] font-medium">{f.label}</span>
            </div>
          ))}
        </div>
        <a
          href="https://trybondr.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-[10px] font-medium text-background transition hover:opacity-90"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          trybondr.app
        </a>
      </div>
    </div>
  );
}

// ── Auto-save indicator badge ────────────────────────────────────────────────
type SaveStatus = "saved" | "unsaved" | "saving";

function SaveBadge({ status, savedAt }: { status: SaveStatus; savedAt: string | null }) {
  const timeLabel = useMemo(() => {
    if (!savedAt) return null;
    const d = new Date(savedAt);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, [savedAt]);

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span
        title={savedAt ? `Last saved at ${timeLabel}` : undefined}
        className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-green-600 dark:text-green-400 cursor-default"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Saved{timeLabel ? ` · ${timeLabel}` : ""}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-orange-500">
      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
      Unsaved
    </span>
  );
}

// ── Draft-restored toast ─────────────────────────────────────────────────────
function DraftRestoredToast({ savedAt, onDismiss, onDiscard }: { savedAt: string; onDismiss: () => void; onDiscard: () => void }) {
  const label = useMemo(() => {
    const d = new Date(savedAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString();
  }, [savedAt]);

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-xl backdrop-blur-sm">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-green-500">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
      <span className="text-xs">
        <span className="font-medium">Draft restored</span>
        <span className="ml-1 text-muted-foreground">· saved {label}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onDiscard}
          className="rounded-full border border-border px-3 py-1 text-[10px] text-muted-foreground hover:text-destructive hover:border-destructive transition"
        >
          Discard
        </button>
        <button
          onClick={onDismiss}
          className="rounded-full bg-foreground px-3 py-1 text-[10px] font-medium text-background hover:opacity-90 transition"
        >
          Keep
        </button>
      </div>
    </div>
  );
}

// ── Device toggle types ───────────────────────────────────────────────────────
type DeviceMode = "desktop" | "tablet" | "mobile";

const DEVICE_CONFIG: Record<DeviceMode, { label: string; width: string; maxW: string; icon: React.ReactNode }> = {
  desktop: {
    label: "Desktop",
    width: "100%",
    maxW: "100%",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  tablet: {
    label: "Tablet",
    width: "768px",
    maxW: "768px",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" strokeWidth="2.5" />
      </svg>
    ),
  },
  mobile: {
    label: "Mobile",
    width: "375px",
    maxW: "375px",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" strokeWidth="2.5" />
      </svg>
    ),
  },
};

function DeviceToggle({ mode, onChange }: { mode: DeviceMode; onChange: (m: DeviceMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-muted p-0.5">
      {(Object.keys(DEVICE_CONFIG) as DeviceMode[]).map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          title={DEVICE_CONFIG[d].label}
          aria-label={`Preview as ${DEVICE_CONFIG[d].label}`}
          className={`flex items-center justify-center rounded-full p-1.5 transition ${
            mode === d
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {DEVICE_CONFIG[d].icon}
        </button>
      ))}
    </div>
  );
}

// ── Skills field ─────────────────────────────────────────────────────────────
function SkillsField({
  initialSkills,
  onCommit,
}: {
  initialSkills: string[];
  onCommit: (skills: string[]) => void;
}) {
  const [raw, setRaw] = useState(() => {
    if (Array.isArray(initialSkills)) return initialSkills.join(", ");
    if (typeof initialSkills === "string") return initialSkills;
    return "";
  });

  function handleChange(v: string) {
    setRaw(v);
    const arr = v.split(",").map((s) => s.trim()).filter(Boolean);
    onCommit(arr);
  }

  const parsed = raw.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div>
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Skills (comma separated)
      </span>
      <textarea
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        rows={3}
        placeholder="React, TypeScript, Node.js, Figma"
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
      />
      <div className="mt-1 text-[10px] text-muted-foreground">
        {parsed.length > 0
          ? parsed.map((s, i) => (
              <span key={i} className="mr-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[9px]">{s}</span>
            ))
          : "Type skills separated by commas"}
      </div>
    </div>
  );
}

// ── Deploy Panel ──────────────────────────────────────────────────────────────
function DeployPanel({ data, built }: { data: PortfolioData; built: { html: string; css: string } | null }) {
  const [token, setToken] = useState("");
  const [vercelToken, setVercelToken] = useState("");
  const [ghDeploying, setGhDeploying] = useState(false);
  const [vercelDeploying, setVercelDeploying] = useState(false);
  const [ghResult, setGhResult] = useState<{ ok: boolean; siteUrl?: string; repoUrl?: string; error?: string } | null>(null);
  const [vercelResult, setVercelResult] = useState<{ ok: boolean; url?: string; error?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"github" | "vercel">("github");

  const username = data.github ? extractUsername(data.github) : "";

  async function handleGhDeploy() {
    if (!built) return;
    if (!username) { setGhResult({ ok: false, error: "Add your GitHub handle in the Content tab first." }); return; }
    if (!token.trim()) { setGhResult({ ok: false, error: "Paste your GitHub Personal Access Token above." }); return; }
    setGhDeploying(true); setGhResult(null);
    const result = await deployToGitHubPages(username, token.trim(), built.html, built.css);
    setGhDeploying(false);
    setGhResult(result);
  }

  async function handleVercelDeploy() {
    if (!built) return;
    if (!vercelToken.trim()) { setVercelResult({ ok: false, error: "Paste your Vercel Token above." }); return; }
    setVercelDeploying(true); setVercelResult(null);
    const result = await deployToVercel(vercelToken.trim(), built.html, built.css);
    setVercelDeploying(false);
    setVercelResult(result);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Deploy Portfolio</div>
        <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
          Publish your portfolio live — no manual ZIP upload required.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-lg border border-border overflow-hidden text-[10px]">
        <button
          onClick={() => setActiveTab("github")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition ${activeTab === "github" ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.57v-2c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.82.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub Pages
        </button>
        <button
          onClick={() => setActiveTab("vercel")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 transition ${activeTab === "vercel" ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 19.5h20L12 2z" />
          </svg>
          Vercel
        </button>
      </div>

      {/* GitHub Pages tab */}
      {activeTab === "github" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background/60 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
              Free · Custom domain supported · Auto-updates on redeploy
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Creates a public repo <code className="rounded bg-muted px-1">foliocv-portfolio</code> and enables GitHub Pages.
              Your site will be live at{" "}
              <span className="font-mono text-foreground">
                {username ? `${username}.github.io/foliocv-portfolio` : "username.github.io/foliocv-portfolio"}
              </span>
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Personal Access Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-xs outline-none focus:border-foreground font-mono"
              autoComplete="off"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Needs <code className="rounded bg-muted px-1">repo</code> scope.{" "}
              <a href="https://github.com/settings/tokens/new?scopes=repo&description=FolioCV+Deploy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                Generate one →
              </a>
            </p>
          </div>

          <button
            onClick={handleGhDeploy}
            disabled={ghDeploying || !built}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground py-2.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50 transition"
          >
            {ghDeploying ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Deploying…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Deploy to GitHub Pages
              </>
            )}
          </button>

          {ghResult && (
            <div className={`rounded-lg border p-3 space-y-2 ${ghResult.ok ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
              {ghResult.ok ? (
                <>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    Deployed successfully!
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    It may take 1–2 minutes for GitHub Pages to go live.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <a href={ghResult.siteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md border border-green-500/40 bg-green-500/10 px-3 py-1.5 text-[10px] font-medium text-green-700 dark:text-green-300 hover:bg-green-500/20 transition"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>
                      {ghResult.siteUrl}
                    </a>
                    <a href={ghResult.repoUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[10px] text-muted-foreground hover:bg-accent transition"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39.6.11.82-.26.82-.57v-2c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.82.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" /></svg>
                      View repo on GitHub
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-1.5 text-[10px] text-destructive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {ghResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Vercel tab */}
      {activeTab === "vercel" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background/60 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              Free · Global CDN · Instant HTTPS
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Deploys your portfolio as a single-file site to Vercel's global edge network. Get a live <code className="rounded bg-muted px-1">*.vercel.app</code> URL instantly.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Vercel Token
            </label>
            <input
              type="password"
              value={vercelToken}
              onChange={(e) => setVercelToken(e.target.value)}
              placeholder="Vercel personal access token"
              className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-xs outline-none focus:border-foreground font-mono"
              autoComplete="off"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                Get token from Vercel dashboard →
              </a>
            </p>
          </div>

          <button
            onClick={handleVercelDeploy}
            disabled={vercelDeploying || !built}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground py-2.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50 transition"
          >
            {vercelDeploying ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Deploying…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 19.5h20L12 2z" /></svg>
                ▲ Deploy to Vercel
              </>
            )}
          </button>

          {vercelResult && (
            <div className={`rounded-lg border p-3 space-y-2 ${vercelResult.ok ? "border-blue-500/30 bg-blue-500/5" : "border-destructive/30 bg-destructive/5"}`}>
              {vercelResult.ok ? (
                <>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    Deployed to Vercel!
                  </div>
                  <a href={vercelResult.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-[10px] font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 transition"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>
                    {vercelResult.url}
                  </a>
                </>
              ) : (
                <div className="flex items-start gap-1.5 text-[10px] text-destructive">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {vercelResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Editor() {
  const navigate = useNavigate();
  const { data, template, savedAt, patch, setTemplate, clearDraft } = useStore();
  const [tab, setTab] = useState<"design" | "content" | "projects" | "deploy">("design");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeTheme, setIframeTheme] = useState<"dark" | "light">("dark");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const appTheme = useAppTheme();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showDraftToast, setShowDraftToast] = useState(false);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (data && savedAt) {
      const fromCreate = sessionStorage.getItem("foliocv_from_create");
      if (!fromCreate) setShowDraftToast(true);
      sessionStorage.removeItem("foliocv_from_create");
    }
  }, []);

  useEffect(() => {
    if (!data) navigate({ to: "/create" });
  }, [data, navigate]);

  useEffect(() => {
    if (!data) return;
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      setTimeout(() => setSaveStatus("saved"), 400);
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [data, template]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === "1") setTab("design");
      else if (e.key === "2") setTab("content");
      else if (e.key === "3") setTab("projects");
      else if (e.key === "4") setTab("deploy");
      else if (e.key === "t" || e.key === "T") setIframeTheme((t) => (t === "dark" ? "light" : "dark"));
      else if (e.key === "?") setShowShortcuts((v) => !v);
      else if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); handleDownload(); }
      else if (e.key === "ArrowUp" && tab === "design") {
        setTemplate(TEMPLATES[(Math.max(0, TEMPLATES.findIndex((t) => t.id === template) - 1))].id);
      } else if (e.key === "ArrowDown" && tab === "design") {
        setTemplate(TEMPLATES[(Math.min(TEMPLATES.length - 1, TEMPLATES.findIndex((t) => t.id === template) + 1))].id);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [tab, template]);

  const built = useMemo(() => (data ? buildSite(data, template) : null), [data, template]);

  useEffect(() => {
    if (!iframeRef.current || !built) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const html = built.html.replace("</head>", `<style>${built.css}</style></head>`);
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      const root = doc.documentElement;
      if (iframeTheme === "light") root.classList.add("light");
      else root.classList.remove("light");
    }, 50);
  }, [built, iframeTheme]);

  async function handleDownload() {
    if (!data || !built) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    zip.file("index.html", built.html);
    zip.file("styles.css", built.css);
    zip.file("README.md", `# ${data.name} — Portfolio\n\nGenerated with FolioCV.\n`);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.name || "portfolio").toLowerCase().replace(/\s+/g, "-")}-foliocv.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!data) return null;

  const device = DEVICE_CONFIG[deviceMode];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {showDraftToast && savedAt && (
        <DraftRestoredToast
          savedAt={savedAt}
          onDismiss={() => setShowDraftToast(false)}
          onDiscard={() => {
            clearDraft();
            setShowDraftToast(false);
            navigate({ to: "/create" });
          }}
        />
      )}

      {/* ── Header ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={22} />
            <span className="font-serif text-lg">FolioCV</span>
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            / Editing {data.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SaveBadge status={saveStatus} savedAt={savedAt} />
          <button
            onClick={() => setShowShortcuts(true)}
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            className="hidden rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent sm:inline-flex items-center gap-1.5 text-muted-foreground"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h4" />
            </svg>
            Shortcuts
          </button>
          <button
            onClick={toggleAppTheme}
            aria-label="Toggle dark/light mode"
            className="hidden rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent sm:inline-flex items-center gap-1.5"
          >
            {appTheme === "dark" ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
            {appTheme === "dark" ? "Dark" : "Light"}
          </button>
          <button
            onClick={() => setTab("deploy")}
            className="rounded-full border border-border bg-gradient-to-r from-violet-500/10 to-blue-500/10 px-4 py-1.5 text-xs font-medium text-foreground hover:from-violet-500/20 hover:to-blue-500/20 transition"
          >
            Deploy
          </button>
          <button
            onClick={handleDownload}
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            ↓ Download code
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside className="flex w-[380px] shrink-0 flex-col border-r border-border bg-card">
          <div className="flex border-b border-border text-xs">
            {(["design", "content", "projects", "deploy"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 capitalize transition ${
                  tab === t ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {tab === "design" && (
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Template</div>
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      template === t.id
                        ? "border-foreground bg-accent"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-serif text-lg">{t.name}</div>
                      <span className="mono text-[10px] text-muted-foreground">
                        0{TEMPLATES.indexOf(t) + 1}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{t.tagline}</div>
                    <TemplatePreview id={t.id} />
                  </button>
                ))}

                <div className="pt-4">
                  <div className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Section Order
                  </div>
                  <p className="mb-3 text-[10px] text-muted-foreground">
                    Drag to reorder sections in your portfolio.
                  </p>
                  <SortableSectionList
                    sections={sections}
                    onReorder={setSections}
                  />
                </div>
              </div>
            )}
            {tab === "content" && <ContentPanel data={data} patch={patch} />}
            {tab === "projects" && <ProjectsPanel data={data} patch={patch} />}
            {tab === "deploy" && <DeployPanel data={data} built={built} />}
          </div>
          <BondrAd />
        </aside>

        {/* ── Preview area ── */}
        <main className="flex flex-1 flex-col overflow-hidden bg-muted/30">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/60 px-4 py-2">
            <div className="flex items-center gap-2">
              <DeviceToggle mode={deviceMode} onChange={setDeviceMode} />
              <span className="text-[10px] text-muted-foreground">
                {deviceMode === "desktop" ? "Full width" : device.width}
              </span>
            </div>
            <button
              onClick={() => setIframeTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-accent sm:hidden"
            >
              {iframeTheme === "dark" ? "Dark" : "Light"}
            </button>
          </div>

          <div className="flex flex-1 items-start justify-center overflow-auto p-4">
            <div
              className="relative transition-all duration-300"
              style={{
                width: device.width,
                maxWidth: device.maxW,
                minWidth: deviceMode === "desktop" ? "100%" : undefined,
                height: "calc(100vh - 11rem)",
              }}
            >
              {deviceMode !== "desktop" && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-[2rem] border-[8px] border-foreground/20 shadow-2xl z-10"
                  aria-hidden="true"
                >
                  <div className="absolute left-1/2 top-0 -translate-x-1/2">
                    {deviceMode === "mobile"
                      ? <div className="mt-1 h-1 w-16 rounded-full bg-foreground/30" />
                      : <div className="mt-1 h-1 w-8 rounded-full bg-foreground/30" />}
                  </div>
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2">
                    <div className="h-1 w-10 rounded-full bg-foreground/30" />
                  </div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                title="Preview"
                className={`h-full w-full border-0 bg-background transition-all duration-300 ${
                  deviceMode !== "desktop" ? "rounded-[1.5rem] overflow-hidden" : "rounded-2xl border border-border shadow-2xl"
                }`}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function TemplatePreview({ id }: { id: TemplateId }) {
  return (
    <div className="mt-3 h-16 w-full overflow-hidden rounded-md border border-border bg-background">
      <svg viewBox="0 0 200 60" className="h-full w-full">
        {id === "centered" && (
          <>
            <circle cx="100" cy="14" r="5" fill="currentColor" opacity="0.8" />
            <rect x="80" y="24" width="40" height="3" fill="currentColor" opacity="0.7" />
            <rect x="60" y="32" width="80" height="2" fill="currentColor" opacity="0.3" />
            <rect x="60" y="40" width="80" height="2" fill="currentColor" opacity="0.3" />
          </>
        )}
        {id === "split" && (
          <>
            <rect x="0" y="0" width="60" height="60" fill="currentColor" opacity="0.15" />
            <circle cx="14" cy="14" r="5" fill="currentColor" opacity="0.6" />
            <rect x="8" y="24" width="40" height="2" fill="currentColor" opacity="0.5" />
            <rect x="72" y="10" width="120" height="3" fill="currentColor" opacity="0.6" />
            <rect x="72" y="22" width="100" height="2" fill="currentColor" opacity="0.3" />
          </>
        )}
        {id === "editorial" && (
          <>
            <rect x="10" y="8" width="180" height="14" fill="currentColor" opacity="0.7" />
            <rect x="10" y="26" width="80" height="3" fill="currentColor" opacity="0.4" />
            <rect x="10" y="40" width="50" height="14" fill="currentColor" opacity="0.2" />
            <rect x="68" y="40" width="50" height="14" fill="currentColor" opacity="0.2" />
            <rect x="126" y="40" width="50" height="14" fill="currentColor" opacity="0.2" />
          </>
        )}
        {id === "minimal" && (
          <>
            <rect x="0" y="0" width="200" height="60" fill="white" />
            <rect x="10" y="8" width="100" height="6" rx="1" fill="#111" opacity="0.8" />
            <rect x="10" y="18" width="60" height="2" rx="1" fill="#888" opacity="0.6" />
            <rect x="10" y="24" width="180" height="1" fill="#111" opacity="0.9" />
            <rect x="10" y="32" width="110" height="2" rx="1" fill="#333" opacity="0.3" />
            <rect x="10" y="38" width="110" height="2" rx="1" fill="#333" opacity="0.3" />
            <rect x="10" y="44" width="80" height="2" rx="1" fill="#333" opacity="0.3" />
            <rect x="140" y="32" width="50" height="2" rx="1" fill="#ccc" opacity="0.6" />
            <rect x="140" y="38" width="40" height="2" rx="1" fill="#ccc" opacity="0.6" />
          </>
        )}
      </svg>
    </div>
  );
}

function AiBioButton({ value, name, title, onResult }: { value: string; name: string; title: string; onResult: (v: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  async function run() {
    if (!value?.trim()) { setStatus("Write a few words first"); return; }
    setLoading(true); setStatus("Thinking…");
    try { const result = await enhanceBio(value, name, title); onResult(result); setStatus("✓ Done"); }
    catch { setStatus("Try again"); }
    finally { setLoading(false); setTimeout(() => setStatus(""), 3000); }
  }
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <button type="button" onClick={run} disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-50"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        {loading ? "Enhancing…" : "Enhance with AI"}
      </button>
      {status && <span className="text-[10px] text-muted-foreground">{status}</span>}
    </div>
  );
}

function AvatarField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(await fileToDataUrl(file));
    e.target.value = "";
  }
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Your Photo</span>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="avatar" className="h-16 w-16 shrink-0 rounded-full border border-border object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <button type="button" onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium hover:bg-accent hover:border-foreground transition"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload photo from computer
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <input
            value={value?.startsWith("data:") ? "" : (value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder="or paste image URL"
            className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-xs outline-none focus:border-foreground placeholder:text-muted-foreground"
          />
          {value && (
            <button type="button" onClick={() => onChange("")}
              className="text-left text-[10px] text-destructive hover:underline"
            >Remove photo</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileGalleryField({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const [idx, setIdx] = useState(0);
  const [addingUrl, setAddingUrl] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const all = images ?? [];
  const current = all[Math.min(idx, Math.max(0, all.length - 1))];
  const canAdd = all.length < MAX_GALLERY_IMAGES;
  function prev() { setIdx((i) => (i - 1 + all.length) % all.length); }
  function next() { setIdx((i) => (i + 1) % all.length); }
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !canAdd) return;
    const dataUrl = await fileToDataUrl(file);
    const updated = [...all, dataUrl];
    onChange(updated); setIdx(updated.length - 1); e.target.value = "";
  }
  function addUrl() {
    if (!newUrl.trim() || !canAdd) return;
    const updated = [...all, newUrl.trim()];
    onChange(updated); setIdx(updated.length - 1); setNewUrl(""); setAddingUrl(false);
  }
  function removeCurrent() {
    onChange(all.filter((_, i) => i !== idx)); setIdx(Math.max(0, idx - 1));
  }
  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Profile Gallery</span>
        <span className={`text-[10px] font-medium ${all.length >= MAX_GALLERY_IMAGES ? "text-destructive" : "text-muted-foreground"}`}>
          {all.length} / {MAX_GALLERY_IMAGES}
        </span>
      </div>
      {all.length > 0 ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
          <img src={current} alt={`Gallery image ${idx + 1}`} className="h-44 w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; }} />
          {all.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white hover:bg-black/80 transition">‹</button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white hover:bg-black/80 transition">›</button>
            </>
          )}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {all.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
          <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">{idx + 1} / {all.length}</div>
          <button onClick={removeCurrent} className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-black/80 transition">✕ Remove</button>
        </div>
      ) : (
        <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 gap-1.5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-[10px] text-muted-foreground">No gallery images yet</span>
        </div>
      )}
      {all.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {all.map((src, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition ${i === idx ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => canAdd && uploadRef.current?.click()} disabled={!canAdd}
          className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] font-medium hover:bg-accent hover:border-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload image
        </button>
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <button onClick={() => setAddingUrl((a) => !a)} disabled={!canAdd}
          className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
        >+ Paste URL</button>
      </div>
      {addingUrl && (
        <div className="flex gap-1">
          <input autoFocus value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUrl()}
            placeholder="https://i.imgur.com/..."
            className="flex-1 rounded border border-border bg-muted px-2 py-1 text-[10px] outline-none focus:border-foreground"
          />
          <button onClick={addUrl} className="rounded border border-border px-2.5 py-1 text-[10px] hover:bg-accent">Add</button>
        </div>
      )}
      {!canAdd && <p className="text-[10px] text-destructive">Maximum {MAX_GALLERY_IMAGES} images reached.</p>}
    </div>
  );
}

function GitHubSyncPanel({ data, patch }: { data: PortfolioData; patch: (p: Partial<PortfolioData>) => void }) {
  const [token, setToken] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const enabled = data.githubSync ?? false;
  async function handleSync() {
    const username = data.github ? extractUsername(data.github) : "";
    if (!username) { setStatus({ ok: false, msg: "Add your GitHub handle in the Content tab first." }); return; }
    if (!token.trim()) { setStatus({ ok: false, msg: "Paste your GitHub Personal Access Token above." }); return; }
    setSyncing(true); setStatus(null);
    const result = await pushPortfolioJson(username, token.trim(), data);
    setSyncing(false);
    if (result.ok) setStatus({ ok: true, msg: `✓ Synced! View at github.com/${username}/${username}/blob/main/portfolio.json` });
    else setStatus({ ok: false, msg: `✗ ${result.error}` });
  }
  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">GitHub README Sync</span>
          <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
            Auto-populate a <code className="rounded bg-muted px-1 py-0.5">portfolio.json</code> in your GitHub profile repo.
          </p>
        </div>
        <button onClick={() => patch({ githubSync: !enabled })}
          aria-label={enabled ? "Disable" : "Enable"}
          className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${enabled ? "bg-foreground" : "bg-muted-foreground/30"}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${enabled ? "left-4" : "left-0.5"}`} />
        </button>
      </div>
      {enabled && (
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Personal Access Token</label>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-xs outline-none focus:border-foreground font-mono" autoComplete="off"
            />
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="w-full rounded-md bg-foreground py-2 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50 transition"
          >{syncing ? "Syncing…" : "↑ Push portfolio.json to GitHub"}</button>
          {status && (
            <p className={`text-[10px] leading-relaxed ${status.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>{status.msg}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ContentPanel({ data, patch }: { data: PortfolioData; patch: (p: Partial<PortfolioData>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Name" value={data.name} onChange={(v) => patch({ name: v })} />
      <Field label="Title / Role" value={data.title} onChange={(v) => patch({ title: v })} />
      <Field label="Location" value={data.location} onChange={(v) => patch({ location: v })} />
      <div>
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Bio (one-liner)</span>
          <textarea value={data.bio ?? ""} onChange={(e) => patch({ bio: e.target.value })} rows={2}
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
        </label>
        <AiBioButton value={data.bio} name={data.name} title={data.title} onResult={(v) => patch({ bio: v })} />
      </div>
      <div>
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">About (long form)</span>
          <textarea value={data.about ?? ""} onChange={(e) => patch({ about: e.target.value })} rows={5}
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
        </label>
        <AiBioButton value={data.about} name={data.name} title={data.title} onResult={(v) => patch({ about: v })} />
      </div>
      <AvatarField value={data.avatar ?? ""} onChange={(v) => patch({ avatar: v })} />
      <ProfileGalleryField images={data.galleryImages ?? []} onChange={(imgs) => patch({ galleryImages: imgs })} />
      <Field label="Email" value={data.email} onChange={(v) => patch({ email: v })} />
      <Field label="Website" value={data.website} onChange={(v) => patch({ website: v })} />
      <Field label="GitHub handle" value={data.github} onChange={(v) => patch({ github: v })} />
      <SkillsField initialSkills={Array.isArray(data.skills) ? data.skills : []} onCommit={(skills) => patch({ skills })} />
      <ListEditor label="Experience" items={data.experience} onChange={(items) => patch({ experience: items })}
        fields={["role", "company", "period", "description"]} blank={{ role: "", company: "", period: "", description: "" }} />
      <ListEditor label="Education" items={data.education} onChange={(items) => patch({ education: items })}
        fields={["degree", "school", "period"]} blank={{ degree: "", school: "", period: "" }} />
      <ListEditor label="Links" items={data.links} onChange={(items) => patch({ links: items })}
        fields={["label", "url"]} blank={{ label: "", url: "" }} />
      <GitHubSyncPanel data={data} patch={patch} />
    </div>
  );
}

function ImageCarousel({ images, liveUrl, ghUrl, onChange }: { images: string[]; liveUrl: string; ghUrl?: string; onChange: (imgs: string[]) => void }) {
  const [idx, setIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [capturing, setCapturing] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const all = images ?? [];
  const current = all[Math.min(idx, Math.max(0, all.length - 1))];
  function prev() { setIdx((i) => (i - 1 + all.length) % all.length); }
  function next() { setIdx((i) => (i + 1) % all.length); }
  function addUrl() {
    if (!newUrl.trim()) return;
    const updated = [...all, newUrl.trim()];
    onChange(updated); setIdx(updated.length - 1); setNewUrl(""); setAdding(false);
  }
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const updated = [...all, dataUrl]; onChange(updated); setIdx(updated.length - 1); e.target.value = "";
  }
  function removeCurrentImage() { onChange(all.filter((_, i) => i !== idx)); setIdx(Math.max(0, idx - 1)); }
  async function captureScreenshot() {
    const target = liveUrl?.startsWith("http") ? liveUrl : (ghUrl ?? "");
    if (!target) return;
    setCapturing(true);
    onChange([...all, screenshotUrl(target)]); setIdx(all.length); setCapturing(false);
  }
  return (
    <div className="space-y-2">
      {all.length > 0 ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
          <img src={current} alt="project screenshot" className="h-36 w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; }} />
          {all.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">‹</button>
              <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">›</button>
            </>
          )}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {all.map((_, i) => <span key={i} className={`inline-block h-1.5 w-1.5 rounded-full transition ${i === idx ? "bg-white" : "bg-white/40"}`} />)}
          </div>
          <button onClick={removeCurrentImage} className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-red-400 hover:text-red-300">✕</button>
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40">
          <span className="text-[10px] text-muted-foreground">No images yet</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => uploadRef.current?.click()}
          className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] font-medium hover:bg-accent hover:border-foreground transition"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload image
        </button>
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <button onClick={captureScreenshot}
          disabled={capturing || (!liveUrl?.startsWith("http") && !ghUrl?.startsWith("http"))}
          className="flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent disabled:opacity-40 transition"
        >📸 {capturing ? "Capturing…" : "Screenshot"}</button>
        <button onClick={() => setAdding((a) => !a)}
          className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition"
        >+ Paste URL</button>
        {liveUrl?.startsWith("http") && <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition">↗ Live</a>}
        {ghUrl?.startsWith("http") && <a href={ghUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition">⌥ GitHub</a>}
      </div>
      {adding && (
        <div className="flex gap-1">
          <input autoFocus value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUrl()}
            placeholder="https://i.imgur.com/..."
            className="flex-1 rounded border border-border bg-muted px-2 py-1 text-[10px] outline-none focus:border-foreground"
          />
          <button onClick={addUrl} className="rounded border border-border px-2.5 py-1 text-[10px] hover:bg-accent">Add</button>
        </div>
      )}
    </div>
  );
}

function ProjectsPanel({ data, patch }: { data: PortfolioData; patch: (p: Partial<PortfolioData>) => void }) {
  const projects = data.projects ?? [];
  function updateAt(i: number, p: Partial<Project>) { patch({ projects: projects.map((x, idx) => (idx === i ? { ...x, ...p } : x)) }); }
  function removeAt(i: number) { patch({ projects: projects.filter((_, idx) => idx !== i) }); }
  function add() { patch({ projects: [...projects, { name: "New project", description: "", url: "", githubUrl: "", language: "", image: "", images: [], include: true }] }); }
  function toggleAll(include: boolean) { patch({ projects: projects.map((p) => ({ ...p, include })) }); }
  const includedCount = projects.filter((p) => p.include !== false).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Projects</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{includedCount} of {projects.length} shown</div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => toggleAll(true)} className="rounded-full border border-border px-2 py-1 text-[10px] hover:bg-accent">All</button>
          <button onClick={() => toggleAll(false)} className="rounded-full border border-border px-2 py-1 text-[10px] hover:bg-accent">None</button>
          <button onClick={add} className="rounded-full bg-foreground px-2 py-1 text-[10px] text-background">+ Add</button>
        </div>
      </div>
      <div className="space-y-4">
        {projects.length === 0 && <div className="text-xs text-muted-foreground">No projects yet.</div>}
        {projects.map((p, i) => {
          const on = p.include !== false;
          const allImgs = p.images?.length ? p.images : p.image ? [p.image] : [];
          return (
            <div key={i} className={`rounded-xl border p-3 transition ${on ? "border-border bg-background" : "border-border bg-muted/40 opacity-60"}`}>
              <div className="mb-3 flex items-center gap-2">
                <button onClick={() => updateAt(i, { include: !on })}
                  className={`relative h-4 w-7 shrink-0 rounded-full transition ${on ? "bg-foreground" : "bg-muted-foreground/40"}`}
                  aria-label={on ? "Hide project" : "Show project"}
                >
                  <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-background transition-all ${on ? "left-3.5" : "left-0.5"}`} />
                </button>
                <span className="flex-1 truncate text-xs font-medium">{p.name || "Untitled"}</span>
                <button onClick={() => removeAt(i)} className="shrink-0 text-[10px] text-destructive hover:underline">Delete</button>
              </div>
              <ImageCarousel images={allImgs} liveUrl={p.url} ghUrl={p.githubUrl}
                onChange={(imgs) => updateAt(i, { images: imgs, image: imgs[0] ?? "" })} />
              <div className="mt-3 space-y-1.5">
                <input value={p.name ?? ""} placeholder="Project name" onChange={(e) => updateAt(i, { name: e.target.value })} className="w-full rounded-md border border-transparent bg-muted px-3 py-1.5 text-xs outline-none focus:border-border" />
                <input value={p.description ?? ""} placeholder="Short description" onChange={(e) => updateAt(i, { description: e.target.value })} className="w-full rounded-md border border-transparent bg-muted px-3 py-1.5 text-xs outline-none focus:border-border" />
                <input value={p.url ?? ""} placeholder="Live URL (https://...)" onChange={(e) => updateAt(i, { url: e.target.value })} className="w-full rounded-md border border-transparent bg-muted px-3 py-1.5 text-xs outline-none focus:border-border" />
                <input value={p.githubUrl ?? ""} placeholder="GitHub repo URL (optional)" onChange={(e) => updateAt(i, { githubUrl: e.target.value })} className="w-full rounded-md border border-transparent bg-muted px-3 py-1.5 text-xs outline-none focus:border-border" />
                <input value={p.language ?? ""} placeholder="Language / tech stack" onChange={(e) => updateAt(i, { language: e.target.value })} className="w-full rounded-md border border-transparent bg-muted px-3 py-1.5 text-xs outline-none focus:border-border" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
      ) : (
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
      )}
    </label>
  );
}

function ListEditor<T extends Record<string, any>>({ label, items, onChange, fields, blank }: { label: string; items: T[]; onChange: (items: T[]) => void; fields: (keyof T & string)[]; blank: T }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <button onClick={() => onChange([...items, { ...blank }])}
          className="rounded-full border border-border px-2 py-0.5 text-[10px] hover:bg-accent"
        >+ Add</button>
      </div>
      <div className="space-y-3">
        {(items ?? []).map((item, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-2">
            {fields.map((f) => (
              <input key={f} value={item[f] ?? ""} placeholder={f}
                onChange={(e) => { const next = [...items]; next[i] = { ...next[i], [f]: e.target.value }; onChange(next); }}
                className="mb-1 w-full rounded border border-transparent bg-muted px-2 py-1 text-xs outline-none focus:border-border"
              />
            ))}
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="mt-1 text-[10px] text-destructive hover:underline"
            >Remove</button>
          </div>
        ))}
        {(items ?? []).length === 0 && <div className="text-xs text-muted-foreground">Nothing yet.</div>}
      </div>
    </div>
  );
}
