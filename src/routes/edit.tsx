import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import logoUrl from "@/assets/logo.png";
import { useStore } from "@/lib/store";
import { buildSite } from "@/lib/templates";
import type { PortfolioData, TemplateId } from "@/lib/types";

export const Route = createFileRoute("/edit")({
  head: () => ({ meta: [{ title: "Editor — Monogram" }] }),
  component: Editor,
});

const TEMPLATES: { id: TemplateId; name: string; tagline: string }[] = [
  { id: "centered", name: "Quiet", tagline: "Centered & minimal · read.cv inspired" },
  { id: "split", name: "Studio", tagline: "Sidebar + content · structured" },
  { id: "editorial", name: "Editorial", tagline: "Bold serif · magazine layout" },
];

function Editor() {
  const navigate = useNavigate();
  const { data, template, patch, setTemplate } = useStore();
  const [tab, setTab] = useState<"design" | "content">("design");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeTheme, setIframeTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (!data) navigate({ to: "/create" });
  }, [data, navigate]);

  const built = useMemo(() => (data ? buildSite(data, template) : null), [data, template]);

  // Inject into iframe
  useEffect(() => {
    if (!iframeRef.current || !built) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    const html = built.html.replace(
      "</head>",
      `<style>${built.css}</style></head>`
    );
    doc.open();
    doc.write(html);
    doc.close();
    // theme sync
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
    zip.file(
      "README.md",
      `# ${data.name} — Portfolio\n\nGenerated with Monogram.\n\n## Run locally\nOpen \`index.html\` in your browser, or serve the folder:\n\n\`\`\`bash\nnpx serve .\n\`\`\`\n\n## Deploy\nDrop the folder on Netlify, Vercel, GitHub Pages, or any static host.\n`
    );
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(data.name || "portfolio").toLowerCase().replace(/\s+/g, "-")}-monogram.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!data) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoUrl} alt="" className="h-6 w-6" />
            <span className="font-serif text-lg">Monogram</span>
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">/ Editing {data.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent"
          >
            Preview: {iframeTheme}
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
        {/* Sidebar */}
        <aside className="flex w-[340px] shrink-0 flex-col border-r border-border bg-card">
          <div className="flex border-b border-border text-xs">
            {(["design", "content"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 capitalize transition ${tab === t ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {tab === "design" ? (
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Template</div>
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${template === t.id ? "border-foreground bg-accent" : "border-border hover:border-muted-foreground"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-serif text-lg">{t.name}</div>
                      <span className="mono text-[10px] text-muted-foreground">0{TEMPLATES.indexOf(t) + 1}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{t.tagline}</div>
                    <TemplatePreview id={t.id} />
                  </button>
                ))}
              </div>
            ) : (
              <ContentPanel data={data} patch={patch} />
            )}
          </div>
        </aside>

        {/* Preview */}
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
  // tiny wireframe
  return (
    <div className="mt-3 h-16 w-full overflow-hidden rounded-md border border-border bg-background">
      <svg viewBox="0 0 200 60" className="h-full w-full">
        {id === "centered" && (
          <>
            <circle cx="100" cy="14" r="5" fill="currentColor" opacity="0.8" />
            <rect x="80" y="24" width="40" height="3" fill="currentColor" opacity="0.7" />
            <rect x="60" y="32" width="80" height="2" fill="currentColor" opacity="0.3" />
            <rect x="60" y="40" width="80" height="2" fill="currentColor" opacity="0.3" />
            <rect x="60" y="48" width="80" height="2" fill="currentColor" opacity="0.3" />
          </>
        )}
        {id === "split" && (
          <>
            <rect x="0" y="0" width="60" height="60" fill="currentColor" opacity="0.15" />
            <circle cx="14" cy="14" r="5" fill="currentColor" opacity="0.6" />
            <rect x="8" y="24" width="40" height="2" fill="currentColor" opacity="0.5" />
            <rect x="8" y="32" width="32" height="2" fill="currentColor" opacity="0.3" />
            <rect x="72" y="10" width="120" height="3" fill="currentColor" opacity="0.6" />
            <rect x="72" y="22" width="120" height="2" fill="currentColor" opacity="0.3" />
            <rect x="72" y="30" width="100" height="2" fill="currentColor" opacity="0.3" />
            <rect x="72" y="44" width="120" height="2" fill="currentColor" opacity="0.3" />
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

function ContentPanel({ data, patch }: { data: PortfolioData; patch: (p: Partial<PortfolioData>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Name" value={data.name} onChange={(v) => patch({ name: v })} />
      <Field label="Title" value={data.title} onChange={(v) => patch({ title: v })} />
      <Field label="Location" value={data.location} onChange={(v) => patch({ location: v })} />
      <Field label="Bio" value={data.bio} onChange={(v) => patch({ bio: v })} textarea />
      <Field label="Email" value={data.email} onChange={(v) => patch({ email: v })} />
      <Field label="Website" value={data.website} onChange={(v) => patch({ website: v })} />
      <Field label="GitHub handle" value={data.github} onChange={(v) => patch({ github: v })} />
      <Field
        label="Skills (comma separated)"
        value={data.skills.join(", ")}
        onChange={(v) => patch({ skills: v.split(",").map((s) => s.trim()).filter(Boolean) })}
        textarea
      />
      <ListEditor
        label="Experience"
        items={data.experience}
        onChange={(items) => patch({ experience: items })}
        fields={["role", "company", "period", "description"]}
        blank={{ role: "", company: "", period: "", description: "" }}
      />
      <ListEditor
        label="Education"
        items={data.education}
        onChange={(items) => patch({ education: items })}
        fields={["degree", "school", "period"]}
        blank={{ degree: "", school: "", period: "" }}
      />
      <ListEditor
        label="Projects"
        items={data.projects}
        onChange={(items) => patch({ projects: items })}
        fields={["name", "description", "url", "language"]}
        blank={{ name: "", description: "", url: "", language: "" }}
      />
      <ListEditor
        label="Links"
        items={data.links}
        onChange={(items) => patch({ links: items })}
        fields={["label", "url"]}
        blank={{ label: "", url: "" }}
      />
    </div>
  );
}

function Field({
  label, value, onChange, textarea,
}: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      ) : (
        <input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
      )}
    </label>
  );
}

function ListEditor<T extends Record<string, any>>({
  label, items, onChange, fields, blank,
}: {
  label: string; items: T[]; onChange: (items: T[]) => void;
  fields: (keyof T & string)[]; blank: T;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <button
          onClick={() => onChange([...items, { ...blank }])}
          className="rounded-full border border-border px-2 py-0.5 text-[10px] hover:bg-accent"
        >+ Add</button>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-md border border-border bg-background p-2">
            {fields.map((f) => (
              <input
                key={f}
                value={item[f] ?? ""}
                placeholder={f}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], [f]: e.target.value };
                  onChange(next);
                }}
                className="mb-1 w-full rounded border border-transparent bg-muted px-2 py-1 text-xs outline-none focus:border-border"
              />
            ))}
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="mt-1 text-[10px] text-destructive hover:underline"
            >Remove</button>
          </div>
        ))}
        {items.length === 0 && <div className="text-xs text-muted-foreground">Nothing yet.</div>}
      </div>
    </div>
  );
}
