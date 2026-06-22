import type { PortfolioData, TemplateId } from "./types";

// ── Shared gallery carousel HTML generator ────────────────────────────────────
function gallerySection(images: string[]): string {
  if (!images || images.length === 0) return "";
  const dots = images
    .map(
      (_, i) =>
        `<button class="gallery-dot${i === 0 ? " active" : ""}" onclick="galleryGoTo(${i})" aria-label="Image ${i + 1}"></button>`,
    )
    .join("");
  const imgs = images
    .map(
      (src, i) =>
        `<img src="${src}" alt="Gallery image ${i + 1}" class="gallery-img${i === 0 ? " active" : ""}" loading="lazy" />`,
    )
    .join("");
  return `
<section class="gallery-section">
  <h2 class="section-title">Gallery</h2>
  <div class="gallery-carousel" id="galleryCarousel">
    <div class="gallery-track">${imgs}</div>
    <button class="gallery-btn gallery-prev" onclick="galleryPrev()" aria-label="Previous">&#8249;</button>
    <button class="gallery-btn gallery-next" onclick="galleryNext()" aria-label="Next">&#8250;</button>
    <div class="gallery-counter" id="galleryCounter">1 / ${images.length}</div>
    <div class="gallery-dots" id="galleryDots">${dots}</div>
  </div>
</section>
<script>
(function(){
  var imgs = document.querySelectorAll('.gallery-img');
  var dots = document.querySelectorAll('.gallery-dot');
  var counter = document.getElementById('galleryCounter');
  var cur = 0;
  function show(n){
    imgs[cur].classList.remove('active');
    dots[cur].classList.remove('active');
    cur = (n + imgs.length) % imgs.length;
    imgs[cur].classList.add('active');
    dots[cur].classList.add('active');
    if(counter) counter.textContent = (cur+1) + ' / ' + imgs.length;
  }
  window.galleryGoTo = show;
  window.galleryPrev = function(){ show(cur - 1); };
  window.galleryNext = function(){ show(cur + 1); };
  document.addEventListener('keydown', function(e){
    if(e.key==='ArrowLeft') window.galleryPrev();
    if(e.key==='ArrowRight') window.galleryNext();
  });
  var ts=0;
  document.getElementById('galleryCarousel').addEventListener('touchstart',function(e){ts=e.touches[0].clientX;},{passive:true});
  document.getElementById('galleryCarousel').addEventListener('touchend',function(e){
    var dx=e.changedTouches[0].clientX-ts;
    if(Math.abs(dx)>40){if(dx<0)window.galleryNext();else window.galleryPrev();}
  },{passive:true});
})();
<\/script>`;
}

const galleryCss = `
/* ── Profile Gallery Carousel ─────────────────────────── */
.gallery-section { margin-block: 3rem; }
.gallery-carousel {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
  background: var(--c-surface, #111);
  aspect-ratio: 16/9;
  max-height: 520px;
  user-select: none;
}
.gallery-track { position: relative; width: 100%; height: 100%; }
.gallery-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}
.gallery-img.active { opacity: 1; pointer-events: auto; }
.gallery-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.55);
  color: #fff;
  border: none;
  border-radius: 9999px;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.gallery-btn:hover { background: rgba(0,0,0,0.8); }
.gallery-prev { left: 0.75rem; }
.gallery-next { right: 0.75rem; }
.gallery-counter {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(0,0,0,0.55);
  color: #fff;
  border-radius: 9999px;
  font-size: 0.7rem;
  padding: 0.2rem 0.6rem;
  z-index: 2;
  letter-spacing: 0.05em;
}
.gallery-dots {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.4rem;
  z-index: 2;
}
.gallery-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: rgba(255,255,255,0.4);
  border: none;
  cursor: pointer;
  transition: width 0.2s, background 0.2s;
  padding: 0;
}
.gallery-dot.active {
  width: 1.25rem;
  background: #fff;
}
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(s: string | undefined | null): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function skillBadges(skills: string[]): string {
  return (skills ?? [])
    .map((s) => `<span class="skill-badge">${esc(s)}</span>`)
    .join("");
}

function projectCards(data: PortfolioData): string {
  return (data.projects ?? [])
    .filter((p) => p.include !== false)
    .map((p) => {
      const allImgs = p.images?.length ? p.images : p.image ? [p.image] : [];
      const imgHtml =
        allImgs.length > 0
          ? `<img src="${esc(allImgs[0])}" alt="${esc(p.name)}" class="project-img" loading="lazy" />`
          : "";
      return `
<div class="project-card">
  ${imgHtml}
  <div class="project-body">
    <div class="project-title">${esc(p.name)}</div>
    ${p.description ? `<div class="project-desc">${esc(p.description)}</div>` : ""}
    ${p.language ? `<div class="project-lang">${esc(p.language)}</div>` : ""}
    <div class="project-links">
      ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">Live ↗</a>` : ""}
      ${p.githubUrl ? `<a href="${esc(p.githubUrl)}" target="_blank" rel="noopener">GitHub ↗</a>` : ""}
    </div>
  </div>
</div>`;
    })
    .join("");
}

function expItems(data: PortfolioData): string {
  return (data.experience ?? [])
    .map(
      (e) => `
<div class="exp-item">
  <div class="exp-row"><span class="exp-role">${esc(e.role)}</span><span class="exp-period">${esc(e.period)}</span></div>
  <div class="exp-company">${esc(e.company)}</div>
  ${e.description ? `<div class="exp-desc">${esc(e.description)}</div>` : ""}
</div>`,
    )
    .join("");
}

function eduItems(data: PortfolioData): string {
  return (data.education ?? [])
    .map(
      (e) => `
<div class="edu-item">
  <div class="edu-row"><span class="edu-degree">${esc(e.degree)}</span><span class="edu-period">${esc(e.period)}</span></div>
  <div class="edu-school">${esc(e.school)}</div>
</div>`,
    )
    .join("");
}

function socialLinks(data: PortfolioData): string {
  const items = [];
  if (data.email) items.push(`<a href="mailto:${esc(data.email)}">Email</a>`);
  if (data.website) items.push(`<a href="${esc(data.website)}" target="_blank" rel="noopener">Website</a>`);
  if (data.github) items.push(`<a href="https://github.com/${esc(data.github)}" target="_blank" rel="noopener">GitHub</a>`);
  (data.links ?? []).forEach((l) => {
    if (l.url) items.push(`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label) || "Link"}</a>`);
  });
  return items.join("");
}

const baseCss = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6}
img{display:block;max-width:100%;height:auto}
a{color:inherit;text-decoration:none}
a:hover{text-decoration:underline}
.skill-badge{display:inline-block;border:1px solid currentColor;border-radius:9999px;padding:.15em .7em;font-size:.7rem;opacity:.7;margin:.15rem}
.project-card{border:1px solid var(--c-border,rgba(128,128,128,.2));border-radius:.75rem;overflow:hidden;transition:transform .2s,box-shadow .2s}
.project-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.15)}
.project-img{width:100%;height:160px;object-fit:cover}
.project-body{padding:1rem}
.project-title{font-weight:600;margin-bottom:.25rem}
.project-desc{font-size:.85rem;opacity:.7;margin-bottom:.5rem}
.project-lang{font-size:.75rem;opacity:.5;margin-bottom:.5rem;font-family:monospace}
.project-links{display:flex;gap:.75rem;font-size:.8rem;opacity:.8}
.exp-item,.edu-item{border-bottom:1px solid var(--c-border,rgba(128,128,128,.15));padding:.75rem 0}
.exp-item:last-child,.edu-item:last-child{border-bottom:none}
.exp-row,.edu-row{display:flex;justify-content:space-between;align-items:baseline;gap:.5rem}
.exp-role,.edu-degree{font-weight:600;font-size:.9rem}
.exp-period,.edu-period{font-size:.75rem;opacity:.5;white-space:nowrap}
.exp-company,.edu-school{font-size:.85rem;opacity:.7;margin:.1rem 0}
.exp-desc{font-size:.82rem;opacity:.6;margin-top:.35rem}
.social-links{display:flex;flex-wrap:wrap;gap:.5rem 1rem;font-size:.82rem;opacity:.7}
.section-title{font-size:.7rem;text-transform:uppercase;letter-spacing:.18em;opacity:.5;margin-bottom:1.25rem}
${galleryCss}
`;

// ── Centered (Quiet) template ────────────────────────────────────────────────
function buildCentered(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body class="centered-body">
<main class="centered-main">
  ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="centered-avatar" loading="eager" />` : ""}
  <h1 class="centered-name">${esc(data.name)}</h1>
  ${data.title ? `<div class="centered-title">${esc(data.title)}</div>` : ""}
  ${data.location ? `<div class="centered-location">${esc(data.location)}</div>` : ""}
  ${data.bio ? `<p class="centered-bio">${esc(data.bio)}</p>` : ""}
  <div class="social-links centered-links">${socialLinks(data)}</div>

  ${gallery}

  ${data.about ? `<section class="centered-section"><h2 class="section-title">About</h2><p class="centered-about">${esc(data.about)}</p></section>` : ""}

  ${data.skills?.length ? `<section class="centered-section"><h2 class="section-title">Skills</h2><div>${skillBadges(data.skills)}</div></section>` : ""}

  ${data.experience?.length ? `<section class="centered-section"><h2 class="section-title">Experience</h2>${expItems(data)}</section>` : ""}

  ${data.education?.length ? `<section class="centered-section"><h2 class="section-title">Education</h2>${eduItems(data)}</section>` : ""}

  ${data.projects?.filter((p) => p.include !== false).length ? `<section class="centered-section"><h2 class="section-title">Projects</h2><div class="project-grid">${projectCards(data)}</div></section>` : ""}
</main>
</body>
</html>`;

  const css = baseCss + `
body.centered-body{background:#0d0d0d;color:#e8e6e1}
body.light.centered-body{background:#faf9f7;color:#1a1a1a}
.centered-main{max-width:640px;margin:0 auto;padding:4rem 1.5rem 6rem}
.centered-avatar{width:72px;height:72px;border-radius:50%;object-fit:cover;margin:0 auto 1.5rem}
.centered-name{font-family:'EB Garamond',Georgia,serif;font-size:clamp(2rem,5vw,3rem);font-weight:400;text-align:center;letter-spacing:-.02em;margin-bottom:.35rem}
.centered-title{text-align:center;font-size:.85rem;opacity:.55;letter-spacing:.08em;text-transform:uppercase;margin-bottom:.2rem}
.centered-location{text-align:center;font-size:.8rem;opacity:.4;margin-bottom:.75rem}
.centered-bio{text-align:center;font-size:1rem;opacity:.7;max-width:48ch;margin:0 auto 1.5rem;line-height:1.65}
.centered-links{justify-content:center;margin-bottom:2.5rem}
.centered-section{margin-bottom:2.5rem}
.centered-about{font-size:.95rem;opacity:.75;line-height:1.8;max-width:64ch}
.project-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem}
`;

  return { html, css };
}

// ── Split (Studio) template ──────────────────────────────────────────────────
function buildSplit(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body class="split-body">
<div class="split-layout">
  <aside class="split-sidebar">
    ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="split-avatar" loading="eager" />` : ""}
    <h1 class="split-name">${esc(data.name)}</h1>
    ${data.title ? `<div class="split-title">${esc(data.title)}</div>` : ""}
    ${data.location ? `<div class="split-location">${esc(data.location)}</div>` : ""}
    ${data.bio ? `<p class="split-bio">${esc(data.bio)}</p>` : ""}
    <nav class="social-links split-links">${socialLinks(data)}</nav>
    ${data.skills?.length ? `<div class="split-skills-section"><div class="section-title">Skills</div>${skillBadges(data.skills)}</div>` : ""}
  </aside>
  <main class="split-content">
    ${gallery}
    ${data.about ? `<section class="split-section"><h2 class="section-title">About</h2><p class="split-about">${esc(data.about)}</p></section>` : ""}
    ${data.experience?.length ? `<section class="split-section"><h2 class="section-title">Experience</h2>${expItems(data)}</section>` : ""}
    ${data.education?.length ? `<section class="split-section"><h2 class="section-title">Education</h2>${eduItems(data)}</section>` : ""}
    ${data.projects?.filter((p) => p.include !== false).length ? `<section class="split-section"><h2 class="section-title">Projects</h2><div class="project-grid">${projectCards(data)}</div></section>` : ""}
  </main>
</div>
</body>
</html>`;

  const css = baseCss + `
body.split-body{background:#0c0c0c;color:#dbd9d4;min-height:100vh}
body.light.split-body{background:#f7f6f4;color:#1c1b18}
.split-layout{display:grid;grid-template-columns:280px 1fr;min-height:100vh}
@media(max-width:768px){.split-layout{grid-template-columns:1fr}}
.split-sidebar{position:sticky;top:0;height:100vh;overflow-y:auto;padding:2.5rem 1.75rem;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:.5rem}
body.light .split-sidebar{border-right-color:rgba(0,0,0,.08)}
.split-avatar{width:64px;height:64px;border-radius:.5rem;object-fit:cover;margin-bottom:.75rem}
.split-name{font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:700;letter-spacing:-.02em;line-height:1.2;margin-bottom:.2rem}
.split-title{font-size:.75rem;text-transform:uppercase;letter-spacing:.12em;opacity:.45;margin-bottom:.15rem}
.split-location{font-size:.78rem;opacity:.35;margin-bottom:.75rem}
.split-bio{font-size:.85rem;opacity:.65;line-height:1.65;margin-bottom:1rem}
.split-links{flex-direction:column;gap:.35rem;margin-bottom:1.25rem}
.split-skills-section{margin-top:auto;padding-top:1.5rem}
.split-content{padding:3rem 2.5rem;max-width:800px}
@media(max-width:768px){.split-content{padding:2rem 1.5rem}}
.split-section{margin-bottom:3rem}
.split-about{font-size:.95rem;opacity:.75;line-height:1.8;max-width:60ch}
.project-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem}
--c-border: rgba(255,255,255,.1);
`;

  return { html, css };
}

// ── Editorial template ────────────────────────────────────────────────────────
function buildEditorial(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
</head>
<body class="ed-body">
<header class="ed-header">
  <div class="ed-header-inner">
    <div class="ed-header-text">
      <h1 class="ed-name">${esc(data.name)}</h1>
      ${data.title ? `<div class="ed-title">${esc(data.title)}</div>` : ""}
      ${data.bio ? `<p class="ed-bio">${esc(data.bio)}</p>` : ""}
      <nav class="social-links ed-links">${socialLinks(data)}</nav>
    </div>
    ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="ed-avatar" loading="eager" />` : ""}
  </div>
</header>
<main class="ed-main">
  ${gallery}
  <div class="ed-grid">
    ${data.about ? `<section class="ed-section ed-span2"><h2 class="section-title">About</h2><p class="ed-about">${esc(data.about)}</p></section>` : ""}
    ${data.skills?.length ? `<section class="ed-section"><h2 class="section-title">Skills</h2><div>${skillBadges(data.skills)}</div></section>` : ""}
    ${data.experience?.length ? `<section class="ed-section ed-span2"><h2 class="section-title">Experience</h2>${expItems(data)}</section>` : ""}
    ${data.education?.length ? `<section class="ed-section"><h2 class="section-title">Education</h2>${eduItems(data)}</section>` : ""}
  </div>
  ${data.projects?.filter((p) => p.include !== false).length ? `<section class="ed-projects"><h2 class="section-title">Projects</h2><div class="project-grid">${projectCards(data)}</div></section>` : ""}
</main>
</body>
</html>`;

  const css = baseCss + `
body.ed-body{background:#f9f7f3;color:#1a1814;min-height:100vh}
body.light.ed-body{background:#f9f7f3;color:#1a1814}
.ed-header{background:#1a1814;color:#f0ede8;padding:4rem 0 3rem}
.ed-header-inner{max-width:1100px;margin:0 auto;padding:0 2rem;display:flex;align-items:flex-start;gap:2.5rem;justify-content:space-between}
.ed-header-text{flex:1}
.ed-name{font-family:'Playfair Display',Georgia,serif;font-size:clamp(2.5rem,6vw,5rem);font-weight:700;letter-spacing:-.03em;line-height:1.05;margin-bottom:.4rem}
.ed-title{font-size:.8rem;text-transform:uppercase;letter-spacing:.2em;opacity:.5;margin-bottom:1rem}
.ed-bio{font-size:1.05rem;opacity:.7;max-width:52ch;line-height:1.7;margin-bottom:1.25rem}
.ed-links{opacity:.7}
.ed-avatar{width:140px;height:140px;border-radius:.5rem;object-fit:cover;flex-shrink:0}
.ed-main{max-width:1100px;margin:0 auto;padding:3rem 2rem 5rem}
.ed-grid{display:grid;grid-template-columns:1fr 1fr;gap:2.5rem 3rem;margin-bottom:3rem}
@media(max-width:768px){.ed-grid{grid-template-columns:1fr}}
.ed-section{}
.ed-span2{grid-column:span 2}
@media(max-width:768px){.ed-span2{grid-column:span 1}}
.ed-about{font-size:1rem;line-height:1.8;opacity:.8;max-width:64ch}
.ed-projects{margin-top:1rem}
.project-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem;margin-top:1rem}
`;

  return { html, css };
}

// ── Aurora template (dark gradient + glassmorphism) ───────────────────────────
function buildAurora(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital@0;1&display=swap" rel="stylesheet">
</head>
<body class="aurora-body">
  <div class="aurora-bg">
    <div class="aurora-orb aurora-orb1"></div>
    <div class="aurora-orb aurora-orb2"></div>
    <div class="aurora-orb aurora-orb3"></div>
  </div>
  <div class="aurora-wrap">
    <header class="aurora-hero">
      ${data.avatar ? `<div class="aurora-avatar-ring"><img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="aurora-avatar" loading="eager" /></div>` : ""}
      <div class="aurora-hero-text">
        <h1 class="aurora-name">${esc(data.name)}</h1>
        ${data.title ? `<div class="aurora-role">${esc(data.title)}</div>` : ""}
        ${data.location ? `<div class="aurora-location">📍 ${esc(data.location)}</div>` : ""}
        ${data.bio ? `<p class="aurora-bio">${esc(data.bio)}</p>` : ""}
        <div class="social-links aurora-links">${socialLinks(data)}</div>
      </div>
    </header>

    ${gallery}

    ${data.about ? `
    <section class="aurora-card">
      <h2 class="aurora-section-title">About</h2>
      <p class="aurora-about">${esc(data.about)}</p>
    </section>` : ""}

    ${data.skills?.length ? `
    <section class="aurora-card">
      <h2 class="aurora-section-title">Skills</h2>
      <div class="aurora-skills">${skillBadges(data.skills)}</div>
    </section>` : ""}

    ${data.experience?.length ? `
    <section class="aurora-card">
      <h2 class="aurora-section-title">Experience</h2>
      ${expItems(data)}
    </section>` : ""}

    ${data.education?.length ? `
    <section class="aurora-card">
      <h2 class="aurora-section-title">Education</h2>
      ${eduItems(data)}
    </section>` : ""}

    ${data.projects?.filter((p) => p.include !== false).length ? `
    <section class="aurora-card">
      <h2 class="aurora-section-title">Projects</h2>
      <div class="aurora-project-grid">${projectCards(data)}</div>
    </section>` : ""}
  </div>
</body>
</html>`;

  const css = baseCss + `
body.aurora-body {
  background: #04050d;
  color: #e2e8f0;
  min-height: 100vh;
  font-family: 'Space Grotesk', sans-serif;
  overflow-x: hidden;
}
.aurora-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.aurora-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.18;
  animation: aurora-drift 14s ease-in-out infinite alternate;
}
.aurora-orb1 { width: 600px; height: 600px; background: #7c3aed; top: -150px; left: -150px; animation-delay: 0s; }
.aurora-orb2 { width: 500px; height: 500px; background: #0ea5e9; top: 30%; right: -100px; animation-delay: -5s; }
.aurora-orb3 { width: 400px; height: 400px; background: #10b981; bottom: 0; left: 30%; animation-delay: -9s; }
@keyframes aurora-drift {
  0%   { transform: translate(0,0) scale(1); }
  50%  { transform: translate(40px, 30px) scale(1.08); }
  100% { transform: translate(-20px, 20px) scale(0.95); }
}
.aurora-wrap {
  position: relative;
  z-index: 1;
  max-width: 780px;
  margin: 0 auto;
  padding: 3.5rem 1.5rem 5rem;
}
.aurora-hero {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}
.aurora-avatar-ring {
  flex-shrink: 0;
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #0ea5e9, #10b981);
}
.aurora-avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  border: 3px solid #04050d;
}
.aurora-hero-text { flex: 1; min-width: 200px; }
.aurora-name {
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  font-weight: 700;
  letter-spacing: -.03em;
  background: linear-gradient(135deg, #a78bfa, #38bdf8, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: .25rem;
}
.aurora-role {
  font-family: 'Space Mono', monospace;
  font-size: .78rem;
  color: #a78bfa;
  letter-spacing: .08em;
  margin-bottom: .2rem;
}
.aurora-location { font-size: .8rem; opacity: .45; margin-bottom: .75rem; }
.aurora-bio { font-size: .95rem; opacity: .72; line-height: 1.7; margin-bottom: 1rem; max-width: 50ch; }
.aurora-links { gap: .5rem 1rem; }
.aurora-links a {
  color: #a78bfa;
  opacity: 1;
  font-size: .82rem;
  border-bottom: 1px solid transparent;
  transition: border-color .2s;
}
.aurora-links a:hover { border-color: #a78bfa; text-decoration: none; }
.aurora-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 1rem;
  padding: 1.75rem 1.5rem;
  margin-bottom: 1.5rem;
}
.aurora-section-title {
  font-size: .65rem;
  text-transform: uppercase;
  letter-spacing: .22em;
  color: #a78bfa;
  opacity: 1;
  margin-bottom: 1.25rem;
}
.aurora-about { font-size: .95rem; opacity: .78; line-height: 1.8; }
.aurora-skills { display: flex; flex-wrap: wrap; gap: .3rem; }
.aurora-card .skill-badge { border-color: rgba(167,139,250,.4); color: #c4b5fd; opacity: 1; }
.aurora-project-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(260px,1fr)); gap: 1rem; }
.aurora-card .project-card {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.1);
}
.aurora-card .project-title { color: #e2e8f0; }
`;

  return { html, css };
}

// ── Minimal template (clean light typographic) ───────────────────────────────
function buildMinimal(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Mono:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
</head>
<body class="min-body">
  <div class="min-container">
    <header class="min-header">
      <div class="min-header-left">
        <h1 class="min-name">${esc(data.name)}</h1>
        ${data.title ? `<span class="min-role">${esc(data.title)}</span>` : ""}
      </div>
      <div class="min-header-right">
        ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="min-avatar" loading="eager" />` : ""}
      </div>
    </header>

    <div class="min-meta">
      ${data.location ? `<span class="min-meta-item">${esc(data.location)}</span>` : ""}
      ${data.bio ? `<span class="min-meta-item min-bio">${esc(data.bio)}</span>` : ""}
    </div>
    <div class="social-links min-links">${socialLinks(data)}</div>

    <hr class="min-divider" />

    ${gallery}

    <div class="min-body-grid">
      <div class="min-main">
        ${data.about ? `
        <section class="min-section">
          <h2 class="min-section-title">About</h2>
          <p class="min-about">${esc(data.about)}</p>
        </section>` : ""}

        ${data.experience?.length ? `
        <section class="min-section">
          <h2 class="min-section-title">Experience</h2>
          ${expItems(data)}
        </section>` : ""}

        ${data.projects?.filter((p) => p.include !== false).length ? `
        <section class="min-section">
          <h2 class="min-section-title">Projects</h2>
          <div class="min-project-grid">${projectCards(data)}</div>
        </section>` : ""}
      </div>

      <aside class="min-aside">
        ${data.skills?.length ? `
        <section class="min-section">
          <h2 class="min-section-title">Skills</h2>
          <div class="min-skills">${skillBadges(data.skills)}</div>
        </section>` : ""}

        ${data.education?.length ? `
        <section class="min-section">
          <h2 class="min-section-title">Education</h2>
          ${eduItems(data)}
        </section>` : ""}
      </aside>
    </div>
  </div>
</body>
</html>`;

  const css = baseCss + `
body.min-body {
  background: #ffffff;
  color: #111111;
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
}
body.light.min-body { background: #ffffff; color: #111111; }
.min-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 3.5rem 2rem 5rem;
}
.min-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}
.min-header-left { flex: 1; }
.min-name {
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: 300;
  letter-spacing: -.04em;
  line-height: 1.1;
  margin-bottom: .2rem;
  color: #111;
}
.min-role {
  font-family: 'DM Mono', monospace;
  font-size: .78rem;
  color: #888;
  letter-spacing: .04em;
}
.min-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
  flex-shrink: 0;
  margin-left: 1.5rem;
}
.min-meta {
  display: flex;
  flex-direction: column;
  gap: .3rem;
  margin-bottom: .75rem;
}
.min-meta-item { font-size: .88rem; color: #555; }
.min-bio { font-style: italic; max-width: 55ch; }
.min-links { margin-bottom: 1.5rem; }
.min-links a { color: #111; font-size: .82rem; border-bottom: 1px solid #ddd; padding-bottom: 1px; transition: border-color .2s; }
.min-links a:hover { border-color: #111; text-decoration: none; }
.min-divider { border: none; border-top: 2px solid #111; margin-bottom: 2.5rem; }
.min-body-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 3rem;
}
@media(max-width: 680px) { .min-body-grid { grid-template-columns: 1fr; } }
.min-section { margin-bottom: 2.5rem; }
.min-section-title {
  font-size: .65rem;
  text-transform: uppercase;
  letter-spacing: .2em;
  color: #999;
  margin-bottom: 1rem;
  font-weight: 500;
}
.min-about { font-size: .95rem; line-height: 1.85; color: #333; max-width: 58ch; }
.min-skills { display: flex; flex-wrap: wrap; gap: .25rem; }
.min-skills .skill-badge { border-color: #ccc; color: #444; font-size: .68rem; }
.min-project-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: .85rem; }
.min-main .project-card { border-color: #eee; }
.min-main .project-title { color: #111; font-size: .9rem; }
.min-main .project-desc { color: #666; }
.min-aside .exp-item, .min-aside .edu-item { border-color: #eee; }
.min-aside .exp-role, .min-aside .edu-degree { color: #111; font-size: .85rem; }
.min-aside .exp-company, .min-aside .edu-school { color: #888; }
`;

  return { html, css };
}

// ── Public API ────────────────────────────────────────────────────────────────
export function buildSite(
  data: PortfolioData,
  template: TemplateId,
): { html: string; css: string } {
  if (template === "split") return buildSplit(data);
  if (template === "editorial") return buildEditorial(data);
  if (template === "aurora") return buildAurora(data);
  if (template === "minimal") return buildMinimal(data);
  return buildCentered(data);
}
