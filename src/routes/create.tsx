import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Logo } from "@/components/Logo";
import { parseResumeJson, sampleResumeJson } from "@/lib/parseJson";
import { extractUsername, fetchGithub } from "@/lib/github";
import { useStore, emptyPortfolio } from "@/lib/store";
import type { PortfolioData } from "@/lib/types";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Start — FolioCV" },
      {
        name: "description",
        content: "Upload your résumé JSON and GitHub to generate a portfolio.",
      },
    ],
  }),
  component: Create,
});

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
            // Use live site screenshot if homepage exists, otherwise screenshot the GitHub repo page
            const liveUrl = r.homepage && r.homepage.startsWith("http") ? r.homepage : r.html_url;
            const image = `https://image.thum.io/get/width/800/crop/450/noanimate/${encodeURIComponent(liveUrl)}`;
            return {
              name: r.name,
              description: r.description ?? "",
              url: r.homepage && r.homepage.startsWith("http") ? r.homepage : r.html_url,
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
      const merged: PortfolioData = {
        ...emptyPortfolio,
        ...parsed,
        ...ghData,
      } as PortfolioData;
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
    <div className="min-h-screen grain">
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
      </main>
    </div>
  );
}
