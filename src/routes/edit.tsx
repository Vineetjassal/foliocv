import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";
import { buildSite } from "@/lib/templates";
import { enhanceBio } from "@/lib/aiBio";
import { screenshotUrl } from "@/lib/github";
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

/** Always return a safe string[] from any skills value */
function safeSkillsStr(skills: any): string {
  if (Array.isArray(skills)) return skills.map(String).filter(Boolean).join(', ');
  if (typeof skills === 'string') return skills;
  return '';
}
function parseSkills(v: string): string[] {
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

/** Convert a File to a base64 data URL */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Editor() {
  const navigate = useNavigate();
  const { data, template, patch, setTemplate } = useStore();
  const [tab, setTab] = useState<"design" | "content" | "projects">("design");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeTheme, setIframeTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (!data) navigate({ to: "/create" });
  }, [data, navigate]);

  const built = useMemo(() => (data ? buildSite(data, template) : null), [data, template]);

  useEffect(() => {
    if (!iframeRef.current || !built) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const html = built.html.replace("</head>", `<style>${built.css}</style></head>`);
    doc.open(); doc.write(html); doc.close();
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
    const a = document.createElement("a"); a.href = url;
    a.download = `${(data.name || "portfolio").toLowerCase().replace(/\s+/g, "-")}-foliocv.zip`;
    a.click(); URL.revokeObjectURL(url);
  }

  if (!data) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2"><Logo size={22} /><span className="font-serif text-lg">FolioCV</span></Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">/ Editing {data.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIframeTheme((t) => (t === "dark" ? "light" : "dark"))} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent">Preview: {iframeTheme}</button>
          <button onClick={handleDownload} className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-90">↓ Download code</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-[380px] shrink-0 flex-col border-r border-border bg-card">
          <div className="flex border-b border-border text-xs">
            {(["design", "content", "projects"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 capitalize transition ${tab === t ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {tab === "design" && (
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Template</div>
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => setTemplate(t.id)} className={`w-full rounded-xl border p-4 text-left transition ${template === t.id ? "border-foreground bg-accent" : "border-border hover:border-muted-foreground"}`}>
                    <div className="flex items-center justify-between"><div className="font-serif text-lg">{t.name}</div><span className="mono text-[10px] text-muted-foreground">0{TEMPLATES.indexOf(t) + 1}</span></div>
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
        <main className="flex-1 overflow-hidden bg-muted/30 p-4">
          <div className="mx-auto h-full max-w-[1200px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
            <iframe ref={iframeRef} title="Preview" className="h-full w-full" />
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
        {id === "centered" && (<><circle cx="100" cy="14" r="5" fill="currentColor" opacity="0.8" /><rect x="80" y="24" width="40" height="3" fill="currentColor" opacity="0.7" /><rect x="60" y="32" width="80" height="2" fill="currentColor" opacity="0.3" /><rect x="60" y="40" width="80" height="2" fill="currentColor" opacity="0.3" /></>)}
        {id === "split" && (<><rect x="0" y="0" width="60" height="60" fill="currentColor" opacity="0.15" /><circle cx="14" cy="14" r="5" fill="currentColor" opacity="0.6" /><rect x="8" y="24" width="40" height="2" fill="currentColor" opacity="0.5" /><rect x="72" y="10" width="120" height="3" fill="currentColor" opacity="0.6" /><rect x="72" y="22" width="100" height="2" fill="currentColor" opacity="0.3" /></>)}
        {id === "editorial" && (<><rect x="10" y="8" width="180" height="14" fill="currentColor" opacity="0.7" /><rect x="10" y="26" width="80" height="3" fill="currentColor" opacity="0.4" /><rect x="10" y="40" width="50" height="14" fill="currentColor" opacity="0.2" /><rect x="68" y="40" width="50" height="14" fill="currentColor" opacity="0.2" /><rect x="126" y="40" width="50" height="14" fill="currentColor" opacity="0.2" /></>)}
      </svg>
    </div>
  );
}

// ── AI Bio Button ────────────────────────────────────────────────────────────
function AiBioButton({ value, name, title, onResult }: { value: string; name: string; title: string; onResult: (v: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  async function run() {
    if (!value.trim()) { setStatus('Write a few words first'); return; }
    setLoading(true); setStatus('Thinking…');
    try {
      const result = await enhanceBio(value, name, title);
      onResult(result); setStatus('✓ Done');
    } catch { setStatus('Try again'); }
    finally { setLoading(false); setTimeout(() => setStatus(''), 3000); }
  }
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <button type="button" onClick={run} disabled={loading} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-50">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
        {loading ? 'Enhancing…' : 'Enhance with AI'}
      </button>
      {status && <span className="text-[10px] text-muted-foreground">{status}</span>}
    </div>
  );
}

// ── Avatar Upload ───────────────────────────────────────────────────────────────
function AvatarField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    onChange(dataUrl);
  }
  return (
    <div>
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Your Photo</span>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="avatar" className="h-14 w-14 rounded-full object-cover border border-border" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border bg-muted text-[10px] text-muted-foreground">Photo</div>
        )}
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => inputRef.current?.click()} className="rounded-full border border-border px-3 py-1 text-[10px] hover:bg-accent">📸 Upload photo</button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="or paste image URL" className="rounded border border-border bg-background px-2 py-1 text-[10px] outline-none focus:border-foreground" />
        </div>
      </div>
    </div>
  );
}

// ── Content Panel ────────────────────────────────────────────────────────────
function ContentPanel({ data, patch }: { data: PortfolioData; patch: (p: Partial<PortfolioData>) => void }) {
  // Local skill string state to avoid join/split fighting each keystroke
  const [skillStr, setSkillStr] = useState(() => safeSkillsStr(data.skills));

  // Sync if skills changed externally
  useEffect(() => {
    setSkillStr(safeSkillsStr(data.skills));
  }, []);

  function commitSkills(v: string) {
    setSkillStr(v);
    patch({ skills: parseSkills(v) });
  }

  return (
    <div className="space-y-4">
      <Field label="Name" value={data.name} onChange={(v) => patch({ name: v })} />
      <Field label="Title / Role" value={data.title} onChange={(v) => patch({ title: v })} />
      <Field label="Location" value={data.location} onChange={(v) => patch({ location: v })} />

      {/* Bio with AI */}
      <div>
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Bio (one-liner)</span>
          <textarea value={data.bio ?? ''} onChange={(e) => patch({ bio: e.target.value })} rows={2} className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
        </label>
        <AiBioButton value={data.bio} name={data.name} title={data.title} onResult={(v) => patch({ bio: v })} />
      </div>

      {/* About with AI */}
      <div>
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">About (long form)</span>
          <textarea value={data.about ?? ''} onChange={(e) => patch({ about: e.target.value })} rows={5} className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
        </label>
        <AiBioButton value={data.about} name={data.name} title={data.title} onResult={(v) => patch({ about: v })} />
      </div>

      {/* Avatar with upload */}
      <AvatarField value={data.avatar ?? ''} onChange={(v) => patch({ avatar: v })} />

      <Field label="Email" value={data.email} onChange={(v) => patch({ email: v })} />
      <Field label="Website" value={data.website} onChange={(v) => patch({ website: v })} />
      <Field label="GitHub handle" value={data.github} onChange={(v) => patch({ github: v })} />

      {/* Skills — controlled local string, parsed on change */}
      <div>
        <label className="block">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Skills (comma separated)</span>
          <textarea
            value={skillStr}
            onChange={(e) => commitSkills(e.target.value)}
            rows={3}
            placeholder="React, TypeScript, Node.js, Figma"
            className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
        </label>
        <div className="mt-1 text-[10px] text-muted-foreground">
          {parseSkills(skillStr).length > 0 ? `${parseSkills(skillStr).length} skills detected` : 'Type skills separated by commas'}
        </div>
      </div>

      <ListEditor label="Experience" items={data.experience} onChange={(items) => patch({ experience: items })} fields={['role', 'company', 'period', 'description']} blank={{ role: '', company: '', period: '', description: '' }} />
      <ListEditor label="Education" items={data.education} onChange={(items) => patch({ education: items })} fields={['degree', 'school', 'period']} blank={{ degree: '', school: '', period: '' }} />
      <ListEditor label="Links" items={data.links} onChange={(items) => patch({ links: items })} fields={['label', 'url']} blank={{ label: '', url: '' }} />
    </div>
  );
}

// ── Image Carousel Editor ────────────────────────────────────────────────────
function ImageCarousel({ images, liveUrl, ghUrl, onChange }: { images: string[]; liveUrl: string; ghUrl?: string; onChange: (imgs: string[]) => void }) {
  const [idx, setIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [capturing, setCapturing] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const all = images.length > 0 ? images : [];
  const current = all[Math.min(idx, all.length - 1)];

  function prev() { setIdx((i) => (i - 1 + all.length) % all.length); }
  function next() { setIdx((i) => (i + 1) % all.length); }

  function addUrl() {
    if (!newUrl.trim()) return;
    const next = [...all, newUrl.trim()];
    onChange(next); setIdx(next.length - 1); setNewUrl(''); setAdding(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    const next = [...all, dataUrl];
    onChange(next); setIdx(next.length - 1);
  }

  function removeCurrentImage() {
    const next = all.filter((_, i) => i !== idx);
    onChange(next); setIdx(Math.max(0, idx - 1));
  }

  async function captureScreenshot() {
    const target = liveUrl?.startsWith('http') ? liveUrl : ghUrl ?? '';
    if (!target) return;
    setCapturing(true);
    const ss = screenshotUrl(target);
    const next = [...all, ss];
    onChange(next); setIdx(next.length - 1);
    setCapturing(false);
  }

  return (
    <div className="space-y-2">
      {all.length > 0 ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
          <img src={current} alt="screenshot" className="h-36 w-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          {all.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">‹</button>
              <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">›</button>
            </>
          )}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {all.map((_, i) => (<span key={i} className={`inline-block h-1.5 w-1.5 rounded-full ${i === idx ? 'bg-white' : 'bg-white/40'}`} />))}
          </div>
          <button onClick={removeCurrentImage} className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] text-red-400">✕</button>
        </div>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-[10px] text-muted-foreground">No images — add below</div>
      )}

      <div className="flex flex-wrap gap-1">
        <button onClick={captureScreenshot} disabled={capturing || (!liveUrl && !ghUrl)} className="rounded-full border border-border px-2.5 py-1 text-[10px] hover:bg-accent disabled:opacity-40">
          {capturing ? 'Capturing…' : '📸 Screenshot'}
        </button>
        <button type="button" onClick={() => uploadRef.current?.click()} className="rounded-full border border-border px-2.5 py-1 text-[10px] hover:bg-accent">
          ↑ Upload image
        </button>
        <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <button onClick={() => setAdding((a) => !a)} className="rounded-full border border-border px-2.5 py-1 text-[10px] hover:bg-accent">+ URL</button>
        {liveUrl?.startsWith('http') && (
          <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-2.5 py-1 text-[10px] hover:bg-accent">↗ Live</a>
        )}
        {ghUrl?.startsWith('http') && (
          <a href={ghUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-2.5 py-1 text-[10px] hover:bg-accent">⌥ GitHub</a>
        )}
      </div>

      {adding && (
        <div className="flex gap-1">
          <input autoFocus value={newUrl} onChange={(e) => setNewUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addUrl()} placeholder="https://i.imgur.com/..." className="flex-1 rounded border border-border bg-muted px-2 py-1 text-[10px] outline-none focus:border-foreground" />
          <button onClick={addUrl} className="rounded border border-border px-2 text-[10px] hover:bg-accent">Add</button>
        </div>
      )}
    </div>
  );
}

// ── Projects Panel ───────────────────────────────────────────────────────────
function ProjectsPanel({ data, patch }: { data: PortfolioData; patch: (p: Partial<PortfolioData>) => void }) {
  const projects = data.projects;
  function updateAt(i: number, p: Partial<Project>) {
    patch({ projects: projects.map((x, idx) => (idx === i ? { ...x, ...p } : x)) });
  }
  function removeAt(i: number) { patch({ projects: projects.filter((_, idx) => idx !== i) }); }
  function add() {
    patch({ projects: [...projects, { name: 'New project', description: '', url: '', githubUrl: '', language: '', image: '', images: [], include: true }] });
  }
  function toggleAll(include: boolean) { patch({ projects: projects.map((p) => ({ ...p, include })) }); }
  const includedCount = projects.filter((p) => p.include !== false).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Projects</div>
          <div className="mt-1 text-xs text-muted-foreground">{includedCount} of {projects.length} shown</div>
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
            <div key={i} className={`rounded-xl border p-3 transition ${on ? 'border-border bg-background' : 'border-border bg-muted/40 opacity-60'}`}>
              <div className="mb-3 flex items-center gap-2">
                <button onClick={() => updateAt(i, { include: !on })} className={`relative h-4 w-7 shrink-0 rounded-full transition ${on ? 'bg-foreground' : 'bg-muted'}`} aria-label={on ? 'Hide' : 'Show'}>
                  <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-background transition ${on ? 'left-3.5' : 'left-0.5'}`} />
                </button>
                <span className="flex-1 truncate text-xs font-medium">{p.name || 'Untitled'}</span>
                <button onClick={() => removeAt(i)} className="text-[10px] text-destructive hover:underline">Delete</button>
              </div>

              <ImageCarousel
                images={allImgs}
                liveUrl={p.url}
                ghUrl={p.githubUrl}
                onChange={(imgs) => updateAt(i, { images: imgs, image: imgs[0] ?? '' })}
              />

              <div className="mt-3 space-y-1">
                <input value={p.name} placeholder="Project name" onChange={(e) => updateAt(i, { name: e.target.value })} className="w-full rounded border border-transparent bg-muted px-2 py-1 text-xs outline-none focus:border-border" />
                <input value={p.description} placeholder="Short description" onChange={(e) => updateAt(i, { description: e.target.value })} className="w-full rounded border border-transparent bg-muted px-2 py-1 text-xs outline-none focus:border-border" />
                <input value={p.url} placeholder="Live URL (https://...)" onChange={(e) => updateAt(i, { url: e.target.value })} className="w-full rounded border border-transparent bg-muted px-2 py-1 text-xs outline-none focus:border-border" />
                <input value={p.githubUrl ?? ''} placeholder="GitHub repo URL (optional)" onChange={(e) => updateAt(i, { githubUrl: e.target.value })} className="w-full rounded border border-transparent bg-muted px-2 py-1 text-xs outline-none focus:border-border" />
                <input value={p.language ?? ''} placeholder="Language / tech stack" onChange={(e) => updateAt(i, { language: e.target.value })} className="w-full rounded border border-transparent bg-muted px-2 py-1 text-xs outline-none focus:border-border" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Field ────────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, textarea, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
      ) : (
        <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground" />
      )}
    </label>
  );
}

// ── ListEditor ───────────────────────────────────────────────────────────────
function ListEditor<T extends Record<string, any>>({ label, items, onChange, fields, blank }: { label: string; items: T[]; onChange: (items: T[]) => void; fields: (keyof T & string)[]; blank: T }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <button onClick={() => onChange([...items, { ...blank }])} className="rounded-full border border-border px-2 py-0.5 text-[10px] hover:bg-accent">+ Add</button>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-2">
            {fields.map((f) => (
              <input key={f} value={item[f] ?? ''} placeholder={f} onChange={(e) => { const next = [...items]; next[i] = { ...next[i], [f]: e.target.value }; onChange(next); }} className="mb-1 w-full rounded border border-transparent bg-muted px-2 py-1 text-xs outline-none focus:border-border" />
            ))}
            <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="mt-1 text-[10px] text-destructive hover:underline">Remove</button>
          </div>
        ))}
        {items.length === 0 && <div className="text-xs text-muted-foreground">Nothing yet.</div>}
      </div>
    </div>
  );
}
