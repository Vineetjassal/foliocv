import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/Logo";
import type { PortfolioData, TemplateId } from "@/lib/types";
import { generatePortfolioHtml } from "@/lib/templates";

export const Route = createFileRoute("/edit")({
  component: EditPage,
});

const TEMPLATES: { id: TemplateId; label: string; desc: string }[] = [
  { id: "centered",  label: "Quiet",     desc: "Centered & minimal" },
  { id: "split",     label: "Studio",    desc: "Sidebar + content" },
  { id: "editorial", label: "Editorial", desc: "Bold serif layout" },
  { id: "minimal",   label: "Minimal",   desc: "Clean & typographic" },
];

type PreviewWidth = "desktop" | "tablet" | "mobile";

const PREVIEW_WIDTHS: { id: PreviewWidth; label: string; icon: string; px: string }[] = [
  {
    id: "desktop",
    label: "Desktop",
    px: "100%",
    icon: "M20 3H4a1 1 0 00-1 1v12a1 1 0 001 1h7v2H9v2h6v-2h-2v-2h7a1 1 0 001-1V4a1 1 0 00-1-1zm-1 12H5V5h14v10z",
  },
  {
    id: "tablet",
    label: "Tablet",
    px: "768px",
    icon: "M19 1H5a2 2 0 00-2 2v18a2 2 0 002 2h14a2 2 0 002-2V3a2 2 0 00-2-2zm-7 20a1 1 0 110-2 1 1 0 010 2zm7-4H5V4h14v13z",
  },
  {
    id: "mobile",
    label: "Mobile",
    px: "390px",
    icon: "M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zm-5 18a1 1 0 110-2 1 1 0 010 2zm6-4H6V5h12v11z",
  },
];

function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-foreground transition-colors resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
        />
      )}
    </div>
  );
}

function SectionCard({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-accent/40 transition-colors"
      >
        <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

export default function EditPage() {
  const navigate = useNavigate();
  const storeData = useStore((s) => s.data);
  const patch = useStore((s) => s.patch);
  const template = useStore((s) => s.template);
  const setTemplate = useStore((s) => s.setTemplate);
  const clearDraft = useStore((s) => s.clearDraft);

  const [local, setLocal] = useState<PortfolioData | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>("desktop");
  const [downloading, setDownloading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 1. Initialise local state from store on first mount only ──────────────
  //    DO NOT also call setPreviewHtml here — the effect below is the single
  //    source of truth so edits always trigger a fresh render.
  useEffect(() => {
    if (!storeData) {
      navigate({ to: "/create" });
      return;
    }
    setLocal((prev) => (prev === null ? storeData : prev));
  }, [storeData, navigate]);

  // ── 2. Re-render preview whenever local data or template changes ──────────
  //    Keep the debounce timer in a ref so this effect never needs to be
  //    re-created and never captures a stale closure over `local` / `template`.
  const localRef = useRef<PortfolioData | null>(null);
  const templateRef = useRef<TemplateId>(template);
  localRef.current = local;
  templateRef.current = template;

  useEffect(() => {
    if (!local) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Read from refs so the callback is never stale
      if (localRef.current && templateRef.current) {
        setPreviewHtml(generatePortfolioHtml(localRef.current, templateRef.current));
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [local, template]);

  if (!local) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading editor…</div>
      </div>
    );
  }

  function set(key: keyof PortfolioData, value: any) {
    setLocal((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function handleSave() {
    if (!local) return;
    patch(local);
  }

  function handleDownload() {
    if (!previewHtml || !local) return;
    patch(local);
    setDownloading(true);
    try {
      const blob = new Blob([previewHtml], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(local.name || "portfolio").toLowerCase().replace(/\s+/g, "-")}-portfolio.html`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  function handleStartOver() {
    clearDraft();
    navigate({ to: "/create" });
  }

  function addSkill() {
    const s = newSkill.trim();
    if (!s || local.skills.includes(s)) return;
    set("skills", [...local.skills, s]);
    setNewSkill("");
  }

  function removeSkill(skill: string) {
    set("skills", local.skills.filter((s) => s !== skill));
  }

  function addExperience() {
    set("experience", [
      ...local.experience,
      { role: "", company: "", period: "", description: "" },
    ]);
  }

  function patchExp(i: number, key: string, val: string) {
    set(
      "experience",
      local.experience.map((e, idx) => (idx === i ? { ...e, [key]: val } : e))
    );
  }

  function removeExp(i: number) {
    set("experience", local.experience.filter((_, idx) => idx !== i));
  }

  function addEducation() {
    set("education", [
      ...local.education,
      { degree: "", school: "", period: "" },
    ]);
  }

  function patchEdu(i: number, key: string, val: string) {
    set(
      "education",
      local.education.map((e, idx) => (idx === i ? { ...e, [key]: val } : e))
    );
  }

  function removeEdu(i: number) {
    set("education", local.education.filter((_, idx) => idx !== i));
  }

  function toggleProject(i: number) {
    set(
      "projects",
      local.projects.map((p, idx) =>
        idx === i ? { ...p, include: !p.include } : p
      )
    );
  }

  const currentWidthConfig = PREVIEW_WIDTHS.find((w) => w.id === previewWidth)!;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">

      {/* ── TOP HEADER ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6 z-20">
        {/* Left: Logo + breadcrumb */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={22} />
            <span className="font-serif text-base hidden sm:inline">FolioCV</span>
          </Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <div className="flex items-center gap-1.5 text-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span className="text-foreground font-medium">
              {local.name || "Editing"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline opacity-60">· Saved</span>
        </div>

        {/* Center: Preview width switcher */}
        <div className="hidden md:flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {PREVIEW_WIDTHS.map((w) => (
            <button
              key={w.id}
              type="button"
              title={w.label}
              onClick={() => setPreviewWidth(w.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-all ${
                previewWidth === w.id
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d={w.icon} />
              </svg>
              <span className="hidden lg:inline">{w.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartOver}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors hidden sm:inline-flex"
          >
            Start over
          </button>
          <button
            onClick={handleSave}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading ? "…" : "Download"}
          </button>
        </div>
      </header>

      {/* ── MAIN SPLIT PANEL ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Editor Panel ── */}
        <aside className="flex w-full max-w-[360px] shrink-0 flex-col border-r border-border bg-background overflow-y-auto">

          {/* Section tabs header */}
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">Editor</span>
          </div>

          <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">

            {/* Template picker */}
            <SectionCard title="Template">
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      template === t.id
                        ? "border-foreground bg-accent shadow-sm"
                        : "border-border hover:border-foreground/40"
                    }`}
                  >
                    <div className="text-sm font-medium">{t.label}</div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{t.desc}</div>
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* Identity */}
            <SectionCard title="Identity">
              <Field label="Full name" value={local.name} onChange={(v) => set("name", v)} placeholder="Vineet Jassal" />
              <Field label="Title / tagline" value={local.title} onChange={(v) => set("title", v)} placeholder="Mathematics Researcher & Developer" />
              <Field label="Short bio" value={local.bio} onChange={(v) => set("bio", v)} multiline placeholder="One-liner that appears under your name." />
              <Field label="About" value={local.about} onChange={(v) => set("about", v)} multiline placeholder="A longer paragraph about your background and interests." />
              <Field label="Avatar URL" value={local.avatar} onChange={(v) => set("avatar", v)} placeholder="https://github.com/yourname.png" />
            </SectionCard>

            {/* Contact */}
            <SectionCard title="Contact & Links" defaultOpen={false}>
              <Field label="Location" value={local.location} onChange={(v) => set("location", v)} placeholder="New Delhi, India" />
              <Field label="Email" value={local.email} onChange={(v) => set("email", v)} placeholder="you@example.com" />
              <Field label="Website" value={local.website} onChange={(v) => set("website", v)} placeholder="https://yoursite.com" />
              <Field label="GitHub username" value={local.github} onChange={(v) => set("github", v)} placeholder="yourname" />
            </SectionCard>

            {/* Skills */}
            <SectionCard title="Skills" defaultOpen={false}>
              <div className="flex flex-wrap gap-2">
                {local.skills.map((s) => (
                  <span key={s} className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Type a skill, press Enter"
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-foreground transition-colors"
                />
                <button type="button" onClick={addSkill} className="rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                  Add
                </button>
              </div>
            </SectionCard>

            {/* Experience */}
            <SectionCard title="Experience" defaultOpen={false}>
              {local.experience.length === 0 && (
                <p className="text-xs text-muted-foreground">No experience added yet.</p>
              )}
              {local.experience.map((exp, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Entry {i + 1}</span>
                    <button type="button" onClick={() => removeExp(i)} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
                  </div>
                  <Field label="Role" value={exp.role} onChange={(v) => patchExp(i, "role", v)} placeholder="Research Associate" />
                  <Field label="Company / Institution" value={exp.company} onChange={(v) => patchExp(i, "company", v)} placeholder="University of Delhi" />
                  <Field label="Period" value={exp.period} onChange={(v) => patchExp(i, "period", v)} placeholder="2022 – Present" />
                  <Field label="Description" value={exp.description} onChange={(v) => patchExp(i, "description", v)} multiline placeholder="Brief summary of responsibilities or achievements." />
                </div>
              ))}
              <button type="button" onClick={addExperience} className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors">
                + Add experience
              </button>
            </SectionCard>

            {/* Education */}
            <SectionCard title="Education" defaultOpen={false}>
              {local.education.length === 0 && (
                <p className="text-xs text-muted-foreground">No education added yet.</p>
              )}
              {local.education.map((edu, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Entry {i + 1}</span>
                    <button type="button" onClick={() => removeEdu(i)} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
                  </div>
                  <Field label="Degree" value={edu.degree} onChange={(v) => patchEdu(i, "degree", v)} placeholder="B.Sc. (Hons.) Mathematics" />
                  <Field label="School" value={edu.school} onChange={(v) => patchEdu(i, "school", v)} placeholder="Kirori Mal College, University of Delhi" />
                  <Field label="Period" value={edu.period} onChange={(v) => patchEdu(i, "period", v)} placeholder="2023 – 2026" />
                </div>
              ))}
              <button type="button" onClick={addEducation} className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors">
                + Add education
              </button>
            </SectionCard>

            {/* Projects */}
            {local.projects.length > 0 && (
              <SectionCard title="Projects" defaultOpen={false}>
                <p className="text-xs text-muted-foreground">Toggle which projects appear on your portfolio.</p>
                <div className="space-y-2">
                  {local.projects.map((p, i) => (
                    <label key={i} className="flex cursor-pointer items-center justify-between rounded-xl border border-border px-4 py-3 hover:bg-accent transition-colors">
                      <div>
                        <div className="text-sm font-medium">{p.name || `Project ${i + 1}`}</div>
                        {p.description && (
                          <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={p.include !== false}
                        onChange={() => toggleProject(i)}
                        className="h-4 w-4 accent-foreground"
                      />
                    </label>
                  ))}
                </div>
              </SectionCard>
            )}

          </div>
        </aside>

        {/* ── RIGHT: Live Preview Panel ── */}
        <main className="flex flex-1 flex-col bg-muted/20 overflow-hidden">

          {/* Preview toolbar */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live preview
              <span className="text-border">·</span>
              <span className="capitalize font-medium text-foreground">{template}</span> template
            </div>

            {/* Mobile width switcher */}
            <div className="flex md:hidden items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
              {PREVIEW_WIDTHS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  title={w.label}
                  onClick={() => setPreviewWidth(w.id)}
                  className={`flex items-center rounded-md p-1.5 text-xs transition-all ${
                    previewWidth === w.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d={w.icon} />
                  </svg>
                </button>
              ))}
            </div>

            <div className="text-xs text-muted-foreground hidden sm:block">
              {currentWidthConfig.id !== "desktop" ? currentWidthConfig.px : "Full width"}
            </div>
          </div>

          {/* iframe container */}
          <div className="flex flex-1 items-start justify-center overflow-auto p-4">
            <div
              className="h-full rounded-xl overflow-hidden shadow-lg border border-border transition-all duration-300"
              style={{
                width: currentWidthConfig.px,
                minHeight: "100%",
              }}
            >
              {previewHtml ? (
                <iframe
                  ref={iframeRef}
                  srcDoc={previewHtml}
                  title="Live portfolio preview"
                  className="h-full w-full border-0"
                  style={{ minHeight: "calc(100vh - 120px)" }}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="flex h-full min-h-96 items-center justify-center bg-background">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Generating preview…
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
