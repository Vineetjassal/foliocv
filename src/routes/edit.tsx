import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { buildSite } from "@/lib/templates";
import { enhanceBio } from "@/lib/aiBio";
import { screenshotUrl, pushPortfolioJson, extractUsername } from "@/lib/github";
import type { PortfolioData, Project, TemplateId } from "@/lib/types";

export const Route = createFileRoute("/edit")({
  head: () => ({ meta: [{ title: "Editor — FolioCV" }] }),
  component: Editor,
});

const TEMPLATES: { id: TemplateId; name: string; tagline: string }[] = [
  { id: "centered", name: "Quiet", tagline: "Centered & minimal · read.cv inspired" },
  { id: "split", name: "Studio", tagline: "Sidebar + content · structured" },
  { id: "editorial", name: "Editorial", tagline: "Bold serif · magazine layout" },
];

const MAX_GALLERY_IMAGES = 15;
const AUTOSAVE_KEY = "foliocv_autosave";

/** Convert File to base64 data URL — stored locally in memory/state, included in downloaded zip */
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
      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-green-600 dark:text-green-400">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Saved
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

  const parsed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  function handleChange(v: string) {
    setRaw(v);
    const arr = v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onCommit(arr);
  }

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
              <span
                key={i}
                className="mr-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[9px]"
              >
                {s}
              </span>
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

  // ── Auto-save state ──────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore from sessionStorage on mount (fallback for page refreshes)
  useEffect(() => {
    if (!data) {
      try {
        const raw = sessionStorage.getItem(AUTOSAVE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { data: PortfolioData; template: TemplateId };
          // Only restore if store has no data yet — handled by the route guard below
          _ = parsed; // parsed available if needed
        }
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!data) navigate({ to: "/create" });
  }, [data, navigate]);

  // Auto-save to sessionStorage whenever data or template changes
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
      } catch { /* storage quota exceeded or sandboxed */ }
      setTimeout(() => setSaveStatus("saved"), 400);
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
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

  if (!data) return null;

  const device = DEVICE_CONFIG[deviceMode];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
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
          {/* Auto-save badge */}
          <SaveBadge status={saveStatus} />

          {/* Preview theme toggle */}
          <button
            onClick={() => setIframeTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="hidden rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent sm:inline-flex items-center gap-1.5"
          >
            {iframeTheme === "dark" ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
            {iframeTheme === "dark" ? "Dark" : "Light"}
          </button>

          {/* Download button */}
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
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Template
                </div>
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
              </div>
            )}
            {tab === "content" && <ContentPanel data={data} patch={patch} />}
            {tab === "projects" && <ProjectsPanel data={data} patch={patch} />}
          </div>
        </aside>

        {/* ── Preview area ── */}
        <main className="flex flex-1 flex-col overflow-hidden bg-muted/30">
          {/* Device toggle toolbar */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/60 px-4 py-2">
            <div className="flex items-center gap-2">
              <DeviceToggle mode={deviceMode} onChange={setDeviceMode} />
              <span className="text-[10px] text-muted-foreground">
                {deviceMode === "desktop" ? "Full width" : device.width}
              </span>
            </div>
            {/* Mobile: theme toggle moved here */}
            <button
              onClick={() => setIframeTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-accent sm:hidden"
            >
              {iframeTheme === "dark" ? "Dark" : "Light"}
            </button>
          </div>

          {/* Preview frame */}
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
              {/* Device chrome frame for tablet/mobile */}
              {deviceMode !== "desktop" && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-[2rem] border-[8px] border-foreground/20 shadow-2xl z-10"
                  aria-hidden="true"
                >
                  {/* Notch / status bar indicator */}
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-0">
                    {deviceMode === "mobile" ? (
                      <div className="mt-1 h-1 w-16 rounded-full bg-foreground/30" />
                    ) : (
                      <div className="mt-1 h-1 w-8 rounded-full bg-foreground/30" />
                    )}
                  </div>
                  {/* Home bar */}
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
      </svg>
    </div>
  );
}

// ── AI Bio Button ────────────────────────────────────────────────────────────
function AiBioButton({
  value,
  name,
  title,
  onResult,
}: {
  value: string;
  name: string;
  title: string;
  onResult: (v: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  async function run() {
    if (!value?.trim()) {
      setStatus("Write a few words first");
      return;
    }
    setLoading(true);
    setStatus("Thinking…");
    try {
      const result = await enhanceBio(value, name, title);
      onResult(result);
      setStatus("✓ Done");
    } catch {
      setStatus("Try again");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 3000);
    }
  }
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-50"
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        {loading ? "Enhancing…" : "Enhance with AI"}
      </button>
      {status && <span className="text-[10px] text-muted-foreground">{status}</span>}
    </div>
  );
}

// ── Avatar Upload ─────────────────────────────────────────────────────────────
function AvatarField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    onChange(dataUrl);
    e.target.value = "";
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Your Photo
      </span>
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt="avatar"
            className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-muted-foreground"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        )}
        <div className="flex flex-1 flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium hover:bg-accent hover:border-foreground transition"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
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
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-left text-[10px] text-destructive hover:underline"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Profile Gallery Field ─────────────────────────────────────────────────────
function ProfileGalleryField({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
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
    onChange(updated);
    setIdx(updated.length - 1);
    e.target.value = "";
  }

  function addUrl() {
    if (!newUrl.trim() || !canAdd) return;
    const updated = [...all, newUrl.trim()];
    onChange(updated);
    setIdx(updated.length - 1);
    setNewUrl("");
    setAddingUrl(false);
  }

  function removeCurrent() {
    const updated = all.filter((_, i) => i !== idx);
    onChange(updated);
    setIdx(Math.max(0, idx - 1));
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Profile Gallery
        </span>
        <span className={`text-[10px] font-medium ${ all.length >= MAX_GALLERY_IMAGES ? "text-destructive" : "text-muted-foreground" }`}>
          {all.length} / {MAX_GALLERY_IMAGES}
        </span>
      </div>

      {all.length > 0 ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
          <img
            src={current}
            alt={`Gallery image ${idx + 1}`}
            className="h-44 w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; }}
          />
          {all.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white hover:bg-black/80 transition" aria-label="Previous image">‹</button>
              <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white hover:bg-black/80 transition" aria-label="Next image">›</button>
            </>
          )}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {all.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Go to image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${ i === idx ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80" }`}
              />
            ))}
          </div>
          <div className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
            {idx + 1} / {all.length}
          </div>
          <button onClick={removeCurrent} className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-black/80 transition" aria-label="Remove current image">
            ✕ Remove
          </button>
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
            <button key={i} onClick={() => setIdx(i)} aria-label={`Select image ${i + 1}`}
              className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition ${ i === idx ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100" }`}
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
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload image
        </button>
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <button onClick={() => setAddingUrl((a) => !a)} disabled={!canAdd}
          className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Paste URL
        </button>
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

      {!canAdd && (
        <p className="text-[10px] text-destructive">Maximum {MAX_GALLERY_IMAGES} images reached. Remove one to add more.</p>
      )}
    </div>
  );
}

// ── GitHub README Sync Panel ─────────────────────────────────────────────────
function GitHubSyncPanel({
  data,
  patch,
}: {
  data: PortfolioData;
  patch: (p: Partial<PortfolioData>) => void;
}) {
  const [token, setToken] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const enabled = data.githubSync ?? false;

  async function handleSync() {
    const username = data.github ? extractUsername(data.github) : "";
    if (!username) { setStatus({ ok: false, msg: "Add your GitHub handle in the Content tab first." }); return; }
    if (!token.trim()) { setStatus({ ok: false, msg: "Paste your GitHub Personal Access Token above." }); return; }
    setSyncing(true);
    setStatus(null);
    const result = await pushPortfolioJson(username, token.trim(), data);
    setSyncing(false);
    if (result.ok) {
      setStatus({ ok: true, msg: `✓ Synced! View at github.com/${username}/${username}/blob/main/portfolio.json` });
    } else {
      setStatus({ ok: false, msg: `✗ ${result.error}` });
    }
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">GitHub README Sync</span>
          <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
            Auto-populate a <code className="rounded bg-muted px-1 py-0.5">portfolio.json</code> in your
            GitHub profile repo (<code className="rounded bg-muted px-1 py-0.5">&lt;username&gt;/&lt;username&gt;</code>) and keep it in sync.
          </p>
        </div>
        <button onClick={() => patch({ githubSync: !enabled })} aria-label={enabled ? "Disable GitHub sync" : "Enable GitHub sync"}
          className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${ enabled ? "bg-foreground" : "bg-muted-foreground/30" }`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${ enabled ? "left-4" : "left-0.5" }`} />
        </button>
      </div>

      {enabled && (
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Personal Access Token</label>
            <input type="password" value={token} onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full rounded-md border border-border bg-muted px-3 py-1.5 text-xs outline-none focus:border-foreground font-mono"
              autoComplete="off"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Needs <code className="rounded bg-muted px-1">public_repo</code> scope. Token is never stored — only used for this request.
            </p>
          </div>
          <button onClick={handleSync} disabled={syncing}
            className="w-full rounded-md bg-foreground py-2 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50 transition"
          >
            {syncing ? "Syncing…" : "↑ Push portfolio.json to GitHub"}
          </button>
          {status && (
            <p className={`text-[10px] leading-relaxed ${ status.ok ? "text-green-600 dark:text-green-400" : "text-destructive" }`}>{status.msg}</p>
          )}
          <div className="rounded-md border border-border bg-muted/60 px-3 py-2 text-[10px] text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">What gets synced?</p>
            <p>Your name, title, bio, skills, experience, education, projects (URLs only — base64 images are excluded), and links are written as structured JSON to your profile repo.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Content Panel ────────────────────────────────────────────────────────────
function ContentPanel({
  data,
  patch,
}: {
  data: PortfolioData;
  patch: (p: Partial<PortfolioData>) => void;
}) {
  return (
    <div className="space-y-4">
      <Field label="Name" value={data.name} onChange={(v) => patch({ name: v })} />
      <Field label="Title / Role" value={data.title} onChange={(v) => patch({ title: v })} />
      <Field label="Location" value={data.location} onChange={(v) => patch({ location: v })} />

      <div>
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Bio (one-liner)</span>
          <textarea value={data.bio ?? ""} onChange={(e) => patch({ bio: e.target.value })} rows={2}
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <AiBioButton value={data.bio} name={data.name} title={data.title} onResult={(v) => patch({ bio: v })} />
      </div>

      <div>
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">About (long form)</span>
          <textarea value={data.about ?? ""} onChange={(e) => patch({ about: e.target.value })} rows={5}
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
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
        fields={["role", "company", "period", "description"]} blank={{ role: "", company: "", period: "", description: "" }}
      />
      <ListEditor label="Education" items={data.education} onChange={(items) => patch({ education: items })}
        fields={["degree", "school", "period"]} blank={{ degree: "", school: "", period: "" }}
      />
      <ListEditor label="Links" items={data.links} onChange={(items) => patch({ links: items })}
        fields={["label", "url"]} blank={{ label: "", url: "" }}
      />

      <GitHubSyncPanel data={data} patch={patch} />
    </div>
  );
}

// ── Image Carousel Editor ────────────────────────────────────────────────────
function ImageCarousel({
  images,
  liveUrl,
  ghUrl,
  onChange,
}: {
  images: string[];
  liveUrl: string;
  ghUrl?: string;
  onChange: (imgs: string[]) => void;
}) {
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
    onChange(updated);
    setIdx(updated.length - 1);
    setNewUrl("");
    setAdding(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const updated = [...all, dataUrl];
    onChange(updated);
    setIdx(updated.length - 1);
    e.target.value = "";
  }

  function removeCurrentImage() {
    const updated = all.filter((_, i) => i !== idx);
    onChange(updated);
    setIdx(Math.max(0, idx - 1));
  }

  async function captureScreenshot() {
    const target = liveUrl?.startsWith("http") ? liveUrl : (ghUrl ?? "");
    if (!target) return;
    setCapturing(true);
    const ss = screenshotUrl(target);
    const updated = [...all, ss];
    onChange(updated);
    setIdx(updated.length - 1);
    setCapturing(false);
  }

  return (
    <div className="space-y-2">
      {all.length > 0 ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
          <img src={current} alt="project screenshot" className="h-36 w-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = ""; }}
          />
          {all.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">‹</button>
              <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">›</button>
            </>
          )}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {all.map((_, i) => (
              <span key={i} className={`inline-block h-1.5 w-1.5 rounded-full transition ${i === idx ? "bg-white" : "bg-white/40"}`} />
            ))}
          </div>
          <button onClick={removeCurrentImage} title="Remove this image" className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-red-400 hover:text-red-300">✕</button>
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
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload image
        </button>
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <button onClick={captureScreenshot}
          disabled={capturing || (!liveUrl?.startsWith("http") && !ghUrl?.startsWith("http"))}
          className="flex items-center gap-1 rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent disabled:opacity-40 transition"
        >
          📸 {capturing ? "Capturing…" : "Screenshot"}
        </button>
        <button onClick={() => setAdding((a) => !a)}
          className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition"
        >
          + Paste URL
        </button>
        {liveUrl?.startsWith("http") && (
          <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition">↗ Live</a>
        )}
        {ghUrl?.startsWith("http") && (
          <a href={ghUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-border bg-muted px-2.5 py-1.5 text-[10px] hover:bg-accent transition">⌥ GitHub</a>
        )}
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

// ── Projects Panel ───────────────────────────────────────────────────────────
function ProjectsPanel({
  data,
  patch,
}: {
  data: PortfolioData;
  patch: (p: Partial<PortfolioData>) => void;
}) {
  const projects = data.projects ?? [];

  function updateAt(i: number, p: Partial<Project>) {
    patch({ projects: projects.map((x, idx) => (idx === i ? { ...x, ...p } : x)) });
  }
  function removeAt(i: number) {
    patch({ projects: projects.filter((_, idx) => idx !== i) });
  }
  function add() {
    patch({
      projects: [
        ...projects,
        { name: "New project", description: "", url: "", githubUrl: "", language: "", image: "", images: [], include: true },
      ],
    });
  }
  function toggleAll(include: boolean) {
    patch({ projects: projects.map((p) => ({ ...p, include })) });
  }
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

              <ImageCarousel
                images={allImgs}
                liveUrl={p.url}
                ghUrl={p.githubUrl}
                onChange={(imgs) => updateAt(i, { images: imgs, image: imgs[0] ?? "" })}
              />

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

// ── Field ────────────────────────────────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  textarea,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      ) : (
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      )}
    </label>
  );
}

// ── ListEditor ────────────────────────────────────────────────────────────────
function ListEditor<T extends Record<string, any>>({
  label,
  items,
  onChange,
  fields,
  blank,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  fields: (keyof T & string)[];
  blank: T;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <button onClick={() => onChange([...items, { ...blank }])}
          className="rounded-full border border-border px-2 py-0.5 text-[10px] hover:bg-accent"
        >
          + Add
        </button>
      </div>
      <div className="space-y-3">
        {(items ?? []).map((item, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-2">
            {fields.map((f) => (
              <input key={f} value={item[f] ?? ""} placeholder={f}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], [f]: e.target.value };
                  onChange(next);
                }}
                className="mb-1 w-full rounded border border-transparent bg-muted px-2 py-1 text-xs outline-none focus:border-border"
              />
            ))}
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="mt-1 text-[10px] text-destructive hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        {(items ?? []).length === 0 && <div className="text-xs text-muted-foreground">Nothing yet.</div>}
      </div>
    </div>
  );
}
