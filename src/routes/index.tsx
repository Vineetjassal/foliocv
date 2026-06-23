import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({ component: Landing });

const GITHUB_URL = "https://github.com/Vineetjassal/foliocv";

const faqs = [
  {
    q: "Is it really free?",
    a: "Yes. No signup, no credit card, no paywalls. FolioCV runs entirely in your browser — nothing is sent to a server.",
  },
  {
    q: "What format does the JSON need to be?",
    a: "We support the popular jsonresume.org schema out-of-the-box. You can also download our simple flat template if you're starting from scratch.",
  },
  {
    q: "How are my GitHub projects shown?",
    a: "FolioCV fetches your top public repositories and takes a live screenshot of each project's deployed site. No more generic GitHub social previews.",
  },
  {
    q: "Can I edit the portfolio after generating?",
    a: "Absolutely. The editor lets you tweak every field inline — name, bio, projects, skills, experience — and toggle which projects appear.",
  },
  {
    q: "What do I get when I download?",
    a: "A clean zip of static HTML, CSS & JS you own outright. Drop it on Netlify, GitHub Pages, or any host. No lock-in.",
  },
  {
    q: "Does it support dark mode?",
    a: "Every generated portfolio ships with a light/dark toggle that respects the visitor's system preference.",
  },
];

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

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <Logo size={36} />
          <span className="font-serif text-lg tracking-tight">FolioCV</span>
        </div>
        <button onClick={onClose} aria-label="Close menu" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex flex-col items-start gap-6 px-8 pt-8 text-lg">
        <Link to="/showcase" onClick={onClose} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Showcase
        </Link>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" onClick={onClose}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <GitHubIcon size={16} />GitHub
        </a>
        <Link to="/create" onClick={onClose}
          className="mt-2 w-full rounded-full bg-foreground px-6 py-3 text-center text-sm font-medium text-background hover:opacity-90 transition-opacity">
          Start free →
        </Link>
      </nav>
    </div>
  );
}

function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let ctx: any;
    let killed = false;
    (async () => {
      const { gsap } = await import("gsap");
      if (killed) return;
      ctx = gsap.context(() => {
        gsap.from(".m-fade", { y: 28, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.09 });
        const words = ["resume.", "GitHub.", "ideas.", "story.", "career."];
        let i = 0;
        const swap = () => {
          if (!wordRef.current) return;
          gsap.to(wordRef.current, {
            yPercent: -110, opacity: 0, duration: 0.38, ease: "power2.in",
            onComplete: () => {
              i = (i + 1) % words.length;
              if (wordRef.current) wordRef.current.textContent = words[i];
              gsap.fromTo(wordRef.current,
                { yPercent: 110, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 0.48, ease: "power2.out" },
              );
            },
          });
        };
        const id = setInterval(swap, 2400);
        return () => clearInterval(id);
      }, heroRef);
      const io = new IntersectionObserver(
        (entries) => entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" });
            io.unobserve(entry.target);
          }
        }),
        { threshold: 0.15 },
      );
      document.querySelectorAll(".scroll-reveal").forEach((el) => {
        gsap.set(el, { opacity: 0, y: 32 });
        io.observe(el);
      });
    })();
    return () => { killed = true; ctx?.revert(); };
  }, []);

  return (
    <div ref={heroRef} className="min-h-screen relative overflow-hidden bg-background text-foreground">

      {/* Mobile fullscreen menu */}
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* HEADER */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 sm:px-10 sm:py-5">
        <div className="flex items-center gap-2 m-fade">
          <Logo size={36} />
          <span className="font-serif text-lg sm:text-xl tracking-tight">FolioCV</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2 text-sm m-fade">
          <Link
            to="/showcase"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Showcase
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <GitHubIcon size={15} />GitHub
          </a>
          <Link to="/create"
            className="ml-3 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity">
            Start free
          </Link>
        </nav>

        {/* Mobile: Start free + hamburger */}
        <div className="flex sm:hidden items-center gap-2 m-fade">
          <Link to="/create"
            className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-90 transition-opacity">
            Start free
          </Link>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* HERO */}
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-5 text-center pt-24 sm:px-6">
        <div className="m-fade mb-3">
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all backdrop-blur-sm sm:px-4">
            <GitHubIcon size={13} />
            <span className="font-medium text-foreground">Open Source</span>
            <span className="text-border hidden xs:inline">·</span>
            <span className="hidden xs:inline">Star us on GitHub</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
        <div className="m-fade mb-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-muted-foreground sm:px-4 sm:tracking-[0.2em]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Portfolio builder · No signup required
        </div>
        <h1 className="m-fade font-serif text-[2.6rem] leading-[1.05] text-balance sm:text-7xl">
          Turn your{" "}
          <span style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", lineHeight: "inherit", height: "1.05em" }}>
            <span ref={wordRef} style={{ display: "inline-block" }} className="italic">resume.</span>
          </span>
          <br />into a portfolio.
        </h1>
        <p className="m-fade mt-5 max-w-xl text-balance text-muted-foreground text-base sm:text-lg sm:mt-6">
          Drop a résumé JSON, paste your GitHub handle. FolioCV crafts a quiet, beautiful portfolio
          you can tweak inline and download as plain HTML.
        </p>

        {/* CTA buttons — stacked on mobile, row on desktop */}
        <div className="m-fade mt-8 flex flex-col items-stretch w-full max-w-xs gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-3 sm:mt-10">
          <Link to="/create"
            className="rounded-full bg-foreground px-8 py-3.5 text-sm font-medium text-background text-center transition-transform hover:scale-[1.02] active:scale-[0.98]">
            Build mine →
          </Link>
          <Link to="/showcase"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm hover:bg-accent transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            View showcase
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm hover:bg-accent transition-colors">
            <GitHubIcon size={14} />View source
          </a>
          <a href="#how"
            className="rounded-full border border-border px-8 py-3.5 text-sm text-center hover:bg-accent transition-colors">
            How it works
          </a>
        </div>

        {/* Feature pills */}
        <div className="m-fade mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:gap-6">
          {["No account needed", "100% browser-based", "Download clean code", "Dark mode included"].map((f) => (
            <span key={f} className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l2.5 2.5L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </span>
          ))}
        </div>

        {/* Peerlist badge */}
        <div className="m-fade mt-10 flex justify-center w-full overflow-hidden">
          <a href="https://peerlist.io/vineetjassal/project/foliocv--resume-to-portfolio-in-seconds" target="_blank" rel="noopener noreferrer"
            className="max-w-full">
            <img src="https://peerlist.io/api/v1/projects/embed/PRJHMQ6BELPRQNGBLHJBAEQMQPENEL?showUpvote=true&theme=dark"
              alt="FolioCV on Peerlist Launchpad"
              style={{ width: "auto", height: "64px", maxWidth: "100%" }} />
          </a>
        </div>
      </main>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-4xl px-5 py-20 sm:px-6 sm:py-32">
        <div className="scroll-reveal mb-10 text-center sm:mb-12">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Simple process</div>
          <h2 className="font-serif text-3xl sm:text-5xl">Three steps to live</h2>
        </div>
        <div className="scroll-reveal grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {[
            { n: "01", t: "Upload", d: "Drop a résumé JSON file and paste your GitHub username. We read it locally — nothing leaves your browser.", icon: "M4 16v1a3 3 0 006 0v-1m-4-4l4-4m0 0l4 4m-4-4v12" },
            { n: "02", t: "Customise", d: "Tweak any text inline. Toggle projects. Pick from five minimal templates. Preview light and dark mode.", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
            { n: "03", t: "Download", d: "Get a zip of clean HTML, CSS & JS — yours to host anywhere. Netlify, GitHub Pages, Vercel, anywhere.", icon: "M4 16v1a3 3 0 006 0v-1m-4-4l4 4m0 0l4-4m-4 4V4" },
          ].map((s) => (
            <div key={s.n} className="bg-background p-6 sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{s.n}</span>
                <svg className="text-muted-foreground" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </div>
              <div className="font-serif text-2xl mb-2">{s.t}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SHOWCASE TEASER */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-5 py-20 sm:px-6 sm:py-32">
          <div className="scroll-reveal flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div>
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Community</div>
              <h2 className="font-serif text-2xl sm:text-4xl">See what others built</h2>
              <p className="mt-3 text-muted-foreground max-w-md text-sm sm:text-base">Browse real portfolios made with FolioCV — from developers to designers to ML engineers.</p>
            </div>
            <Link to="/showcase"
              className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              View showcase →
            </Link>
          </div>
        </div>
      </section>

      {/* TEMPLATES */}
      <section className="border-t border-border mx-auto max-w-4xl px-5 pt-20 pb-20 sm:px-6 sm:pt-32 sm:pb-32">
        <div className="scroll-reveal mb-10 text-center sm:mb-12">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Templates</div>
          <h2 className="font-serif text-3xl sm:text-5xl">Five minimal styles</h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
            Every template ships with a light/dark toggle and clean, semantic HTML you can extend.
          </p>
        </div>
        <div className="scroll-reveal grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { name: "Ink",   desc: "Newspaper masthead",   color: "from-zinc-900" },
            { name: "Sheet", desc: "Swiss sidebar grid",   color: "from-stone-900" },
            { name: "Mono",  desc: "Centred timeline",     color: "from-neutral-900" },
            { name: "Paper", desc: "Notebook card layout", color: "from-zinc-800" },
            { name: "Ruled", desc: "Horizontal row rules", color: "from-stone-800" },
          ].map((t) => (
            <div key={t.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:border-foreground/40">
              <div className={`mb-4 h-24 w-full rounded-xl bg-gradient-to-b ${t.color} to-transparent opacity-60`} />
              <div className="font-serif text-lg sm:text-xl">{t.name}</div>
              <div className="mt-1 text-xs sm:text-sm text-muted-foreground">{t.desc}</div>
              <div className="mt-3 text-xs text-muted-foreground group-hover:text-foreground transition-colors">Preview →</div>
            </div>
          ))}
        </div>
      </section>

      {/* BONDR ADVERTISEMENT */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-5 py-20 sm:px-6 sm:py-32">
          <div className="scroll-reveal relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-12">
            <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full"
              style={{ background: "radial-gradient(circle, oklch(0.65 0.2 340 / 0.12), transparent 70%)" }} />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full"
              style={{ background: "radial-gradient(circle, oklch(0.6 0.18 260 / 0.08), transparent 70%)" }} />
            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
                Also by Vineet Jassal
              </div>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-16 sm:items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-label="Bondr logo">
                      <rect width="36" height="36" rx="10" fill="oklch(0.55 0.22 340)" />
                      <path d="M18 27s-9-5.5-9-12a5 5 0 0110 0 5 5 0 0110 0c0 6.5-11 12-11 12z" fill="white" opacity="0.9" />
                    </svg>
                    <span className="font-serif text-3xl tracking-tight">Bondr</span>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed mb-2">
                    <span className="text-foreground font-medium">Hinge, but for builders.</span>
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    Browse beautiful bento-grid developer profiles, swipe on the engineers and
                    designers who match your vibe, and find your next co-founder.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a href="https://trybondr.app" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      trybondr.app
                    </a>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-xs text-muted-foreground">Private beta</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {bondrFeatures.map((f) => (
                    <div key={f.label} className="flex flex-col gap-3 rounded-2xl border border-border bg-background/60 p-4 backdrop-blur-sm sm:p-5">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d={f.icon} />
                      </svg>
                      <span className="text-xs sm:text-sm font-medium">{f.label}</span>
                    </div>
                  ))}
                  <div className="col-span-2 rounded-2xl border border-border bg-background/60 p-4 backdrop-blur-sm">
                    <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Stack</div>
                    <div className="flex flex-wrap gap-2">
                      {["React 19", "Supabase", "TanStack Router", "Tailwind v4"].map((t) => (
                        <span key={t} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-5 py-20 sm:px-6 sm:py-32">
          <div className="scroll-reveal mb-12 text-center sm:mb-16">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Why FolioCV</div>
            <h2 className="font-serif text-3xl sm:text-5xl">Built different</h2>
          </div>
          <div className="scroll-reveal grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
            {[
              { title: "100% private", body: "Everything runs in your browser. Your data never touches our servers. We don't have servers." },
              { title: "Live site screenshots", body: "Projects show real screenshots of your deployed sites — not GitHub social previews." },
              { title: "Yours to own", body: "Download clean HTML/CSS/JS with no runtime dependencies, frameworks, or build steps." },
              { title: "jsonresume.org compatible", body: "Already have a JSON resume? Drop it in. FolioCV parses the standard schema automatically." },
              { title: "Inline editing", body: "Tweak every word, toggle projects, rearrange sections — all in a live WYSIWYG editor." },
              { title: "Dark mode native", body: "Every generated portfolio ships with a theme toggle that respects system preference." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-foreground/30" />
                <div>
                  <div className="font-medium mb-1">{f.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPEN SOURCE BANNER */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:px-6 sm:py-20">
          <div className="scroll-reveal flex flex-col gap-5 rounded-2xl border border-border bg-card px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 sm:py-8">
            <div className="flex items-start gap-4 sm:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                <GitHubIcon size={20} />
              </div>
              <div>
                <div className="font-medium text-base">We are open source</div>
                <p className="mt-0.5 text-sm text-muted-foreground">FolioCV is fully open source. Read the code, report issues, or contribute on GitHub.</p>
              </div>
            </div>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98] sm:shrink-0">
              <GitHubIcon size={14} />View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border" id="faq">
        <div className="mx-auto max-w-2xl px-5 py-20 sm:px-6 sm:py-32">
          <div className="scroll-reveal mb-12 text-center sm:mb-16">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">FAQ</div>
            <h2 className="font-serif text-3xl sm:text-5xl">Common questions</h2>
          </div>
          <div className="scroll-reveal space-y-0 divide-y divide-border">
            {faqs.map((item, i) => (
              <details key={i} className="group py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden sm:py-6">
                <summary className="flex items-center justify-between gap-4 font-medium text-sm sm:text-base select-none">
                  <span>{item.q}</span>
                  <span className="shrink-0 h-6 w-6 rounded-full border border-border flex items-center justify-center text-muted-foreground transition-transform group-open:rotate-45">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-6 sm:py-32">
          <div className="scroll-reveal">
            <h2 className="font-serif text-4xl sm:text-6xl text-balance">Your portfolio,<br />in five minutes.</h2>
            <p className="mt-5 text-muted-foreground max-w-md mx-auto text-sm sm:text-base sm:mt-6">
              No account. No templates to pay for. Just a quiet, beautiful portfolio that's entirely yours.
            </p>
            <Link to="/create"
              className="mt-8 inline-block rounded-full bg-foreground px-10 py-4 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98] sm:mt-10">
              Get started free →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-5 py-8 sm:flex-row sm:justify-between sm:px-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo size={26} />
            <span>FolioCV</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
            <Link to="/showcase" className="hover:text-foreground transition-colors">Showcase</Link>
            <span className="hidden sm:inline">Made with care · No accounts, no tracking</span>
            <span className="sm:hidden">No accounts, no tracking</span>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
              <GitHubIcon size={13} />Open source
            </a>
          </div>
        </div>
      </footer>

      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "radial-gradient(900px 500px at 50% 0%, color-mix(in oklab, var(--foreground) 6%, transparent), transparent 60%)" }} />
    </div>
  );
}
