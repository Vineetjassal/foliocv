import type { PortfolioData, TemplateId, Project } from "./types";

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

const visible = (projects: Project[]) =>
  projects.filter((p) => p.include !== false);

/** Merge legacy p.image into p.images array */
function allMedia(p: Project): { type: 'img' | 'video'; src: string }[] {
  const imgs: string[] = p.images?.length ? p.images : p.image ? [p.image] : [];
  const vids: string[] = p.videos ?? [];
  return [
    ...imgs.map(src => ({ type: 'img' as const, src })),
    ...vids.map(src => ({ type: 'video' as const, src })),
  ];
}

/** Returns true if the string looks like a YouTube URL */
function isYouTube(url: string) {
  return /youtu\.be\/|youtube\.com\/watch/.test(url);
}

function youTubeEmbed(url: string) {
  // Convert watch?v=ID or youtu.be/ID to embed URL
  const m = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}?rel=0` : url;
}

/** Inline JS for carousel — injected once into the page */
const carouselScript = `
<script>
(function(){
  function initCarousels() {
    document.querySelectorAll('.carousel').forEach(function(el) {
      var slides = el.querySelectorAll('.c-slide');
      var dots = el.querySelectorAll('.c-dot');
      var idx = 0;
      if (slides.length < 2) return;
      function go(n) {
        slides[idx].classList.remove('active');
        if(dots[idx]) dots[idx].classList.remove('active');
        idx = (n + slides.length) % slides.length;
        slides[idx].classList.add('active');
        if(dots[idx]) dots[idx].classList.add('active');
      }
      el.querySelector('.c-prev')?.addEventListener('click', function(e){ e.preventDefault(); go(idx-1); });
      el.querySelector('.c-next')?.addEventListener('click', function(e){ e.preventDefault(); go(idx+1); });
      dots.forEach(function(d,i){ d.addEventListener('click', function(){ go(i); }); });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarousels);
  } else {
    initCarousels();
  }
})();
</script>`;

/** CSS for carousel — added to baseCss */
const carouselCss = `
.carousel { position: relative; width: 100%; overflow: hidden; background: var(--card); }
.c-slide { display: none; }
.c-slide.active { display: block; }
.c-slide img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: var(--card); }
.c-slide video { width: 100%; aspect-ratio: 16/9; display: block; background: #000; }
.c-slide iframe { width: 100%; aspect-ratio: 16/9; display: block; border: none; }
.c-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,.55); color: #fff; border: none; cursor: pointer; border-radius: 999px; width: 28px; height: 28px; display: grid; place-items: center; font-size: 14px; z-index: 2; }
.c-prev { left: 8px; }
.c-next { right: 8px; }
.c-dots { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; z-index: 2; }
.c-dot { width: 6px; height: 6px; border-radius: 999px; background: rgba(255,255,255,.35); cursor: pointer; border: none; padding: 0; transition: background .2s; }
.c-dot.active { background: rgba(255,255,255,.9); }
.proj-links { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.proj-links a { font-size: 0.75rem; padding: 3px 10px; border: 1px solid var(--border); border-radius: 999px; color: var(--muted); transition: border-color .2s, color .2s; }
.proj-links a:hover { color: var(--fg); border-color: var(--fg); }
`;

/** Build a carousel HTML block for a project */
function carouselHtml(p: Project): string {
  const media = allMedia(p);
  if (media.length === 0) return '';

  const slideHtml = media.map((m, i) => {
    let inner = '';
    if (m.type === 'video') {
      if (isYouTube(m.src)) {
        inner = `<iframe src="${esc(youTubeEmbed(m.src))}" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>`;
      } else {
        inner = `<video controls preload="none" src="${esc(m.src)}"></video>`;
      }
    } else {
      inner = `<img loading="lazy" src="${esc(m.src)}" alt="${esc(p.name)} screenshot ${i+1}" onerror="this.parentElement.style.display='none'" />`;
    }
    return `<div class="c-slide${i === 0 ? ' active' : ''}">${inner}</div>`;
  }).join('');

  const arrows = media.length > 1
    ? `<button class="c-nav c-prev" aria-label="Previous">&#8249;</button>
       <button class="c-nav c-next" aria-label="Next">&#8250;</button>`
    : '';

  const dotsHtml = media.length > 1
    ? `<div class="c-dots">${media.map((_, i) => `<button class="c-dot${i === 0 ? ' active' : ''}" aria-label="Slide ${i+1}"></button>`).join('')}</div>`
    : '';

  return `<div class="carousel">${slideHtml}${arrows}${dotsHtml}</div>`;
}

/** Project links row */
function projLinks(p: Project): string {
  const links: string[] = [];
  if (p.url?.startsWith('http')) links.push(`<a href="${esc(p.url)}" target="_blank" rel="noopener">&nearr; Live</a>`);
  if (p.githubUrl?.startsWith('http')) links.push(`<a href="${esc(p.githubUrl)}" target="_blank" rel="noopener">&equiv; GitHub</a>`);
  return links.length ? `<div class="proj-links">${links.join('')}</div>` : '';
}

const sharedHead = (data: PortfolioData) => `
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(data.name)} — ${esc(data.title)}</title>
<meta name="description" content="${esc(data.bio).slice(0, 160)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" />
<link rel="stylesheet" href="./styles.css" />`;

const sharedThemeScript = `
<script>
  (function () {
    const saved = localStorage.getItem('theme');
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'light' || (!saved && !prefers)) document.documentElement.classList.add('light');
    window.toggleTheme = function () {
      document.documentElement.classList.toggle('light');
      localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
    };
  })();
</script>`;

const themeToggle = `
<button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
</button>`;

const baseCss = `
:root {
  --bg: #0a0a0a; --fg: #f5f5f5; --muted: #8a8a8a; --border: #1f1f1f; --card: #111;
  --accent: #f5f5f5;
}
:root.light {
  --bg: #fbfbfb; --fg: #111; --muted: #666; --border: #e6e6e6; --card: #fff;
  --accent: #111;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--bg); color: var(--fg); font-family: 'Inter', system-ui, sans-serif; -webkit-font-smoothing: antialiased; transition: background .3s, color .3s; }
a { color: inherit; text-decoration: none; border-bottom: 1px solid var(--border); transition: border-color .2s; }
a:hover { border-color: var(--fg); }
.serif { font-family: 'Instrument Serif', Georgia, serif; font-weight: 400; letter-spacing: -0.01em; }
.mono { font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; }
.muted { color: var(--muted); }
.theme-toggle {
  position: fixed; top: 24px; right: 24px; z-index: 50;
  background: var(--card); border: 1px solid var(--border); color: var(--fg);
  width: 36px; height: 36px; border-radius: 999px; display: grid; place-items: center; cursor: pointer;
  transition: transform .2s;
}
.theme-toggle:hover { transform: scale(1.06); }
.badge { display: inline-block; padding: 4px 10px; border: 1px solid var(--border); border-radius: 999px; font-size: 0.75rem; color: var(--muted); }
.reveal { opacity: 0; transform: translateY(12px); animation: reveal .7s ease forwards; }
@keyframes reveal { to { opacity: 1; transform: none; } }
.reveal:nth-child(2) { animation-delay: .08s; }
.reveal:nth-child(3) { animation-delay: .16s; }
.reveal:nth-child(4) { animation-delay: .24s; }
.reveal:nth-child(5) { animation-delay: .32s; }
${carouselCss}`;

const templateCss: Record<TemplateId, string> = {
  centered: `
.wrap { max-width: 640px; margin: 0 auto; padding: 120px 28px 96px; }
.avatar { width: 72px; height: 72px; border-radius: 999px; object-fit: cover; margin-bottom: 32px; border: 1px solid var(--border); }
h1.name { font-size: 2.2rem; letter-spacing: -0.02em; font-weight: 500; }
.title { color: var(--muted); margin-top: 6px; }
.bio { margin-top: 28px; font-size: 1.05rem; line-height: 1.6; color: var(--fg); }
.about { margin-top: 16px; font-size: 1rem; line-height: 1.7; color: var(--muted); white-space: pre-wrap; }
.section { margin-top: 56px; }
.section h2 { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); margin-bottom: 18px; font-weight: 500; }
.row { display: flex; justify-content: space-between; gap: 16px; padding: 14px 0; border-top: 1px solid var(--border); }
.row:last-child { border-bottom: 1px solid var(--border); }
.row .right { color: var(--muted); font-size: 0.9rem; white-space: nowrap; }
.row .desc { color: var(--muted); font-size: 0.9rem; margin-top: 4px; }
.proj-card { padding: 18px 0; border-top: 1px solid var(--border); }
.proj-card:last-child { border-bottom: 1px solid var(--border); }
.proj-card .carousel { border-radius: 8px; overflow: hidden; margin-bottom: 12px; border: 1px solid var(--border); }
.proj-card .body a { font-weight: 500; border-bottom: none; }
.proj-card .body a:hover { border-bottom: 1px solid var(--fg); }
.proj-card .body p { color: var(--muted); font-size: 0.9rem; margin-top: 4px; }
.proj-card .meta { color: var(--muted); font-size: 0.78rem; margin-top: 6px; font-family: 'JetBrains Mono', monospace; }
.skills { display: flex; flex-wrap: wrap; gap: 8px; }
.links { display: flex; flex-wrap: wrap; gap: 8px 18px; }
.links a { border-bottom: none; color: var(--muted); }
.links a:hover { color: var(--fg); }
`,
  split: `
.layout { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
.sidebar { padding: 56px 32px; border-right: 1px solid var(--border); position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.main { padding: 56px 56px 96px; max-width: 760px; }
.avatar { width: 84px; height: 84px; border-radius: 12px; object-fit: cover; margin-bottom: 20px; border: 1px solid var(--border); }
h1.name { font-size: 1.6rem; font-weight: 600; letter-spacing: -0.01em; }
.title { color: var(--muted); margin-top: 4px; font-size: 0.95rem; }
.bio { margin-top: 20px; font-size: 0.9rem; line-height: 1.6; color: var(--muted); }
.side-section { margin-top: 28px; }
.side-section h3 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); margin-bottom: 10px; }
.side-section a { display: block; border-bottom: none; padding: 4px 0; color: var(--fg); font-size: 0.9rem; }
.section { margin-bottom: 56px; }
.section h2 { font-size: 1.6rem; font-weight: 500; letter-spacing: -0.01em; margin-bottom: 24px; }
.about { font-size: 1rem; line-height: 1.7; color: var(--muted); white-space: pre-wrap; }
.card { padding: 20px 0; border-top: 1px solid var(--border); display: grid; grid-template-columns: 120px 1fr; gap: 24px; }
.card:last-child { border-bottom: 1px solid var(--border); }
.card .meta { color: var(--muted); font-size: 0.85rem; }
.card h4 { font-weight: 500; font-size: 1rem; }
.card .sub { color: var(--muted); font-size: 0.9rem; margin-top: 2px; }
.card p { color: var(--muted); font-size: 0.9rem; margin-top: 8px; line-height: 1.55; }
.proj-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.proj { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: border-color .2s, transform .2s; display: block; }
.proj:hover { border-color: var(--fg); transform: translateY(-2px); }
.proj .carousel { border-bottom: 1px solid var(--border); }
.proj .body { padding: 14px; }
.proj h5 { font-weight: 500; font-size: 0.95rem; }
.proj p { color: var(--muted); font-size: 0.85rem; margin-top: 6px; }
.proj .row { display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.72rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; border: none; padding: 0; }
.skills { display: flex; flex-wrap: wrap; gap: 8px; }
@media (max-width: 800px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
  .main { padding: 40px 24px 80px; }
  .card { grid-template-columns: 1fr; gap: 4px; }
}
`,
  editorial: `
.wrap { max-width: 1100px; margin: 0 auto; padding: 64px 32px 96px; }
.hero { padding: 80px 0 64px; border-bottom: 1px solid var(--border); }
.eyebrow { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.18em; color: var(--muted); }
h1.name { font-family: 'Instrument Serif', Georgia, serif; font-size: clamp(3rem, 8vw, 6rem); line-height: 1; margin-top: 18px; letter-spacing: -0.02em; font-weight: 400; }
.title { font-family: 'Instrument Serif', Georgia, serif; font-style: italic; font-size: clamp(1.4rem, 3vw, 2rem); color: var(--muted); margin-top: 8px; }
.bio { max-width: 620px; margin-top: 36px; font-size: 1.1rem; line-height: 1.6; }
.meta-row { display: flex; gap: 24px; flex-wrap: wrap; margin-top: 28px; color: var(--muted); font-size: 0.85rem; }
.grid { display: grid; grid-template-columns: 200px 1fr; gap: 56px; padding: 56px 0; border-bottom: 1px solid var(--border); }
.grid h2 { font-family: 'Instrument Serif', Georgia, serif; font-size: 1.8rem; font-weight: 400; }
.about { font-size: 1.05rem; line-height: 1.75; white-space: pre-wrap; }
.entry { padding: 14px 0; }
.entry + .entry { border-top: 1px solid var(--border); }
.entry h4 { font-size: 1.05rem; font-weight: 500; }
.entry .sub { color: var(--muted); font-size: 0.9rem; margin-top: 2px; }
.entry p { color: var(--muted); font-size: 0.92rem; margin-top: 8px; line-height: 1.55; }
.proj-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }
.proj { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; transition: border-color .2s, transform .2s; display: block; }
.proj:hover { border-color: var(--fg); transform: translateY(-2px); }
.proj .carousel { border-bottom: 1px solid var(--border); }
.proj .body { padding: 16px; }
.proj h5 { font-weight: 500; font-size: 0.95rem; }
.proj p { color: var(--muted); font-size: 0.85rem; margin-top: 6px; min-height: 40px; }
.proj .row { display: flex; justify-content: space-between; margin-top: 12px; font-size: 0.72rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; border: none; padding: 0; }
.skills { display: flex; flex-wrap: wrap; gap: 8px; }
@media (max-width: 760px) { .grid { grid-template-columns: 1fr; gap: 20px; padding: 40px 0; } }
`,
};

// ── Project card builders using carousel ─────────────────────────────────────

function projCardCentered(p: Project) {
  const media = allMedia(p);
  return `<div class="proj-card">
    ${carouselHtml(p)}
    <div class="body">
      <a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a>
      ${p.description ? `<p>${esc(p.description)}</p>` : ""}
      <div class="meta">${p.language ? esc(p.language) : ""}${p.stars ? `  ★ ${p.stars}` : ""}</div>
      ${projLinks(p)}
    </div>
  </div>`;
}

function projCardGrid(p: Project) {
  return `<div class="proj">
    ${carouselHtml(p)}
    <div class="body">
      <h5>${esc(p.name)}</h5>
      ${p.description ? `<p>${esc(p.description)}</p>` : ""}
      <div class="row"><span>${p.language ? esc(p.language) : ""}</span><span>${p.stars ? `★ ${p.stars}` : ""}</span></div>
      ${projLinks(p)}
    </div>
  </div>`;
}

// ── Template HTML builders ────────────────────────────────────────────────────

function centeredHtml(d: PortfolioData) {
  const projects = visible(d.projects);
  return `<div class="wrap">
  ${d.avatar ? `<img class="avatar reveal" src="${esc(d.avatar)}" alt="${esc(d.name)}" />` : ""}
  <div class="reveal">
    <h1 class="name serif">${esc(d.name)}</h1>
    <div class="title">${esc(d.title)}${d.location ? ` · ${esc(d.location)}` : ""}</div>
  </div>
  ${d.bio ? `<p class="bio reveal">${esc(d.bio)}</p>` : ""}
  ${d.about ? `<section class="section reveal"><h2>About</h2><p class="about">${esc(d.about)}</p></section>` : ""}
  ${d.experience.length ? `<section class="section reveal">
    <h2>Work</h2>
    ${d.experience.map((e) => `<div class="row"><div><div>${esc(e.role)}</div><div class="desc">${esc(e.company)}${e.description ? ` — ${esc(e.description)}` : ""}</div></div><div class="right mono">${esc(e.period)}</div></div>`).join("")}
  </section>` : ""}
  ${projects.length ? `<section class="section reveal">
    <h2>Projects</h2>
    ${projects.slice(0, 8).map(projCardCentered).join("")}
  </section>` : ""}
  ${d.education.length ? `<section class="section reveal">
    <h2>Education</h2>
    ${d.education.map((e) => `<div class="row"><div><div>${esc(e.degree)}</div><div class="desc">${esc(e.school)}</div></div><div class="right mono">${esc(e.period)}</div></div>`).join("")}
  </section>` : ""}
  ${d.skills.length ? `<section class="section reveal">
    <h2>Skills</h2>
    <div class="skills">${d.skills.map((s) => `<span class="badge">${esc(s)}</span>`).join("")}</div>
  </section>` : ""}
  <section class="section reveal">
    <h2>Elsewhere</h2>
    <div class="links">
      ${d.email ? `<a href="mailto:${esc(d.email)}">Email</a>` : ""}
      ${d.github ? `<a href="https://github.com/${esc(d.github)}" target="_blank" rel="noopener">GitHub</a>` : ""}
      ${d.website ? `<a href="${esc(d.website)}" target="_blank" rel="noopener">Website</a>` : ""}
      ${d.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}
    </div>
  </section>
</div>`;
}

function splitHtml(d: PortfolioData) {
  const projects = visible(d.projects);
  return `<div class="layout">
  <aside class="sidebar">
    ${d.avatar ? `<img class="avatar" src="${esc(d.avatar)}" alt="${esc(d.name)}" />` : ""}
    <h1 class="name">${esc(d.name)}</h1>
    <div class="title">${esc(d.title)}</div>
    ${d.location ? `<div class="title">${esc(d.location)}</div>` : ""}
    ${d.bio ? `<p class="bio">${esc(d.bio)}</p>` : ""}
    <div class="side-section">
      <h3>Contact</h3>
      ${d.email ? `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>` : ""}
      ${d.github ? `<a href="https://github.com/${esc(d.github)}" target="_blank" rel="noopener">github.com/${esc(d.github)}</a>` : ""}
      ${d.website ? `<a href="${esc(d.website)}" target="_blank" rel="noopener">${esc(d.website)}</a>` : ""}
      ${d.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}
    </div>
  </aside>
  <main class="main">
    ${d.about ? `<section class="section reveal"><h2 class="serif">About</h2><p class="about">${esc(d.about)}</p></section>` : ""}
    ${d.experience.length ? `<section class="section reveal">
      <h2 class="serif">Experience</h2>
      ${d.experience.map((e) => `<div class="card"><div class="meta mono">${esc(e.period)}</div><div><h4>${esc(e.role)}</h4><div class="sub">${esc(e.company)}</div>${e.description ? `<p>${esc(e.description)}</p>` : ""}</div></div>`).join("")}
    </section>` : ""}
    ${projects.length ? `<section class="section reveal">
      <h2 class="serif">Projects</h2>
      <div class="proj-grid">${projects.slice(0, 9).map(projCardGrid).join("")}</div>
    </section>` : ""}
    ${d.education.length ? `<section class="section reveal">
      <h2 class="serif">Education</h2>
      ${d.education.map((e) => `<div class="card"><div class="meta mono">${esc(e.period)}</div><div><h4>${esc(e.degree)}</h4><div class="sub">${esc(e.school)}</div></div></div>`).join("")}
    </section>` : ""}
    ${d.skills.length ? `<section class="section reveal">
      <h2 class="serif">Skills</h2>
      <div class="skills">${d.skills.map((s) => `<span class="badge">${esc(s)}</span>`).join("")}</div>
    </section>` : ""}
  </main>
</div>`;
}

function editorialHtml(d: PortfolioData) {
  const projects = visible(d.projects);
  return `<div class="wrap">
  <header class="hero">
    <div class="eyebrow reveal">Portfolio · ${new Date().getFullYear()}</div>
    <h1 class="name reveal">${esc(d.name)}</h1>
    <div class="title reveal">${esc(d.title)}</div>
    ${d.bio ? `<p class="bio reveal">${esc(d.bio)}</p>` : ""}
    <div class="meta-row reveal">
      ${d.location ? `<span>${esc(d.location)}</span>` : ""}
      ${d.email ? `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>` : ""}
      ${d.github ? `<a href="https://github.com/${esc(d.github)}" target="_blank" rel="noopener">github.com/${esc(d.github)}</a>` : ""}
      ${d.website ? `<a href="${esc(d.website)}" target="_blank" rel="noopener">${esc(d.website)}</a>` : ""}
    </div>
  </header>
  ${d.about ? `<section class="grid"><h2>About</h2><div><p class="about">${esc(d.about)}</p></div></section>` : ""}
  ${d.experience.length ? `<section class="grid">
    <h2>Selected<br/>work</h2>
    <div>${d.experience.map((e) => `<div class="entry"><h4>${esc(e.role)} <span class="mono muted"> · ${esc(e.period)}</span></h4><div class="sub">${esc(e.company)}</div>${e.description ? `<p>${esc(e.description)}</p>` : ""}</div>`).join("")}</div>
  </section>` : ""}
  ${projects.length ? `<section class="grid">
    <h2>Projects</h2>
    <div class="proj-grid">${projects.slice(0, 12).map(projCardGrid).join("")}</div>
  </section>` : ""}
  ${d.education.length ? `<section class="grid">
    <h2>Education</h2>
    <div>${d.education.map((e) => `<div class="entry"><h4>${esc(e.degree)}</h4><div class="sub">${esc(e.school)} · ${esc(e.period)}</div></div>`).join("")}</div>
  </section>` : ""}
  ${d.skills.length ? `<section class="grid">
    <h2>Toolkit</h2>
    <div class="skills">${d.skills.map((s) => `<span class="badge">${esc(s)}</span>`).join("")}</div>
  </section>` : ""}
  ${d.links.length ? `<section class="grid">
    <h2>Elsewhere</h2>
    <div>${d.links.map((l) => `<div class="entry"><h4><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></h4></div>`).join("")}</div>
  </section>` : ""}
</div>`;
}

export function buildSite(data: PortfolioData, template: TemplateId): { html: string; css: string } {
  const body =
    template === "centered" ? centeredHtml(data) :
    template === "split" ? splitHtml(data) : editorialHtml(data);
  const html = `<!doctype html>
<html lang="en">
<head>${sharedHead(data)}${sharedThemeScript}</head>
<body>
${themeToggle}
${body}
${carouselScript}
</body>
</html>`;
  const css = baseCss + templateCss[template];
  return { html, css };
}
