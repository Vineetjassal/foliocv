import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Logo } from "@/components/Logo";
import { parseResumeJson, sampleResumeJson } from "@/lib/parseJson";
import { extractUsername, fetchGithub } from "@/lib/github";
import { useStore, emptyPortfolio } from "@/lib/store";
import type { PortfolioData } from "@/lib/types";

export const Route = createFileRoute("/create")({ component: Create });

const bondrFeatures = [
  {
    icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    label: "Swipe-to-match",
  },
  {
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    label: "Bento profiles",
  },
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    label: "Verified badges",
  },
  {
    icon: "M15 10l4.553-2.069A1 1 0 0121 8.868V15.13a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z",
    label: "Video intros",
  },
];

function Create() {
  const navigate = useNavigate();
  const setData = useStore((s) => s.setData);
  const [file, setFile] = useState<File | null>(null);
  const [gh, setGh] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [step, setStep] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      let parsed: Partial<PortfolioData> = {};
      if (file) {
        setStep("Reading JSON…");
        const text = await file.text();
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(
            "That file isn't valid JSON. Download the template below for the right shape.",
          );
        }
        parsed = parseResumeJson(json);
      }
      let ghData: Partial<PortfolioData> = {};
      const ghHandle = gh.trim() ? extractUsername(gh) : (parsed.github ?? "");
      if (ghHandle) {
        setStep("Fetching GitHub…");
        const { user, repos } = await fetchGithub(ghHandle);
        const top = repos
          .filter((r) => !r.fork && !r.archived)
          .sort((a, b) => b.stargazers_count - a.stargazers_count)
          .slice(0, 12)
          .map((r) => {
            const liveUrl = r.homepage && r.homepage.startsWith("http") ? r.homepage : r.html_url;
            const image = `https://image.thum.io/get/width/800/crop/450/noanimate/${encodeURIComponent(liveUrl)}`;
            return {
              name: r.name,
              description: r.description ?? "",
              url: liveUrl,
              stars: r.stargazers_count,
              language: r.language ?? undefined,
              image,
              include: true,
            };
          });
        ghData = {
          github: user.login,
          avatar: user.avatar_url,
          name: parsed.name || user.name || user.login,
          bio: parsed.bio || user.bio || "",
          location: parsed.location || user.location || "",
          website: parsed.website || user.blog || "",
          email: parsed.email || user.email || "",
          projects: top,
        };
      }
      const merged: PortfolioData = { ...emptyPortfolio, ...parsed, ...ghData } as PortfolioData;
      if (!merged.name) merged.name = "Your Name";
      if (!merged.title) merged.title = "Designer & Developer";
      if (!merged.about) merged.about = merged.bio;
      setData(merged);
      navigate({ to: "/edit" });
    } catch (e: any) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  function handleSkip() {
    setData({
      ...emptyPortfolio,
      name: "Your Name",
      title: "Designer & Developer",
      bio: "A short paragraph about who you are and what you build.",
      about:
        "Tell visitors a bit more about your background, what you care about, and what you're working on now.",
    });
    navigate({ to: "/edit" });
  }

  function downloadTemplate() {
    const blob = new Blob([JSON.stringify(sampleResumeJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "foliocv-resume-template.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-serif text-xl">FolioCV</span>
        </Link>
        <button
          onClick={handleSkip}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Skip — start blank
        </button>
      </header>
      <main className="mx-auto max-w-xl px-6 pb-24 pt-16">
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Step 1 of 2
        </div>
        <h1 className="font-serif text-4xl">Tell us about you</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Upload a résumé JSON file and/or paste a GitHub handle. Everything is processed in your
          browser.
        </p>
        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Résumé JSON
              </label>
              <button
                type="button"
                onClick={downloadTemplate}
                className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
              >
                ↓ Download template
              </button>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-between rounded-xl border border-dashed border-border bg-card px-5 py-6 text-left transition hover:border-foreground"
            >
              <div>
                <div className="text-sm">{file ? file.name : "Drop or choose a JSON file"}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : "JSON Resume schema or simple flat shape"}
                </div>
              </div>
              <div className="rounded-full border border-border px-3 py-1 text-xs">Browse</div>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted-foreground">
              GitHub
            </label>
            <input
              type="text"
              placeholder="github.com/yourname  or  yourname"
              value={gh}
              onChange={(e) => setGh(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-5 py-4 text-sm outline-none focus:border-foreground"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              We'll fetch your top repos and take a live screenshot of each deployed project.
            </div>
          </div>
          {err && <div className="text-sm text-destructive">{err}</div>}
          <button
            type="submit"
            disabled={loading || (!file && !gh.trim())}
            className="w-full rounded-full bg-foreground py-4 text-sm font-medium text-background transition disabled:opacity-40"
          >
            {loading ? step || "Building…" : "Generate portfolio →"}
          </button>
        </form>

        {/* BONDR ADVERTISEMENT */}
        <div className="mt-16 relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full"
            style={{
              background: "radial-gradient(circle, oklch(0.65 0.2 340 / 0.12), transparent 70%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full"
            style={{
              background: "radial-gradient(circle, oklch(0.6 0.18 260 / 0.08), transparent 70%)",
            }}
          />
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
              Also by Vineet Jassal
            </div>
            <div className="flex items-center gap-3 mb-3">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none" aria-label="Bondr logo">
                <rect width="36" height="36" rx="10" fill="oklch(0.55 0.22 340)" />
                <path
                  d="M18 27s-9-5.5-9-12a5 5 0 0110 0 5 5 0 0110 0c0 6.5-11 12-11 12z"
                  fill="white"
                  opacity="0.9"
                />
              </svg>
              <span className="font-serif text-2xl tracking-tight">Bondr</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              <span className="text-foreground font-medium">Hinge, but for builders.</span>
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mb-5">
              Browse bento-grid developer profiles, swipe on engineers and designers who match your
              vibe, and find your next co-founder.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {bondrFeatures.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2.5 backdrop-blur-sm"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-muted-foreground shrink-0"
                  >
                    <path d={f.icon} />
                  </svg>
                  <span className="text-xs font-medium">{f.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://trybondr.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-xs font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                trybondr.app
              </a>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground">
                Private beta
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
