import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { buildSite } from "@/lib/templates";
import { enhanceBio } from "@/lib/aiBio";
import { screenshotUrl, pushPortfolioJson, extractUsername } from "@/lib/github";
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
  { id: "aurora", name: "Aurora", tagline: "Dark gradient · glassmorphism" },
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
        {/* Header */}
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
        {/* Shortcut list */}
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
        {/* Footer */}
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

function Editor() {
  const navigate = useNavigate();
  const { data, template, savedAt, patch, setTemplate, clearDraft } = useStore();
  const [tab, setTab] = useState<"design" | "content" | "projects">("design");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeTheme, setIframeTheme] = useState<"dark" | "light">("dark");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const appTheme = useAppTheme();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Section reorder state
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);

  // Auto-save status (visual only — actual persist is done by zustand/persist)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Draft-restored toast
  const [showDraftToast, setShowDraftToast] = useState(false);
  const restoredRef = useRef(false);

  // Show toast once if we landed on /edit with a persisted draft (no in-session navigation)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (data && savedAt) {
      const fromCreate = sessionStorage.getItem("foliocv_from_create");
      if (!fromCreate) {
        setShowDraftToast(true);
      }
      sessionStorage.removeItem("foliocv_from_create");
    }
  }, []);

  useEffect(() => {
    if (!data) navigate({ to: "/create" });
  }, [data, navigate]);

  // Visual save-status debounce
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

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === "1") setTab("design");
      else if (e.key === "2") setTab("content");
      else if (e.key === "3") setTab("projects");
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
      {/* Keyboard shortcuts modal */}
      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {/* Draft restored toast */}
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

          {/* Keyboard shortcuts button */}
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

          {/* App-level dark/light toggle */}
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
            {(["design", "content", "projects"] as const).map((t) => (
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

                {/* Section reordering */}
                <div className="pt-4">
                  <div className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Section Order
                  </div>
                  <p className="mb-3 text-[10px] text-muted-foreground">
                    Drag to reorder sections in your 