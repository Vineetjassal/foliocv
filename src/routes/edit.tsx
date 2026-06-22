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
const AUTOSAVE_KEY = "foliocv_autosave";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Auto-save indicator badge ────────────────────────────────────────────────
type SaveStatus = "saved" | "unsaved" | "saving";

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground" aria-live="polite" aria-label="Saving changes">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" aria-hidden="true" />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-green-600 dark:text-green-400" aria-live="polite" aria-label="All changes saved">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Saved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-orange-500" aria-live="polite" aria-label="Unsaved changes">
      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" aria-hidden="true" />
      Unsaved
    </span>
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" strokeWidth="2.5" />
      </svg>
    ),
  },
};

function DeviceToggle({ mode, onChange }: { mode: DeviceMode; onChange: (m: DeviceMode) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border bg-muted p-0.5" role="group" aria-label="Preview device size">
      {(Object.keys(DEVICE_CONFIG) as DeviceMode[]).map((d) => (
        <button
          key={d}
          onClick={() => onChange(d)}
          title={DEVICE_CONFIG[d].label}
          aria-label={`Preview as ${DEVICE_CONFIG[d].label}`}
          aria-pressed={mode === d}
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

// ── Lighthouse Score Badge ───────────────────────────────────────────────────
interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

/** Heuristic scorer — analyses the generated HTML/CSS without a real browser run */
function computeLighthouseScores(html: string, css: string): LighthouseScores {
  const fullDoc = html + css;

  // Performance heuristics
  let perf = 90;
  const base64Images = (fullDoc.match(/data:image\//g) || []).length;
  perf -= Math.min(base64Images * 4, 20); // penalise inline images
  const cssKb = new Blob([css]).size / 1024;
  if (cssKb > 50) perf -= 5;
  if (cssKb > 100) perf -= 5;
  const htmlKb = new Blob([html]).size / 1024;
  if (htmlKb > 200) perf -= 5;
  perf = Math.max(perf, 55);

  // Accessibility heuristics
  let a11y = 100;
  if (!html.includes('lang=')) a11y -= 10;          // missing lang attribute
  if (!html.includes('<title>') && !html.includes('<title')) a11y -= 8;
  if (!html.includes('alt=')) a11y -= 8;             // images without alt
  if (!html.includes('aria-label') && !html.includes('role=')) a11y -= 5;
  const hasColorContrast = css.includes('color:') && css.includes('background');
  if (!hasColorContrast) a11y -= 5;
  a11y = Math.max(a11y, 60);

  // Best practices heuristics
  let bp = 100;
  if (!html.includes('charset')) bp -= 5;
  if (!html.includes('viewport')) bp -= 5;
  if (html.includes('http://')) bp -= 10;            // mixed content
  bp = Math.max(bp, 65);

  // SEO heuristics
  let seo = 100;
  if (!html.includes('<meta name="description"') && !html.includes("<meta name='description'")) seo -= 15;
  if (!html.includes('<title>')) seo -= 10;
  if (!html.includes('<h1')) seo -= 10;
  if (!html.includes('viewport')) seo -= 5;
  seo = Math.max(seo, 55);

  return {
    performance: Math.round(perf),
    accessibility: Math.round(a11y),
    bestPractices: Math.round(bp),
    seo: Math.round(seo),
  };
}

function scoreColor(score: number): string {
  if (score >= 90) return "#0cce6b";
  if (score >= 50) return "#ffa400";
  return "#ff4e42";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Good";
  if (score >= 50) return "Needs improvement";
  return "Poor";
}

function ScoreRing({ score, label, size = 56 }: { score: number; label: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-1" aria-label={`${label}: ${score} out of 100 — ${scoreLabel(score)}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/40" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize={size < 50 ? "9" : "11"} fontWeight="700" fill={color}>
          {score}
        </text>
      </svg>
      <span className="text-center text-[9px] text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

function LighthouseBadge({ html, css }: { html: string; css: string }) {
  const [open, setOpen] = useState(false);
  const scores = useMemo(() => computeLighthouseScores(html, css), [html, css]);
  const avg = Math.round((scores.performance + scores.accessibility + scores.bestPractices + scores.seo) / 4);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    // Focus trap
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="View Lighthouse score preview"
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: scoreColor(avg) }} className="font-bold tabular-nums">{avg}</span>
        <span className="text-muted-foreground">Lighthouse</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lighthouse score preview"
          ref={dialogRef}
          tabIndex={-1}
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-card p-4 shadow-2xl outline-none"
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold">Lighthouse Preview</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
                Heuristic analysis of your generated HTML/CSS. Scores reflect best-practice coverage.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close Lighthouse panel"
              className="ml-2 shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-around gap-2">
            <ScoreRing score={scores.performance} label="Performance" />
            <ScoreRing score={scores.accessibility} label="Accessibility" />
            <ScoreRing score={scores.bestPractices} label="Best Practices" />
            <ScoreRing score={scores.seo} label="SEO" />
          </div>
          <div className="mt-3 space-y-1.5">
            {scores.accessibility < 90 && (
              <Tip color="orange" text="Add alt text to images and aria-labels to interactive elements." />
            )}
            {scores.seo < 90 && (
              <Tip color="orange" text="Add a <meta name='description'> tag for better SEO." />
            )}
            {scores.performance < 90 && (
              <Tip color="orange" text="Reduce base64 images — use URLs or external hosting instead." />
            )}
            {avg >= 90 && (
              <Tip color="green" text="Great scores! Your portfolio is production-ready." />
            )}
          </div>
          <p className="mt-3 text-[9px] text-muted-foreground">
            ⚡ These scores are estimates. Run{" "}
            <a href="https://pagespeed.web.dev/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              PageSpeed Insights
            </a>{" "}
            on the deployed URL for real Lighthouse scores.
          </p>
        </div>
      )}
      {/* Backdrop to close on outside click */}
      {open && <div className="fixed inset-0 z-40" aria-hidden="true" onClick={() => setOpen(false)} />}
    </div>
  );
}

function Tip({ color, text }: { color: "green" | "orange" | "red"; text: string }) {
  const colors = { green: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40", orange: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40", red: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40" };
  return (
    <p className={`rounded-lg px-2.5 py-1.5 text-[10px] leading-snug ${colors[color]}`} role="note">
      {text}
    </p>
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
  const skillsId = "skills-textarea";

  return (
    <div>
      <label htmlFor={skillsId} className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Skills (comma separated)
      </label>
      <textarea
        id={skillsId}
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        rows={3}
        placeholder="React, TypeScript, Node.js, Figma"
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        aria-describedby="skills-hint"
      />
      <div id="skills-hint" className="mt-1 text-[10px] text-muted-foreground">
        {parsed.length > 0
          ? parsed.map((s, i) => (
              <span key={i} className="mr-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[9px]" aria-hidden="true">{s}</span>
            ))
          : "Type skills separated by commas"}
      </div>
    </div>
  );
}

function Editor() {
  const navigate = useNavigate();
  const { data, template, patch, setTemplate } = useStore();
  const [tab, setTab] = useState<"design" | "content" | "projects">("design");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeTheme, setIframeTheme] = useState<"dark" | "light">("dark");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const appTheme = useAppTheme();
  const sidebarRef = useRef<HTMLElement>(null);

  // Section reorder state
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!data) navigate({ to: "/create" });
  }, [data, navigate]);

  useEffect(() => {
    if (!data) return;
    setSaveStatus("unsaved");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus("saving");
      try {
        sessionStorage.setItem(
          AUTOSAVE_KEY,
          JSON.stringify({ data, template, savedAt: new Date().toISOString() })
        );
      } catch { /* storage quota exceeded */ }
      setTimeout(() => setSaveStatus("saved"), 400);
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [data, template]);

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

  // ── Global keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const isTyping = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable;

      // Ctrl/Cmd + D → Download
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        handleDownload();
        return;
      }

      // Only fire non-modifier shortcuts when NOT typing
      if (isTyping) return;

      // 1 / 2 / 3 → switch sidebar tabs
      if (e.key === "1") { e.preventDefault(); setTab("design"); }
      if (e.key === "2") { e.preventDefault(); setTab("content"); }
      if (e.key === "3") { e.preventDefault(); setTab("projects"); }

      // T → toggle preview theme
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setIframeTheme((t) => (t === "dark" ? "light" : "dark"));
      }

      // Arrow keys on template cards when focus is inside design tab
      if (tab === "design" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        const idx = TEMPLATES.findIndex((t) => t.id === template);
        if (e.key === "ArrowDown" && idx < TEMPLATES.length - 1) {
          e.preventDefault();
          setTemplate(TEMPLATES[idx + 1].id);
        }
        if (e.key === "ArrowUp" && idx > 0) {
          e.preventDefault();
          setTemplate(TEMPLATES[idx - 1].id);
        }
      }

      // ? → show keyboard shortcut hint (future: modal)
      if (e.key === "?") {
        e.preventDefault();
        // Announce via aria-live (see ShortcutHint below)
        document.getElementById("shortcut-announce")?.setAttribute("data-show", "true");
        setTimeout(() => document.getElementById("shortcut-announce")?.removeAttribute("data-show"), 3000);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tab, template, data, built]);

  if (!data) return null;

  const device = DEVICE_CONFIG[deviceMode];
  const tabs: { id: "design" | "content" | "projects"; label: string; shortcut: string }[] = [
    { id: "design", label: "Design", shortcut: "1" },
    { id: "content", label: "Content", shortcut: "2" },
    { id: "projects", label: "Projects", shortcut: "3" },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── Skip to main content link (keyboard accessibility) ── */}
      <a
        href="#editor-main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg focus:outline focus:outline-2"
      >
        Skip to main content
      </a>

      {/* ── Keyboard shortcut announce region ── */}
      <div
        id="shortcut-announce"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Keyboard shortcuts: 1 Design · 2 Content · 3 Projects · T toggle preview · Ctrl+D download · ↑↓ change template
      </div>

      {/* ── Header ── */}
      <header role="banner" className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2" aria-label="FolioCV home">
            <Logo size={22} />
            <span className="font-serif text-lg" aria-hidden="true">FolioCV</span>
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline" aria-label={`Editing portfolio for ${data.name}`}>
            / Editing {data.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <SaveBadge status={saveStatus} />

          {/* Lighthouse badge — shown only when we have a built site */}
          {built && <LighthouseBadge html={built.html} css={built.css} />}

          {/* App-level dark/light toggle */}
          <button
            onClick={toggleAppTheme}
            aria-label={`Switch to ${appTheme === "dark" ? "light" : "dark"} mode`}
            className="hidden rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent sm:inline-flex items-center gap-1.5"
          >
            {appTheme === "dark" ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
            {appTheme === "dark" ? "Dark" : "Light"}
          </button>

          {/* Preview iframe theme (separate from app theme) */}
          <button
            onClick={() => setIframeTheme((t) => (t === "dark" ? "light" : "dark"))}
            aria-label={`Switch preview to ${iframeTheme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={iframeTheme === "light"}
            className="hidden rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent sm:inline-flex items-center gap-1.5"
          >
            Preview: {iframeTheme === "dark" ? "Dark" : "Light"}
          </button>

          <button
            onClick={handleDownload}
            aria-label="Download portfolio as ZIP (Ctrl+D)"
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-90"
          >
            ↓ Download code
          </button>

          {/* Keyboard shortcut hint button */}
          <button
            onClick={() => {
              document.getElementById("shortcut-announce")?.setAttribute("data-show", "true");
              alert("Keyboard shortcuts:\n\n1 → Design tab\n2 → Content tab\n3 → Projects tab\nT → Toggle preview theme\n↑↓ → Change template (in Design tab)\nCtrl+D → Download portfolio\n? → Show this help");
            }}
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            className="hidden sm:flex items-center justify-center rounded-full border border-border h-7 w-7 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            ?
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside
          ref={sidebarRef}
          aria-label="Portfolio editor sidebar"
          className="flex w-[380px] shrink-0 flex-col border-r border-border bg-card"
        >
          {/* Tab bar */}
          <div
            role="tablist"
            aria-label="Editor sections"
            className="flex border-b border-border text-xs"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={tab === t.id}
                aria-controls={`tabpanel-${t.id}`}
                onClick={() => setTab(t.id)}
                title={`${t.label} (press ${t.shortcut})`}
                className={`flex-1 py-3 capitalize transition ${
                  tab === t.id ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                <span className="ml-1 hidden rounded bg-muted px-1 text-[9px] text-muted-foreground lg:inline" aria-hidden="true">
                  {t.shortcut}
                </span>
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id={`tabpanel-${tab}`}
            aria-labelledby={`tab-${tab}`}
            tabIndex={0}
            className="flex-1 overflow-y-auto p-5 outline-none"
          >
            {tab === "design" && (
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground" id="template-heading">Template</div>
                <div role="radiogroup" aria-labelledby="template-heading">
                  {TEMPLATES.map((t, idx) => (
                    <button
                      key={t.id}
                      role="radio"
                      aria-checked={template === t.id}
                      onClick={() => setTemplate(t.id)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown" && idx < TEMPLATES.length - 1) {
                          e.preventDefault();
                          setTemplate(TEMPLATES[idx + 1].id);
                          (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
                        }
                        if (e.key === "ArrowUp" && idx > 0) {
                          e.preventDefault();
                          setTemplate(TEMPLATES[idx - 1].id);
                          (e.currentTarget.previousElementSibling as HTMLElement)?.focus();
                        }
                      }}
                      tabIndex={template === t.id ? 0 : -1}
                      className={`mb-2 w-full rounded-xl border p-4 text-left transition focus:outline focus:outline-2 focus:outline-offset-2 ${
                        template === t.id
                          ? "border-foreground bg-accent"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-serif text-lg">{t.name}</div>
                        <span className="mono text-[10px] text-muted-foreground" aria-hidden="true">
                          0{idx + 1}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{t.tagline}</div>
                      <TemplatePreview id={t.id} />
                    </button>
                  ))}
                </div>

                {/* Section reordering */}
                <div className="pt-4">
                  <div className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground" id="section-order-heading">
                    Section Order
                  </div>
                  <p className="mb-3 text-[10px] text-muted-foreground" id="section-order-desc">
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
          </div>
        </aside>

        {/* ── Preview area ── */}
        <main id="editor-main-content" className="flex flex-1 flex-col overflow-hidden bg-muted/30" aria-label="Portfolio preview">
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/60 px-4 py-2">
            <div className="flex items-center gap-2">
              <DeviceToggle mode={deviceMode} onChange={setDeviceMode} />
              <span className="text-[10px] text-muted-foreground" aria-live="polite" aria-atomic="true">
                {deviceMode === "desktop" ? "Full width" : device.width}
              </span>
            </div>
            <button
              onClick={() => setIframeTheme((t) => (t === "dark" ? "light" : "dark"))}
              aria-label={`Switch preview to ${iframeTheme === "dark" ? "light" : "dark"} mode`}
              aria-pressed={iframeTheme === "light"}
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
                title={`Portfolio preview — ${data.name}`}
                aria-label={`Live preview of ${data.name}'s portfolio`}
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
    <div className="mt-3 h-16 w-full overflow-hidden rounded-md border border-border bg-background" aria-hidden="true">
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
        {id === "aurora" && (
          <>
            <defs>
              <linearGradient id="auroraGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="200" height="60" fill="#04050d" />
            <ellipse cx="40" cy="20" rx="35" ry="25" fill="#7c3aed" opacity="0.18" />
            <ellipse cx="160" cy="40" rx="40" ry="22" fill="#0ea5e9" opacity="0.15" />
            <circle cx="30" cy="18" r="8" fill="url(#auroraGrad)" opacity="0.9" />
            <rect x="46" y="13" width="60" height="4" rx="2" fill="url(#auroraGrad)" opacity="0.9" />
            <rect x="46" y="22" width="40" height="2" rx="1" fill="#a78bfa" opacity="0.5" />
            <rect x="10" y="36" width="180" height="14" rx="4" fill="white" opacity="0.04" />
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
        aria-label={loading ? "Enhancing bio with AI" : "Enhance bio with AI"}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-50"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        {loading ? "Enhancing…" : "Enhance with AI"}
      </button>
      {status && <span className="text-[10px] text-muted-foreground" role="status" aria-live="polite">{status}</span>}
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
      <span className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground" id="avatar-label">Your Photo</span>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="Your profile photo" className="h-16 w-16 shrink-0 rounded-full border border-border object-cover" />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted" aria-label="No photo uploaded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <button type="button" onClick={() => inputRef.current?.click()}
            aria-label="Upload profile photo from computer"
            className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium hover:bg-accent hover:border-foreground transition"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload photo from computer
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} aria-label="Select profile photo file" />
          <input
            value={value?.startsWith("data:") ? "" : (value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder="or paste image URL"
            aria-label="Profile photo URL"
            className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-xs outline-none focus:border-foreground placeholder:text-muted-foreground"
          />
          {value && (
            <button type="button" onClick={() => onChange("")}
              aria-label="Remove profile photo"
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
    <div className="rounded-lg border border-border bg-background p-3 space-y-2" aria-label="Profile gallery editor">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground" id="gallery-label">Profile Gallery</span>
        <span className={`text-[10px] font-medium ${all.length >= MAX_GALLERY_IMAGES ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">
          {all.length} / {MAX_GALLERY_IMAGES}
        </span>
      </div>
      {all.length > 0 ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted" role="img" aria-label={`Gallery image ${idx + 1} of ${all.length}`}>
          <img src={current} alt={`Gallery image ${idx + 1} of ${all.length}`} className="h-44 w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; }} />
          {all.length > 1 && (
            <>
              <button onClick={prev} aria-label="Previous gallery image" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white hover:bg-black/80 transition">‹</button>
              <button onClick={next} aria-label="Next gallery image" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white hover:bg-black/80 transition">›</button>
            </>
          )}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" role="tablist" aria-label="Gallery thumbnails">
            {all.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                role="tab"
                aria-selected={i === idx}
                aria-label={`Go to gallery image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
          <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white" aria-hidden="true">{idx + 1} / {all.length}</div>
          <button onClick={removeCurrent} aria-label={`Remove gallery image ${idx + 1}`} className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-black/80 transition">✕ Remove</button>
        </div>
      ) : (
        <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 gap-1.5" aria-label="No gallery images added yet">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-[10px] text-muted-foreground">No gallery images yet</span>
        </div>
      )}
      {all.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="list" aria-label="Gallery thumbnails">
          {all.map((src, i) => (
            <button key={i} onClick={() => setIdx(i)}
              role="listitem"
              aria-label={`Select gallery image ${i + 1}`}
              aria-current={i === idx ? "true" : undefined}
              className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition ${i === idx ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => canAdd && uploadRef.current?.click()} disabled={!canAdd}
          aria-label="Upload gallery image from computer"
          className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] font-medium hover:bg-accent hover:border-foreground transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload image
        </button>
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} aria-label="Select gallery image file" />
        <button onClick={() => setAddingUrl((a) => !a)} disabled={!canAdd}
          aria-label="Add gallery image by URL"
          aria-expanded={addingUrl}
          className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
        >+ Paste URL</button>
      </div>
      {addingUrl && (
        <div className="flex gap-1">
          <input autoFocus value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUrl()}
            placeholder="https://i.imgur.com/..."
            aria-label="Gallery image URL"
            className="flex-1 rounded border border-border bg-muted px-2 py-1 text-[10px] outline-none focus:border-foreground"
          />
          <button onClick={addUrl} aria-label="Add image URL to gallery" className="rounded border border-border px-2.5 py-1 text-[10px] hover:bg-accent">Add</button>
        </div>
      )}
      {!canAdd && <p className="text-[10px] text-destructive" role="alert">Maximum {MAX_GALLERY_IMAGES} images reached.</p>}
    </div>
  );
}

function GitHubSyncPanel({ data, patch }: { data: PortfolioData; patch: (p: Partial<PortfolioData>) => void }) {
  const [token, setToken] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const enabled = data.githubSync ?? false;
  const toggleId = "github-sync-toggle";
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
          <label htmlFor={toggleId} className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground cursor-pointer">GitHub README Sync</label>
          <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
            Auto-populate a <code className="rounded bg-muted px-1 py-0.5">portfolio.json</code> in your GitHub profile repo.
          </p>
        </div>
        <button
          id={toggleId}
          onClick={() => patch({ githubSync: !enabled })}
          role="switch"
          aria-checked={enabled}
          aria-label={`GitHub README sync ${enabled ? "enabled" : "disabled"}`}
          className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${enabled ? "bg-foreground" : "bg-muted-foreground/30"}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${enabled ? "left-4" : "left-0.5"}`} aria-hidden="true" />
        </button>
      </div>
      {enabled && (
        <div className="space-y-2">
          <div>
            <label htmlFor="gh-pat" className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Personal Access Token</label>
            <input id="gh-pat" type="password" value={token} onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              aria-describedby="gh-pat-desc"
              className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-xs outline-none focus:border-foreground font-mono" autoComplete="off"
            />
            <p id="gh-pat-desc" className="sr-only">Enter your GitHub Personal Access Token with repo write permissions</p>
          </div>
          <button onClick={handleSync} disabled={syncing}
            aria-label={syncing ? "Syncing portfolio to GitHub" : "Push portfolio JSON to GitHub"}
            className="w-full rounded-md bg-foreground py-2 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50 transition"
          >{syncing ? "Syncing…" : "↑ Push portfolio.json to GitHub"}</button>
          {status && (
            <p role={status.ok ? "status" : "alert"} aria-live="polite" className={`text-[10px] leading-relaxed ${status.ok ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>{status.msg}</p>
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
        <label className="block" htmlFor="bio-field">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Bio (one-liner)</span>
          <textarea id="bio-field" value={data.bio ?? ""} onChange={(e) => patch({ bio: e.target.value })} rows={2}
            aria-label="Short biography"
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
        </label>
        <AiBioButton value={data.bio} name={data.name} title={data.title} onResult={(v) => patch({ bio: v })} />
      </div>
      <div>
        <label className="block" htmlFor="about-field">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">About (long form)</span>
          <textarea id="about-field" value={data.about ?? ""} onChange={(e) => patch({ about: e.target.value })} rows={5}
            aria-label="Detailed about section"
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
          <img src={current} alt={`Project screenshot ${idx + 1} of ${all.length}`} className="h-36 w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; }} />
          {all.length > 1 && (
            <>
              <button onClick={prev} aria-label="Previous screenshot" className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">‹</button>
              <button onClick={next} aria-label="Next screenshot" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">›</button>
            </>
          )}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1" aria-hidden="true">
            {all.map((_, i) => <span key={i} className={`inline-block h-1.5 w-1.5 rounded-full transition ${i === idx ? "bg-white" : "bg-white/40"}`} />)}
          </div>
          <button onClick={removeCurrentImage} aria-label={`Remove screenshot ${idx + 1}`} className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-red-400 hover:text-red-300">✕</button>
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40">
          <span className="text-[10px] text-muted-foreground">No images yet</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => uploadRef.current?.click()}
          aria-label="Upload project screenshot"
          className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] font-medium hover:bg-accent hover:border-foreground transition"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload image
        </button>
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} aria-label="Select project screenshot file" />
        <button onClick={captureScreenshot}
          disabled={capturing || (!liveUrl?.startsWith("http") && !ghUrl?.startsWith("http"))}
          aria-label={capturing ? "Capturing screenshot" : "Capture screenshot from live URL"}
          className="flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent disabled:opacity-40 transition"
        >📸 {capturing ? "Capturing…" : "Screenshot"}</button>
        <button onClick={() => setAdding((a) => !a)}
          aria-label="Add screenshot by URL"
          aria-expanded={adding}
          className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition"
        >+ Paste URL</button>
        {liveUrl?.startsWith("http") && <a href={liveUrl} target="_blank" rel="noopener noreferrer" aria-label="Open live project site" className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition">↗ Live</a>}
        {ghUrl?.startsWith("http") && <a href={ghUrl} target="_blank" rel="noopener noreferrer" aria-label="Open GitHub repository" className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition">⌥ GitHub</a>}
      </div>
      {adding && (
        <div className="flex gap-1">
          <input autoFocus value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUrl()}
            placeholder="https://i.imgur.com/..."
            aria-label="Screenshot URL"
            className="flex-1 rounded border border-border bg-muted px-2 py-1 text-[10px] outline-none focus:border-foreground"
          />
          <button onClick={addUrl} aria-label="Add screenshot URL" className="rounded border border-border px-2.5 py-1 text-[10px] hover:bg-accent">Add</button>
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
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground" id="projects-heading">Projects</div>
          <div className="mt-0.5 text-xs text-muted-foreground" aria-live="polite">{includedCount} of {projects.length} shown</div>
        </div>
        <div className="flex gap-1" role="group" aria-label="Project visibility controls">
          <button onClick={() => toggleAll(true)} aria-label="Show all projects" className="rounded-full border border-border px-2 py-1 text-[10px] hover:bg-accent">All</button>
          <button onClick={() => toggleAll(false)} aria-label="Hide all projects" className="rounded-full border border-border px-2 py-1 text-[10px] hover:bg-accent">None</button>
          <button onClick={add} aria-label="Add new project" className="rounded-full bg-foreground px-2 py-1 text-[10px] text-background">+ Add</button>
        </div>
      </div>
      <div className="space-y-4" role="list" aria-label="Project list">
        {projects.length === 0 && <div className="text-xs text-muted-foreground" role="listitem">No projects yet.</div>}
        {projects.map((p, i) => {
          const on = p.include !== false;
          const allImgs = p.images?.length ? p.images : p.image ? [p.image] : [];
          return (
            <div key={i} role="listitem" className={`rounded-xl border p-3 transition ${on ? "border-border bg-background" : "border-border bg-muted/40 opacity-60"}`}>
              <div className="mb-3 flex items-center gap-2">
                <button onClick={() => updateAt(i, { include: !on })}
                  role="switch"
                  aria-checked={on}
                  aria-label={`${on ? "Hide" : "Show"} project: ${p.name || "Untitled"}`}
                  className={`relative h-4 w-7 shrink-0 rounded-full transition ${on ? "bg-foreground" : "bg-muted-foreground/40"}`}
                >
                  <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-background transition-all ${on ? "left-3.5" : "left-0.5"}`} aria-hidden="true" />
                </button>
                <span className="flex-1 truncate text-xs font-medium">{p.name || "Untitled"}</span>
                <button onClick={() => removeAt(i)} aria-label={`Delete project: ${p.name || "Untitled"}`} className="shrink-0 text-[10px] text-destructive hover:underline">Delete</button>
              </div>
              <ImageCarousel images={allImgs} liveUrl={p.url} ghUrl={p.githubUrl}
                onChange={(imgs) => updateAt(i, { images: imgs, image: imgs[0] ?? "" })} />
              <div className="mt-3 space-y-1.5">
                <input value={p.name ?? ""} placeholder="Project name" aria-label="Project name" onChange={(e) => updateAt(i, { name: e.target.value })} className="w-full rounded-md border border-transparent bg-muted px-3 py-1.5 text-xs outline-none focus:border-border" />
                <input value={p.description ?? ""} placeholder="Short description" aria-label="Project description" onChange={(e) => updateAt(i, { description: e.target.value })} className="w-full rounded-md border border-transparent bg-muted px-3 py-1.5 text-xs outline-none focus:border-border" />
                <input value={p.url ?? ""} placeholder="Live URL (https://...)" aria-label="Project live URL" onChange={(e) => updateAt(i, { url: e.target.value })} className="w-full rounded-md border border-transparent bg-muted px-3 py-1.5 text-xs outline-none focus:border-border" />
                <input value={p.githubUrl ?? ""} placeholder="GitHub repo URL (optional)" aria-label="Project GitHub URL" onChange={(e) => updateAt(i, { githubUrl: e.target.value })} className="w-full rounded-md border border-transparent bg-muted px-3 py-1.5 text-xs outline-none focus:border-border" />
                <input value={p.language ?? ""} placeholder="Language / tech stack" aria-label="Project language or tech stack" onChange={(e) => updateAt(i, { language: e.target.value })} className="w-full rounded-md border border-transparent bg-muted px-3 py-1.5 text-xs outline-none focus:border-border" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; rows?: number }) {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
  return (
    <label className="block" htmlFor={fieldId}>
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea id={fieldId} value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows}
          aria-label={label}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
      ) : (
        <input id={fieldId} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
      )}
    </label>
  );
}

function ListEditor<T extends Record<string, any>>({ label, items, onChange, fields, blank }: { label: string; items: T[]; onChange: (items: T[]) => void; fields: (keyof T & string)[]; blank: T }) {
  const headingId = `list-editor-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="rounded-lg border border-border p-3" role="group" aria-labelledby={headingId}>
      <div className="mb-2 flex items-center justify-between">
        <span id={headingId} className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <button onClick={() => onChange([...items, { ...blank }])}
          aria-label={`Add new ${label.toLowerCase()} entry`}
          className="rounded-full border border-border px-2 py-0.5 text-[10px] hover:bg-accent"
        >+ Add</button>
      </div>
      <div className="space-y-3">
        {(items ?? []).map((item, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-2">
            {fields.map((f) => (
              <input key={f} value={item[f] ?? ""} placeholder={f}
                aria-label={`${label} entry ${i + 1}: ${f}`}
                onChange={(e) => { const next = [...items]; next[i] = { ...next[i], [f]: e.target.value }; onChange(next); }}
                className="mb-1 w-full rounded border border-transparent bg-muted px-2 py-1 text-xs outline-none focus:border-border"
              />
            ))}
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label={`Remove ${label.toLowerCase()} entry ${i + 1}`}
              className="mt-1 text-[10px] text-destructive hover:underline"
            >Remove</button>
          </div>
        ))}
        {(items ?? []).length === 0 && <div className="text-xs text-muted-foreground">Nothing yet.</div>}
      </div>
    </div>
  );
}
