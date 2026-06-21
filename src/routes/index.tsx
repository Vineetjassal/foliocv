import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Logo } from '@/components/Logo';

export const Route = createFileRoute('/')({ component: Landing });

const faqs = [
  { q: 'Is it really free?', a: 'Yes. No signup, no credit card, no paywalls. FolioCV runs entirely in your browser — nothing is sent to a server.' },
  { q: 'What format does the JSON need to be?', a: "We support the popular jsonresume.org schema out-of-the-box. You can also download our simple flat template if you're starting from scratch." },
  { q: 'How are my GitHub projects shown?', a: "FolioCV fetches your top public repositories and takes a live screenshot of each project's deployed site. No more generic GitHub social previews." },
  { q: 'Can I edit the portfolio after generating?', a: 'Absolutely. The editor lets you tweak every field inline — name, bio, projects, skills, experience — and toggle which projects appear.' },
  { q: 'What do I get when I download?', a: 'A clean zip of static HTML, CSS & JS you own outright. Drop it on Netlify, GitHub Pages, or any host. No lock-in.' },
  { q: 'Does it support dark mode?', a: "Every generated portfolio ships with a light/dark toggle that respects the visitor's system preference." },
];

const bondrFeatures = [
  { icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Swipe-to-match' },
  { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', label: 'Bento profiles' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Verified badges' },
  { icon: 'M15 10l4.553-2.069A1 1 0 0121 8.868V15.13a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z', label: 'Video intros' },
];

function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let ctx: any;
    let killed = false;
    (async () => {
      const { gsap } = await import('gsap');
      if (killed) return;
      ctx = gsap.context(() => {
        gsap.from('.m-fade', { y: 28, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.09 });
        const words = ['resume.', 'GitHub.', 'ideas.', 'story.', 'career.'];
        let i = 0;
        const swap = () => {
          if (!wordRef.current) return;
          gsap.to(wordRef.current, {
            yPercent: -110, opacity: 0, duration: 0.38, ease: 'power2.in',
            onComplete: () => {
              i = (i + 1) % words.length;
              if (wordRef.current) wordRef.current.textContent = words[i];
              gsap.fromTo(wordRef.current, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.48, ease: 'power2.out' });
            },
          });
        };
        const id = setInterval(swap, 2400);
        return () => clearInterval(id);
      }, heroRef);
      const io = new IntersectionObserver(
        (entries) => entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' });
            io.unobserve(entry.target);
          }
        }),
        { threshold: 0.15 }
      );
      document.querySelectorAll('.scroll-reveal').forEach((el) => {
        gsap.set(el, { opacity: 0, y: 32 });
        io.observe(el);
      });
    })();
    return () => { killed = true; ctx?.revert(); };
  }, []);

  return (
    <div ref={heroRef} className="min-h-screen relative overflow-hidden bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2 m-fade">
          <Logo size={40} />
          <span className="font-serif text-xl tracking-tight">FolioCV</span>
        </div>
        <nav className="flex items-center gap-2 text-sm m-fade">
          <a href="https://github.com/vineetjassal" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
          <Link to="/create" className="ml-3 rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity">Start free</Link>
        </nav>
      </header>

      {/* HERO */}
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center pt-24">
        <div className="m-fade mb-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Portfolio builder · No signup required
        </div>
        <h1 className="m-fade font-serif text-5xl leading-[1.05] text-balance sm:text-7xl">
          Turn your{' '}
          <span style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom', lineHeight: 'inherit', height: '1.05em' }}>
            <span ref={wordRef} style={{ display: 'inline-block' }} className="italic">resume.</span>
          </span>
          <br />into a portfolio.
        </h1>
        <p className="m-fade mt-6 max-w-xl text-balance text-muted-foreground text-lg">
          Drop a résumé JSON, paste your GitHub handle. FolioCV crafts a quiet, beautiful portfolio you can tweak inline and download as plain HTML.
        </p>
        <div className="m-fade mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link to="/create" className="rounded-full bg-foreground px-8 py-3.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98]">Build mine →</Link>
          <a href="#how" className="rounded-full border border-border px-8 py-3.5 text-sm hover:bg-accent transition-colors">How it works</a>
        </div>
        <div className="m-fade mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          {['No account needed', '100% browser-based', 'Download clean code', 'Dark mode included'].map((f) => (
            <span key={f} className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {f}
            </span>
          ))}
        </div>
      </main>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
        <div className="scroll-reveal mb-12 text-center">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Simple process</div>
          <h2 className="font-serif text-4xl sm:text-5xl">Three steps to live</h2>
        </div>
        <div className="scroll-reveal grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
          {[{n:'01',t:'Upload',d:"Drop a résumé JSON file and paste your GitHub username. We read it locally — nothing leaves your browser.",icon:'M4 16v1a3 3 0 006 0v-1m-4-4l4-4m0 0l4 4m-4-4v12'},{n:'02',t:'Customise',d:'Tweak any text inline. Toggle projects. Pick from three minimal templates. Preview light and dark mode.',icon:'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'},{n:'03',t:'Download',d:'Get a zip of clean HTML, CSS & JS — yours to host anywhere. Netlify, GitHub Pages, Vercel, anywhere.',icon:'M4 16v1a3 3 0 006 0v-1m-4-4l4 4m0 0l4-4m-4 4V4'}].map((s) => (
            <div key={s.n} className="bg-background p-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{s.n}</span>
                <svg className="text-muted-foreground" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
              </div>
              <div className="font-serif text-2xl mb-2">{s.t}</div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TEMPLATES */}
      <section className="mx-auto max-w-4xl px-6 pb-24 sm:pb-32">
        <div className="scroll-reveal mb-12 text-center">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Templates</div>
          <h2 className="font-serif text-4xl sm:text-5xl">Three minimal styles</h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">Every template ships with a light/dark toggle and clean, semantic HTML you can extend.</p>
        </div>
        <div className="scroll-reveal grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[{name:'Quiet',desc:'Centered & minimal',color:'from-zinc-900'},{name:'Studio',desc:'Sidebar + content',color:'from-stone-900'},{name:'Editorial',desc:'Bold serif layout',color:'from-neutral-900'}].map((t) => (
            <div key={t.name} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition hover:border-foreground/40">
              <div className={`mb-4 h-32 w-full rounded-xl bg-gradient-to-b ${t.color} to-transparent opacity-60`} />
              <div className="font-serif text-xl">{t.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t.desc}</div>
              <div className="mt-4 text-xs text-muted-foreground group-hover:text-foreground transition-colors">Preview in editor →</div>
            </div>
          ))}
        </div>
      </section>

      {/* BONDR ADVERTISEMENT */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
          <div className="scroll-reveal relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12">
            <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full" style={{background: 'radial-gradient(circle, oklch(0.65 0.2 340 / 0.12), transparent 70%)'}} />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full" style={{background: 'radial-gradient(circle, oklch(0.6 0.18 260 / 0.08), transparent 70%)'}} />
            <div className="relative">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" />
                Also by Vineet Jassal
              </div>
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-16 items-center">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-label="Bondr logo">
                      <rect width="36" height="36" rx="10" fill="oklch(0.55 0.22 340)" />
                      <path d="M18 27s-9-5.5-9-12a5 5 0 0110 0 5 5 0 0110 0c0 6.5-11 12-11 12z" fill="white" opacity="0.9"/>
                    </svg>
                    <span className="font-serif text-3xl tracking-tight">Bondr</span>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-2">
                    <span className="text-foreground font-medium">Hinge, but for builders.</span>
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                    Browse beautiful bento-grid developer profiles, swipe on the engineers and designers who match your vibe, and find your next co-founder. Built with React 19, Supabase, and a liquid-glass UI.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a href="https://trybondr.app" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      trybondr.app
                    </a>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-xs text-muted-foreground">Private beta</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {bondrFeatures.map((f) => (
                    <div key={f.label} className="flex flex-col gap-3 rounded-2xl border border-border bg-background/60 p-5 backdrop-blur-sm">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d={f.icon} /></svg>
                      <span className="text-sm font-medium">{f.label}</span>
                    </div>
                  ))}
                  <div className="col-span-2 rounded-2xl border border-border bg-background/60 p-4 backdrop-blur-sm">
                    <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Stack</div>
                    <div className="flex flex-wrap gap-2">
                      {['React 19', 'Supabase', 'TanStack Router', 'Tailwind v4'].map((t) => (
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
        <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32">
          <div className="scroll-reveal mb-16 text-center">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">Why FolioCV</div>
            <h2 className="font-serif text-4xl sm:text-5xl">Built different</h2>
          </div>
          <div className="scroll-reveal grid grid-cols-1 gap-8 sm:grid-cols-2">
            {[{title:'100% private',body:"Everything runs in your browser. Your data never touches our servers. We don't have servers."},{title:'Live site screenshots',body:'Projects show real screenshots of your deployed sites — not GitHub social previews.'},{title:'Yours to own',body:'Download clean HTML/CSS/JS with no runtime dependencies, frameworks, or build steps.'},{title:'jsonresume.org compatible',body:'Already have a JSON resume? Drop it in. FolioCV parses the standard schema automatically.'},{title:'Inline editing',body:'Tweak every word, toggle projects, rearrange sections — all in a live WYSIWYG editor.'},{title:'Dark mode native',body:'Every generated portfolio ships with a theme toggle that respects system preference.'}].map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-foreground/30" />
                <div><div className="font-medium mb-1">{f.title}</div><p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border" id="faq">
        <div className="mx-auto max-w-2xl px-6 py-24 sm:py-32">
          <div className="scroll-reveal mb-16 text-center">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">FAQ</div>
            <h2 className="font-serif text-4xl sm:text-5xl">Common questions</h2>
          </div>
          <div className="scroll-reveal space-y-0 divide-y divide-border">
            {faqs.map((item, i) => (
              <details key={i} className="group py-6 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between gap-4 font-medium text-base select-none">
                  <span>{item.q}</span>
                  <span className="shrink-0 h-6 w-6 rounded-full border border-border flex items-center justify-center text-muted-foreground transition-transform group-open:rotate-45">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
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
        <div className="mx-auto max-w-3xl px-6 py-24 sm:py-32 text-center">
          <div className="scroll-reveal">
            <h2 className="font-serif text-5xl sm:text-6xl text-balance">Your portfolio,<br/>in five minutes.</h2>
            <p className="mt-6 text-muted-foreground max-w-md mx-auto">No account. No templates to pay for. Just a quiet, beautiful portfolio that's entirely yours.</p>
            <Link to="/create" className="mt-10 inline-block rounded-full bg-foreground px-10 py-4 text-sm font-medium text-background transition-transform hover:scale-[1.02] active:scale-[0.98]">Get started free →</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Logo size={28} /><span>FolioCV</span></div>
          <div className="flex items-center gap-4">
            <span>Made with care · No accounts, no tracking</span>
            <a href="https://github.com/vineetjassal" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">@vineetjassal</a>
          </div>
        </div>
      </footer>

      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10" style={{background:'radial-gradient(900px 500px at 50% 0%, color-mix(in oklab, var(--foreground) 6%, transparent), transparent 60%)'}} />
    </div>
  );
}
