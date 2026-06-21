import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import logoUrl from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Monogram — Resume to portfolio, in seconds" },
      { name: "description", content: "Upload your CV and GitHub. Get a beautiful, editable portfolio site you can download as code." },
      { property: "og:title", content: "Monogram — Resume to portfolio" },
      { property: "og:description", content: "Upload your CV and GitHub. Get a beautiful, editable portfolio site you can download as code." },
    ],
  }),
  component: Landing,
});

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
        gsap.from(".m-fade", { y: 24, opacity: 0, duration: 0.9, ease: "expo.out", stagger: 0.08 });
        gsap.from(".m-logo", { scale: 0.6, opacity: 0, duration: 1, ease: "expo.out" });
        const words = ["resume.", "GitHub.", "ideas.", "story."];
        let i = 0;
        const swap = () => {
          if (!wordRef.current) return;
          gsap.to(wordRef.current, {
            yPercent: -100, opacity: 0, duration: 0.35, ease: "power2.in",
            onComplete: () => {
              i = (i + 1) % words.length;
              if (wordRef.current) wordRef.current.textContent = words[i];
              gsap.fromTo(wordRef.current, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "power2.out" });
            },
          });
        };
        const id = setInterval(swap, 2200);
        return () => clearInterval(id);
      }, heroRef);
    })();
    return () => { killed = true; ctx?.revert(); };
  }, []);

  return (
    <div ref={heroRef} className="min-h-screen grain relative overflow-hidden">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2 m-fade">
          <img src={logoUrl} alt="Monogram" className="h-7 w-7" />
          <span className="font-serif text-xl">Monogram</span>
        </div>
        <nav className="flex items-center gap-2 text-sm m-fade">
          <a href="https://github.com" target="_blank" rel="noopener" className="text-muted-foreground hover:text-foreground">GitHub</a>
          <Link to="/create" className="ml-3 rounded-full bg-foreground px-4 py-1.5 text-background hover:opacity-90">
            Start free
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <img src={logoUrl} alt="" className="m-logo mb-8 h-16 w-16" />
        <div className="m-fade mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Portfolio builder · No signup
        </div>
        <h1 className="m-fade font-serif text-5xl leading-[1.05] text-balance sm:text-7xl">
          Turn your{" "}
          <span className="inline-block overflow-hidden align-baseline">
            <span ref={wordRef} className="inline-block italic">resume.</span>
          </span>
          <br />
          into a portfolio.
        </h1>
        <p className="m-fade mt-6 max-w-xl text-balance text-muted-foreground">
          Drop a PDF, paste a GitHub link. Monogram crafts a quiet, beautiful site
          you can tweak inline and download as plain HTML.
        </p>
        <div className="m-fade mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/create"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
          >
            Build mine →
          </Link>
          <a href="#how" className="rounded-full border border-border px-6 py-3 text-sm hover:bg-accent">
            How it works
          </a>
        </div>

        <div id="how" className="m-fade mt-28 grid w-full grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border text-left sm:grid-cols-3">
          {[
            { n: "01", t: "Upload", d: "Drop your résumé PDF and paste your GitHub username." },
            { n: "02", t: "Edit", d: "Tweak any text inline. Pick from 3 minimal templates." },
            { n: "03", t: "Download", d: "Get a zip of clean HTML, CSS & JS — yours to host anywhere." },
          ].map((s) => (
            <div key={s.n} className="bg-background p-6">
              <div className="mono text-xs text-muted-foreground">{s.n}</div>
              <div className="mt-3 font-serif text-2xl">{s.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>

        <footer className="m-fade mt-24 mb-10 text-xs text-muted-foreground">
          Made with care · No accounts, no tracking
        </footer>
      </main>

      {/* Subtle background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 500px at 50% 0%, oklch(0.18 0 0 / 0.7), transparent 60%)",
        }}
      />
    </div>
  );
}
