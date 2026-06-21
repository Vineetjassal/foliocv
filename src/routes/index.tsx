import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FolioCV — Resume to portfolio, in seconds" },
      {
        name: "description",
        content:
          "Upload your résumé JSON and GitHub. Get a beautiful, editable portfolio site you can download as code.",
      },
      { property: "og:title", content: "FolioCV — Resume to portfolio" },
      {
        property: "og:description",
        content:
          "Upload your résumé JSON and GitHub. Get a beautiful, editable portfolio site you can download as code.",
      },
    ],
  }),
  component: Landing,
});

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

function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let ctx: any;
    let killed = false;
    (async () => {
      const { gsap } = await import("gsap");
      if (killed) return;
      ctx = gsap.context(() => {
        // Hero entrance
        gsap.from(".m-fade", { y: 28, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.09 });

        // Rotating word animation
        const words = ["resume.", "GitHub.", "ideas.", "story.", "career."];
        let i = 0;
        const swap = () => {
          if (!wordRef.current) return;
          gsap.to(wordRef.current, {
            yPercent: -110,
            opacity: 0,
            duration: 0.38,
            ease: "power2.in",
            onComplete: () => {
              i = (i + 1) % words.length;
              if (wordRef.current) wordRef.current.textContent = words[i];
              gsap.fromTo(
                wordRef.current,
                { yPercent: 110, opacity: 0 },
                { yPercent: 0, opacity: 1, duration: 0.48, ease: "power2.out" },
              );
            },
          });
        };
        const id = setInterval(swap, 2400);
        return () => clearInterval(id);
      }, heroRef);

      // Scroll-triggered section reveals via IntersectionObserver
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.to(entry.target, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" });
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 },
      );
      document.querySelectorAll(".scroll-reveal").forEach((el) => {
        gsap.set(el, { opacity: 0, y: 32 });
        io.observe(el);
      });
    })();
    return () => {
      killed = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div
      ref={heroRef}
      className="min-h-screen grain relative overflow-hidden bg-background text-foreground"
    >
      {/* ── Nav ── */}
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2 m-fade">
          <Logo size={26} />
          <span className="font-serif text-xl tracking-tight">FolioCV</span>
        </div>
        <nav className="flex items-center gap-2 text-sm m-fade">
          <a
            href="https://github.com/vineetjassal"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <Link
            to="/create"
            className="ml-3 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            Start free
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center pt-24">
        <div className="m-fade mb-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Portfolio builder · No signup required
        </div>

        <h1 className="m-fade font-serif text-5xl leading-[1.05] text-balance sm:text-7xl">
          Turn your{" "}
          <span className="inline-block overflow-hidden align-baseline">
            <span ref={wordRef} className="inline-block italic">
              resume.
            </span>
          </span>
          <br />
          into a portfolio.
        </h1>

        <p className="m-fade mt-6 max-w-xl text-balance text-muted-foreground text-lg">
          Drop a résumé JSON, paste your GitHub handle. FolioCV crafts a quiet, beautiful portfolio
          you can tweak inline and download as plain HTML.
        </p>

        <div className="m-fade mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/create"
            className="rounded-full bg-foreground px-8 py-3.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Build mine →
          </Link>
          <a
            href="#how"
            className="rounded-full border border-border px-8 py-3.5 text-sm hover:bg-accent transition-colors"
          >
            How it works
          </a>
        </div>

        {/* Social proof */}
        <div className="m-fade mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          {[
            "No account needed",
            "100% browser-based",
            "Download clean code",
            "Dark mode included",
          ].map((f) => (
            <span key={f} className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6l2.5 2.5L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {f}
            </span>
          ))}
        </div>
      </main>

      {/* ── How it works ── */}
      <section id="how" className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
        <div className="scroll-reveal mb-12 text-center">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Simple process
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl">Three steps to live</h2>
        </div>

        <div className="scroll-reveal grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Upload",
              d: "Drop a résumé JSON file and paste your GitHub username. We read it locally — nothing leaves your browser.",
              icon: "M4 16v1a3 3 0 006 0v-1m-4-4l4-4m0 0l4 4m-4-4v12",
            },
            {
              n: "02",
              t: "Customise",
              d: "Tweak any text inline. Toggle projects. Pick from three minimal templates. Preview light and dark mode.",
              icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
            },
            {
              n: "03",
              t: "Download",
              d: "Get a zip of clean HTML, CSS & JS — yours to host anywhere. Netlify, GitHub Pages, Vercel, anywhere.",
              icon: "M4 16v1a3 3 0 006 0v-1m-4-4l4 4m0 0l4-4m-4 4V4",
            },
          ].map((s) => (
            <div key={s.n} className="bg-background p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="mono text-xs text-muted-foreground">{s.n}</span>
                <svg
                  className="text-muted-foreground"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={s.icon} />
                </svg>
              </div>
              <div className="font-serif text-2xl mb-2">{s.t}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Templates preview ── */}
      <section className="mx-auto max-w-4xl px-6 pb-24 sm:pb-32">
        <div className="scroll-reveal mb-12 text-center">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Templates
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl">Three minimal styles</h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Every template ships with a light/dark toggle and clean, semantic HTML you can extend.
          </p>
        </div>
        <div className="scroll-reveal grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { name: "Quiet", desc: "Centered & minimal", color: "from-zinc-900" },
            { name: "Studio", desc: "Sidebar + content", color: "from-stone-900" },
            { name: "Editorial", desc: "Bold serif layout", color: "from-neutral-900" },
          ].map((t) => (
            <div
              key={t.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:border-foreground/40"
            >
              <div
                className={`mb-4 h-32 w-full rounded-xl bg-gradient-to-b ${t.color} to-transparent opacity-60`}
              />
              <div className="font-serif text-xl">{t.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t.desc}</div>
              <div className="mt-4 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Preview in editor →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
          <div className="scroll-reveal mb-16 text-center">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Why FolioCV
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl">Built different</h2>
          </div>
          <div className="scroll-reveal grid grid-cols-1 gap-8 sm:grid-cols-2">
            {[
              {
                title: "100% private",
                body: "Everything runs in your browser. Your data never touches our servers. We don't have servers.",
              },
              {
                title: "Live site screenshots",
                body: "Projects show real screenshots of your deployed sites — not GitHub social previews.",
              },
              {
                title: "Yours to own",
                body: "Download clean HTML/CSS/JS with no runtime dependencies, frameworks, or build steps.",
              },
              {
                title: "jsonresume.org compatible",
                body: "Already have a JSON resume? Drop it in. FolioCV parses the standard schema automatically.",
              },
              {
                title: "Inline editing",
                body: "Tweak every word, toggle projects, rearrange sections — all in a live WYSIWYG editor.",
              },
              {
                title: "Dark mode native",
                body: "Every generated portfolio ships with a theme toggle that respects system preference.",
              },
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

      {/* ── FAQ ── */}
      <section className="border-t border-border" id="faq">
        <div className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
          <div className="scroll-reveal mb-16 text-center">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">FAQ</div>
            <h2 className="font-serif text-4xl sm:text-5xl">Common questions</h2>
          </div>
          <div className="scroll-reveal space-y-0 divide-y divide-border">
            {faqs.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32 text-center">
          <div className="scroll-reveal">
            <h2 className="font-serif text-5xl sm:text-6xl text-balance">
              Your portfolio,
              <br />
              in five minutes.
            </h2>
            <p className="mt-6 text-muted-foreground max-w-md mx-auto">
              No account. No templates to pay for. Just a quiet, beautiful portfolio that's entirely
              yours.
            </p>
            <Link
              to="/create"
              className="mt-10 inline-block rounded-full bg-foreground px-10 py-4 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Get started free →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo size={18} />
            <span>FolioCV</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Made with care · No accounts, no tracking</span>
            <a
              href="https://github.com/vineetjassal"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              @vineetjassal
            </a>
          </div>
        </div>
      </footer>

      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 500px at 50% 0%, color-mix(in oklab, var(--foreground) 6%, transparent), transparent 60%)",
        }}
      />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group py-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
      <summary className="flex items-center justify-between gap-4 font-medium text-base select-none">
        <span>{q}</span>
        <span className="shrink-0 h-6 w-6 rounded-full border border-border flex items-center justify-center text-muted-foreground transition-transform group-open:rotate-45">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </summary>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-none">{a}</p>
    </details>
  );
}
