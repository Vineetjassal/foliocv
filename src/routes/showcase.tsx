import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/showcase")({
  head: () => ({ meta: [{ title: "Showcase — FolioCV" }] }),
  component: Showcase,
});

const GITHUB_URL = "https://github.com/Vineetjassal/foliocv";

// ── Curated showcase entries ────────────────────────────────────────────────────────────────
const PORTFOLIOS: {
  id: string;
  name: string;
  role: string;
  template: "centered" | "split" | "editorial" | "aurora" | "minimal";
  url: string;
  github?: string;
  avatar: string;
  tags: string[];
  featured?: boolean;
}[] = [
  {
    id: "1",
    name: "Vineet Jassal",
    role: "Full-Stack Developer",
    template: "aurora",
    url: "https://tryfoliocv.vercel.app",
    github: "https://github.com/Vineetjassal",
    avatar: "https://github.com/Vineetjassal.png",
    tags: ["React", "TypeScript", "Tailwind"],
    featured: true,
  },
  {
    id: "2",
    name: "Alex Chen",
    role: "Product Designer",
    template: "minimal",
    url: "https://tryfoliocv.vercel.app",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=alexchen&backgroundColor=b6e3f4",
    tags: ["Figma", "UI/UX", "Framer"],
  },
  {
    id: "3",
    name: "Priya Sharma",
    role: "Backend Engineer",
    template: "split",
    url: "https://tryfoliocv.vercel.app",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=priyasharma&backgroundColor=c0aede",
    tags: ["Go", "Kubernetes", "PostgreSQL"],
  },
  {
    id: "4",
    name: "Marcus Webb",
    role: "ML Engineer",
    template: "editorial",
    url: "https://tryfoliocv.vercel.app",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=marcuswebb&backgroundColor=d1d4f9",
    tags: ["Python", "PyTorch", "LLMs"],
  },
  {
    id: "5",
    name: "Sofia Reyes",
    role: "Frontend Developer",
    template: "centered",
    url: "https://tryfoliocv.vercel.app",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=sofiareyes&backgroundColor=ffd5dc",
    tags: ["Vue", "Nuxt", "CSS"],
  },
  {
    id: "6",
    name: "James Park",
    role: "iOS Developer",
    template: "aurora",
    url: "https://tryfoliocv.vercel.app",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=jamespark&backgroundColor=c7f2a4",
    tags: ["Swift", "SwiftUI", "Xcode"],
  },
  {
    id: "7",
    name: "Nadia Okafor",
    role: "DevOps Engineer",
    template: "minimal",
    url: "https://tryfoliocv.vercel.app",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=nadiaokafor&backgroundColor=fde68a",
    tags: ["Docker", "AWS", "Terraform"],
  },
  {
    id: "8",
    name: "Liam Torres",
    role: "Game Developer",
    template: "split",
    url: "https://tryfoliocv.vercel.app",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=liamtorres&backgroundColor=a7f3d0",
    tags: ["Unity", "C#", "Blender"],
  },
];

const TEMPLATE_COLORS: Record<string, { bg: string; label: string }> = {
  centered: { bg: "bg-zinc-500/10 text-zinc-400", label: "Quiet" },
  split:    { bg: "bg-stone-500/10 text-stone-400", label: "Studio" },
  editorial:{ bg: "bg-amber-500/10 text-amber-400", label: "Editorial" },
  aurora:   { bg: "bg-violet-500/10 text-violet-400", label: "Aurora" },
  minimal:  { bg: "bg-sky-500/10 text-sky-400", label: "Minimal" },
};

const ALL_TAGS = Array.from(new Set(PORTFOLIOS.flatMap((p) => p.tags))).sort();
const ALL_TEMPLATES = ["centered", "split", "editorial", "aurora", "minimal"] as const;

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// ── Template mini-preview SVG ─────────────────────────────────────────────────────────────
function TemplateThumb({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 320 200" className={className} aria-hidden>
      {id === "aurora" && (
        <>
          <defs>
            <linearGradient id={`ag-${id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <rect width="320" height="200" fill="#04050d" />
          <ellipse cx="80" cy="60" rx="90" ry="70" fill="#7c3aed" opacity="0.18" />
          <ellipse cx="260" cy="140" rx="80" ry="60" fill="#0ea5e9" opacity="0.14" />
          <circle cx="60" cy="55" r="22" fill={`url(#ag-${id})`} opacity="0.9" />
          <rect x="94" y="43" width="90" height="8" rx="4" fill="#e2d9f3" opacity="0.9" />
          <rect x="94" y="57" width="60" height="5" rx="2.5" fill="#a78bfa" opacity="0.6" />
          <rect x="20" y="95" width="280" height="80" rx="10" fill="white" opacity="0.03" />
          <rect x="32" y="107" width="120" height="5" rx="2.5" fill="#a78bfa" opacity="0.5" />
          <rect x="32" y="118" width="200" height="4" rx="2" fill="#64748b" opacity="0.4" />
          <rect x="32" y="128" width="160" height="4" rx="2" fill="#64748b" opacity="0.3" />
          <rect x="32" y="143" width="60" height="18" rx="6" fill={`url(#ag-${id})`} opacity="0.7" />
        </>
      )}
      {id === "minimal" && (
        <>
          <rect width="320" height="200" fill="#fafafa" />
          <rect x="0" y="0" width="320" height="200" fill="white" />
          <rect x="28" y="28" width="120" height="10" rx="2" fill="#111" opacity="0.85" />
          <rect x="28" y="44" width="70" height="5" rx="2" fill="#888" opacity="0.6" />
          <rect x="28" y="58" width="264" height="1.5" fill="#111" opacity="0.85" />
          <rect x="28" y="72" width="160" height="5" rx="2" fill="#333" opacity="0.25" />
          <rect x="28" y="83" width="200" height="5" rx="2" fill="#333" opacity="0.2" />
          <rect x="28" y="94" width="130" height="5" rx="2" fill="#333" opacity="0.15" />
          <rect x="28" y="112" width="60" height="5" rx="2" fill="#888" opacity="0.5" />
          <rect x="28" y="123" width="140" height="4" rx="2" fill="#ccc" opacity="0.7" />
          <rect x="28" y="133" width="110" height="4" rx="2" fill="#ccc" opacity="0.5" />
          <rect x="200" y="72" width="90" height="70" rx="6" fill="#f4f4f5" opacity="0.9" />
        </>
      )}
      {id === "centered" && (
        <>
          <rect width="320" height="200" fill="#09090b" />
          <circle cx="160" cy="42" r="18" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
          <rect x="120" y="68" width="80" height="8" rx="4" fill="#e4e4e7" opacity="0.9" />
          <rect x="100" y="82" width="120" height="5" rx="2.5" fill="#71717a" opacity="0.7" />
          <rect x="60" y="102" width="200" height="4" rx="2" fill="#3f3f46" opacity="0.8" />
          <rect x="80" y="112" width="160" height="4" rx="2" fill="#3f3f46" opacity="0.5" />
          <rect x="80" y="122" width="140" height="4" rx="2" fill="#3f3f46" opacity="0.3" />
          <rect x="120" y="142" width="80" height="22" rx="11" fill="#e4e4e7" opacity="0.12" stroke="#3f3f46" strokeWidth="1" />
          <rect x="210" y="142" width="80" height="22" rx="11" fill="#e4e4e7" opacity="0.12" stroke="#3f3f46" strokeWidth="1" />
        </>
      )}
      {id === "split" && (
        <>
          <rect width="320" height="200" fill="#09090b" />
          <rect x="0" y="0" width="90" height="200" fill="#18181b" />
          <circle cx="45" cy="40" r="16" fill="#27272a" stroke="#3f3f46" strokeWidth="1.5" />
          <rect x="16" y="62" width="58" height="5" rx="2.5" fill="#e4e4e7" opacity="0.8" />
          <rect x="16" y="73" width="48" height="4" rx="2" fill="#71717a" opacity="0.6" />
          <rect x="16" y="90" width="58" height="3" rx="1.5" fill="#3f3f46" opacity="0.8" />
          <rect x="16" y="99" width="48" height="3" rx="1.5" fill="#3f3f46" opacity="0.5" />
          <rect x="16" y="108" width="52" height="3" rx="1.5" fill="#3f3f46" opacity="0.4" />
          <rect x="110" y="20" width="180" height="8" rx="4" fill="#e4e4e7" opacity="0.85" />
          <rect x="110" y="34" width="120" height="5" rx="2.5" fill="#71717a" opacity="0.6" />
          <rect x="110" y="55" width="180" height="4" rx="2" fill="#3f3f46" opacity="0.7" />
          <rect x="110" y="65" width="150" height="4" rx="2" fill="#3f3f46" opacity="0.5" />
          <rect x="110" y="85" width="60" height="4" rx="2" fill="#71717a" opacity="0.6" />
          <rect x="110" y="95" width="180" height="60" rx="6" fill="#27272a" opacity="0.7" />
        </>
      )}
      {id === "editorial" && (
        <>
          <rect width="320" height="200" fill="#fafaf9" />
          <rect x="20" y="20" width="280" height="40" rx="4" fill="#1c1917" opacity="0.85" />
          <rect x="20" y="68" width="140" height="6" rx="3" fill="#78716c" opacity="0.6" />
          <rect x="20" y="80" width="280" height="1.5" fill="#1c1917" opacity="0.15" />
          <rect x="20" y="92" width="80" height="70" rx="6" fill="#e7e5e4" opacity="0.9" />
          <rect x="110" y="92" width="80" height="70" rx="6" fill="#e7e5e4" opacity="0.7" />
          <rect x="200" y="92" width="100" height="70" rx="6" fill="#e7e5e4" opacity="0.5" />
          <rect x="20" y="172" width="120" height="4" rx="2" fill="#78716c" opacity="0.5" />
        </>
      )}
    </svg>
  );
}

// ── Submit modal ──────────────────────────────────────────────────────────────────────────────
function SubmitModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [github, setGithub] = useState("");
  const [role, setRole] = useState("");
  const [template, setTemplate] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function buildIssueUrl() {
    const title = encodeURIComponent(`[Showcase] ${name} — ${role}`);
    const body = encodeURIComponent(
`**Name:** ${name}
**Role / Title:** ${role}
**Portfolio URL:** ${url}
**GitHub:** ${github || "N/A"}
**Template used:** ${template || "Not specified"}

<!-- Add a screenshot or any notes below -->`
    );
    return `${GITHUB_URL}/issues/new?title=${title}&body=${body}&labels=showcase`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    window.open(buildIssueUrl(), "_blank", "noopener");
    setSubmitted(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <div className="font-medium">Submit your portfolio</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Get featured in the FolioCV showcase</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="font-medium text-base">GitHub issue opened!</div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your submission has been pre-filled as a GitHub issue. Once merged, your portfolio will appear in the showcase.
            </p>
            <button
              onClick={onClose}
              className="mt-2 rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background hover:opacity-90 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Your name *</label>
                <input required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Role / Title *</label>
                <input required value={role} onChange={(e) => setRole(e.target.value)}
                  placeholder="Frontend Developer"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Portfolio URL *</label>
              <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourportfolio.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">GitHub (optional)</label>
              <input value={github} onChange={(e) => setGithub(e.target.value)}
                placeholder="github.com/yourname"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Template used</label>
              <div className="flex flex-wrap gap-2">
                {ALL_TEMPLATES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemplate(t)}
                    className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                      template === t
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground"
                    }`}
                  >
                    {TEMPLATE_COLORS[t].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Clicking Submit will open a pre-filled GitHub issue. Once reviewed, your portfolio will be added to the showcase.
              </p>
            </div>
            <button
              type="submit"
              disabled={!name || !role || !url}
              className="w-full rounded-full bg-foreground py-2.5 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-40"
            >
              Submit via GitHub →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Portfolio card ───────────────────────────────────────────────────────────────────────────
function PortfolioCard({ p }: { p: (typeof PORTFOLIOS)[number] }) {
  const tc = TEMPLATE_COLORS[p.template];
  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-2xl border transition hover:border-foreground/40 hover:shadow-lg ${
      p.featured ? "border-foreground/30 bg-card" : "border-border bg-card"
    }`}>
      {p.featured && (
        <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.15em] text-background">
          <span className="h-1 w-1 rounded-full bg-background/60" />
          Featured
        </div>
      )}

      {/* Template preview */}
      <div className="relative overflow-hidden border-b border-border">
        <TemplateThumb id={p.template} className="h-44 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
        {/* Visit overlay */}
        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${p.name}'s portfolio`}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-foreground/90 px-4 py-2 text-xs font-medium text-background backdrop-blur-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View portfolio
          </span>
        </a>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <img
            src={p.avatar}
            alt={p.name}
            className="h-9 w-9 shrink-0 rounded-full border border-border object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(p.name)}`; }}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{p.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{p.role}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tc.bg}`}>
            {tc.label}
          </span>
          {p.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-full border border-border py-1.5 text-center text-[11px] font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition"
          >
            View ↗
          </a>
          {p.github && (
            <a
              href={p.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-foreground hover:text-foreground transition"
            >
              <GitHubIcon size={13} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────────────────────
function Showcase() {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: any; let killed = false;
    (async () => {
      const { gsap } = await import("gsap");
      if (killed) return;
      ctx = gsap.context(() => {
        gsap.from(".sf-fade", { y: 20, opacity: 0, duration: 0.8, ease: "expo.out", stagger: 0.07 });
      }, heroRef);
    })();
    return () => { killed = true; ctx?.revert(); };
  }, []);

  const filtered = PORTFOLIOS.filter((p) => {
    if (activeTemplate && p.template !== activeTemplate) return false;
    if (activeTag && !p.tags.includes(activeTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  });

  // Featured first
  const sorted = [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  return (
    <div className="min-h-screen bg-background text-foreground" ref={heroRef}>
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} />}

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-serif text-base">FolioCV</span>
            <span className="text-border">/</span>
            <span className="text-sm text-muted-foreground">Showcase</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/create"
              className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition"
            >
              Build yours
            </Link>
            <button
              onClick={() => setShowSubmit(true)}
              className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-90 transition"
            >
              + Submit yours
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="sf-fade mb-3 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          {PORTFOLIOS.length} portfolios &amp; counting
        </div>
        <h1 className="sf-fade font-serif text-5xl sm:text-6xl text-balance">
          Portfolios built
          <br />
          <span className="italic">with FolioCV</span>
        </h1>
        <p className="sf-fade mt-4 max-w-xl text-muted-foreground text-lg">
          Real portfolios made by real people using FolioCV. Get inspired, then build your own.
        </p>
        <div className="sf-fade mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => setShowSubmit(true)}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 transition"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Submit your portfolio
          </button>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm hover:bg-accent transition"
          >
            Build a new one →
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-[57px] z-10 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-3 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, role, tech…"
              className="w-full rounded-full border border-border bg-muted/50 py-1.5 pl-8 pr-4 text-xs outline-none focus:border-foreground"
            />
          </div>

          {/* Template filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Template:</span>
            <button
              onClick={() => setActiveTemplate(null)}
              className={`rounded-full px-2.5 py-1 text-[11px] transition ${
                !activeTemplate ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground"
              }`}
            >
              All
            </button>
            {ALL_TEMPLATES.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTemplate(activeTemplate === t ? null : t)}
                className={`rounded-full px-2.5 py-1 text-[11px] transition capitalize ${
                  activeTemplate === t ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground"
                }`}
              >
                {TEMPLATE_COLORS[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* Tag pills row */}
        <div className="mx-auto max-w-6xl px-6 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTag(null)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] transition ${
              !activeTag ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground"
            }`}
          >
            All tags
          </button>
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] transition ${
                activeTag === tag ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:border-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <div className="text-muted-foreground">No portfolios match your filters.</div>
            <button
              onClick={() => { setActiveTag(null); setActiveTemplate(null); setSearch(""); }}
              className="rounded-full border border-border px-4 py-1.5 text-xs hover:bg-accent transition"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sorted.map((p) => <PortfolioCard key={p.id} p={p} />)}

            {/* CTA card */}
            <button
              onClick={() => setShowSubmit(true)}
              className="group flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center transition hover:border-foreground/40 hover:bg-muted/50 min-h-[280px]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-muted-foreground group-hover:text-foreground transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition">Your portfolio here</div>
                <div className="mt-1 text-[11px] text-muted-foreground">Submit yours to get featured</div>
              </div>
            </button>
          </div>
        )}

        {/* Stats bar */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 border-t border-border pt-12">
          {[
            { n: PORTFOLIOS.length.toString(), label: "Portfolios" },
            { n: ALL_TEMPLATES.length.toString(), label: "Templates" },
            { n: ALL_TAGS.length.toString(), label: "Tech tags" },
            { n: "100%", label: "Browser-based" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-serif text-3xl">{s.n}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="font-serif text-4xl sm:text-5xl text-balance">
            Ready to build yours?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Free, no account needed, 100% in your browser.
          </p>
          <Link
            to="/create"
            className="mt-8 inline-block rounded-full bg-foreground px-10 py-4 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Build your portfolio →
          </Link>
        </div>
      </section>
    </div>
  );
}
