import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { Logo } from "@/components/Logo";
import { parseResumeJson, sampleResumeJson } from "@/lib/parseJson";
import { parsePdfResume } from "@/lib/parsePdf";
import { extractUsername, fetchGithub } from "@/lib/github";
import { useStore, emptyPortfolio } from "@/lib/store";
import type { PortfolioData } from "@/lib/types";

export const Route = createFileRoute("/create")({ component: Create });

type ImportTab = "pdf" | "json";

// ── Drag-over hook ────────────────────────────────────────────────────────────
function useDrop(onFile: (f: File) => void, accept: string[]) {
  const [over, setOver] = useState(false);
  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setOver(true); }, []);
  const onDragLeave = useCallback(() => setOver(false), []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setOver(false);
    const f = e.dataTransfer.files[0];
    if (f && accept.some((a) => f.name.endsWith(a) || f.type.includes(a.replace(".", "")))) onFile(f);
  }, [onFile, accept]);
  return { over, onDragOver, onDragLeave, onDrop };
}

// ── File icon ─────────────────────────────────────────────────────────────────
function FileIcon({ type }: { type: "pdf" | "json" }) {
  return type === "pdf" ? (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ) : (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 13l2 2 4-4" />
    </svg>
  );
}

function Create() {
  const navigate = useNavigate();
  const setData = useStore((s) => s.setData);

  const [tab, setTab] = useState<ImportTab>("pdf");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [gh, setGh] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [step, setStep] = useState("");

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const pdfDrop = useDrop((f) => setPdfFile(f), [".pdf", "pdf"]);
  const jsonDrop = useDrop((f) => setJsonFile(f), [".json", "json"]);

  const activeFile = tab === "pdf" ? pdfFile : jsonFile;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      let parsed: Partial<PortfolioData> = {};

      if (tab === "pdf" && pdfFile) {
        setStep("Reading PDF…");
        try {
          parsed = await parsePdfResume(pdfFile);
        } catch (pdfErr: any) {
          throw new Error(`Could not parse PDF: ${pdfErr.message}. Try a text-based PDF (not a scanned image).`);
        }
      } else if (tab === "json" && jsonFile) {
        setStep("Reading JSON…");
        const text = await jsonFile.text();
        let json: any;
        try { json = JSON.parse(text); } catch {
          throw new Error("That file isn't valid JSON. Download the template below for the right shape.");
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
            const liveUrl = r.homepage?.startsWith("http") ? r.homepage : r.html_url;
            return {
              name: r.name,
              description: r.description ?? "",
              url: liveUrl,
              stars: r.stargazers_count,
              language: r.language ?? undefined,
              image: `https://image.thum.io/get/width/800/crop/450/noanimate/${encodeURIComponent(liveUrl)}`,
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
          projects: parsed.projects?.length ? parsed.projects : top,
        };
      }

      const merged: PortfolioData = { ...emptyPortfolio, ...parsed, ...ghData } as PortfolioData;
      if (!merged.name) merged.name = "Your Name";
      if (!merged.title) merged.title = "Designer & Developer";
      if (!merged.about) merged.about = merged.bio;
      setData(merged);
      sessionStorage.setItem("foliocv_from_create", "1");
      navigate({ to: "/edit" });
    } catch (e: any) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setLoading(false); setStep("");
    }
  }

  function handleSkip() {
    setData({
      ...emptyPortfolio,
      name: "Your Name",
      title: "Designer & Developer",
      bio: "A short paragraph about who you are and what you build.",
      about: "Tell visitors a bit more about your background, what you care about, and what you're working on now.",
    });
    sessionStorage.setItem("foliocv_from_create", "1");
    navigate({ to: "/edit" });
  }

  function downloadTemplate() {
    const blob = new Blob([JSON.stringify(sampleResumeJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "foliocv-resume-template.json"; a.click();
    URL.revokeObjectURL(url);
  }

  const canSubmit = !loading && (!!activeFile || !!gh.trim());

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={26} />
          <span className="font-serif text-xl">FolioCV</span>
        </Link>
        <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Skip — start blank
        </button>
      </header>

      <main className="mx-auto max-w-xl px-6 pb-24 pt-12">
        <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 1 of 2</div>
        <h1 className="font-serif text-4xl">Tell us about you</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Import your résumé — as a PDF or JSON — plus an optional GitHub handle.
          Everything is processed entirely in your browser.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">

          {/* ── Tab switcher ── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Tab headers */}
            <div className="flex border-b border-border">
              {(["pdf", "json"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-xs uppercase tracking-[0.18em] font-medium transition-colors ${
                    tab === t
                      ? "bg-background text-foreground border-b-2 border-foreground -mb-px"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "pdf" ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      PDF Résumé
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                      </svg>
                      JSON Resume
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div className="p-5">
              {tab === "pdf" ? (
                <div>
                  {/* PDF drop zone */}
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    {...pdfDrop}
                    className={`flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                      pdfDrop.over
                        ? "border-foreground bg-accent"
                        : pdfFile
                        ? "border-green-500/40 bg-green-500/5"
                        : "border-border hover:border-foreground/40 hover:bg-accent/50"
                    }`}
                  >
                    {pdfFile ? (
                      <>
                        <FileIcon type="pdf" />
                        <div>
                          <div className="text-sm font-medium text-green-400">{pdfFile.name}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{(pdfFile.size / 1024).toFixed(1)} KB · Click to change</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-background">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="12" x2="12" y2="18" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Drop your PDF résumé here</div>
                          <div className="mt-1 text-xs text-muted-foreground">or click to browse · text-based PDFs only</div>
                        </div>
                      </>
                    )}
                  </button>
                  <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} />

                  {/* Info note */}
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-muted-foreground">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Parsed entirely in your browser using <strong>pdf.js</strong> — your file is never uploaded.
                      Works best with text-based PDFs exported from Word, Google Docs, or Canva (not scanned images).
                    </p>
                  </div>

                  {/* What gets parsed */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      ["Name & title", "Detected from top of résumé"],
                      ["Contact info", "Email, GitHub, website"],
                      ["Experience", "Role, company, dates"],
                      ["Education", "Degree, school, dates"],
                      ["Skills", "Tech tags & tools"],
                      ["Projects", "Project names & descriptions"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-start gap-2">
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="mt-0.5 shrink-0 text-green-500">
                          <path d="M2 6l2.5 2.5L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div>
                          <div className="text-[11px] font-medium">{k}</div>
                          <div className="text-[10px] text-muted-foreground">{v}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  {/* JSON drop zone */}
                  <button
                    type="button"
                    onClick={() => jsonInputRef.current?.click()}
                    {...jsonDrop}
                    className={`flex w-full items-center justify-between rounded-xl border border-dashed px-5 py-6 text-left transition ${
                      jsonDrop.over
                        ? "border-foreground bg-accent"
                        : jsonFile
                        ? "border-sky-500/40 bg-sky-500/5"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {jsonFile ? <FileIcon type="json" /> : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div className="text-sm">{jsonFile ? jsonFile.name : "Drop or choose a JSON file"}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {jsonFile ? `${(jsonFile.size / 1024).toFixed(1)} KB` : "JSON Resume schema or simple flat shape"}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-full border border-border px-3 py-1 text-xs">Browse</div>
                  </button>
                  <input ref={jsonInputRef} type="file" accept="application/json,.json" className="hidden"
                    onChange={(e) => setJsonFile(e.target.files?.[0] ?? null)} />

                  <div className="mt-3 flex justify-end">
                    <button type="button" onClick={downloadTemplate}
                      className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors">
                      ↓ Download JSON template
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── GitHub ── */}
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted-foreground">GitHub (optional)</label>
            <input type="text" placeholder="github.com/yourname  or  yourname"
              value={gh} onChange={(e) => setGh(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-5 py-4 text-sm outline-none focus:border-foreground transition-colors"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              We'll fetch your top repos and take a live screenshot of each deployed project.
            </div>
          </div>

          {/* ── Error ── */}
          {err && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-destructive">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-destructive">{err}</p>
            </div>
          )}

          {/* ── CTA ── */}
          <button type="submit" disabled={!canSubmit}
            className="w-full rounded-full bg-foreground py-4 text-sm font-medium text-background transition disabled:opacity-40 hover:opacity-90"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                {step || "Building…"}
              </span>
            ) : "Generate portfolio →"}
          </button>

          {/* ── Skip ── */}
          <p className="text-center text-xs text-muted-foreground">
            No résumé handy?{" "}
            <button type="button" onClick={handleSkip} className="underline hover:text-foreground transition-colors">
              Start with a blank template
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
