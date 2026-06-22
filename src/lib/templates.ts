import type { PortfolioData, TemplateId } from "./types";

// ── helpers ────────────────────────────────────────────────────────────────────
function esc(s: string | undefined | null): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function skillBadges(skills: string[]): string {
  return (skills ?? []).map(s => `<span class="badge">${esc(s)}</span>`).join("");
}
function socialLinks(data: PortfolioData): string {
  const i: string[] = [];
  if (data.email) i.push(`<a href="mailto:${esc(data.email)}">Email</a>`);
  if (data.website) i.push(`<a href="${esc(data.website)}" target="_blank" rel="noopener">Website</a>`);
  if (data.github) i.push(`<a href="https://github.com/${esc(data.github)}" target="_blank" rel="noopener">GitHub</a>`);
  (data.links ?? []).forEach(l => { if (l.url) i.push(`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label) || "Link"}</a>`); });
  return i.join("");
}
function projectCards(data: PortfolioData): string {
  return (data.projects ?? []).filter(p => p.include !== false).map(p => {
    const img = (p.images?.length ? p.images[0] : p.image) ?? "";
    return `<div class="pcard">
  ${img ? `<img src="${esc(img)}" alt="${esc(p.name)}" class="pcard-img" loading="lazy" />` : ""}
  <div class="pcard-body">
    <div class="pcard-name">${esc(p.name)}</div>
    ${p.description ? `<div class="pcard-desc">${esc(p.description)}</div>` : ""}
    ${p.language ? `<div class="pcard-lang">${esc(p.language)}</div>` : ""}
    <div class="pcard-links">
      ${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">Live ↗</a>` : ""}
      ${p.githubUrl ? `<a href="${esc(p.githubUrl)}" target="_blank" rel="noopener">Code ↗</a>` : ""}
    </div>
  </div>
</div>`;
  }).join("");
}
function expItems(data: PortfolioData): string {
  return (data.experience ?? []).map(e => `<div class="exp">
  <div class="exp-top"><span class="exp-role">${esc(e.role)}</span><span class="exp-period">${esc(e.period)}</span></div>
  <div class="exp-co">${esc(e.company)}</div>
  ${e.description ? `<div class="exp-desc">${esc(e.description)}</div>` : ""}
</div>`).join("");
}
function eduItems(data: PortfolioData): string {
  return (data.education ?? []).map(e => `<div class="edu">
  <div class="edu-top"><span class="edu-deg">${esc(e.degree)}</span><span class="edu-period">${esc(e.period)}</span></div>
  <div class="edu-school">${esc(e.school)}</div>
</div>`).join("");
}
function gallerySection(images: string[]): string {
  if (!images?.length) return "";
  const imgs = images.map((s, i) => `<img src="${s}" alt="Gallery ${i + 1}" class="gl-img${i === 0 ? " active" : ""}" loading="lazy" />`).join("");
  const dots = images.map((_, i) => `<button class="gl-dot${i === 0 ? " active" : ""}" onclick="glTo(${i})" aria-label="Slide ${i + 1}"></button>`).join("");
  return `<div class="gl" id="gl"><div class="gl-track">${imgs}</div>
<button class="gl-arrow gl-prev" onclick="glPrev()" aria-label="Prev">‹</button>
<button class="gl-arrow gl-next" onclick="glNext()" aria-label="Next">›</button>
<div class="gl-dots">${dots}</div></div>
<script>(function(){var I=document.querySelectorAll('.gl-img'),D=document.querySelectorAll('.gl-dot'),c=0;function go(n){I[c].classList.remove('active');D[c].classList.remove('active');c=(n+I.length)%I.length;I[c].classList.add('active');D[c].classList.add('active');}window.glTo=go;window.glPrev=function(){go(c-1);};window.glNext=function(){go(c+1);};var t=0;var el=document.getElementById('gl');el.addEventListener('touchstart',function(e){t=e.touches[0].clientX;},{passive:true});el.addEventListener('touchend',function(e){var d=e.changedTouches[0].clientX-t;if(Math.abs(d)>40){d<0?glNext():glPrev();}},{passive:true});})();<\/script>`;
}

// ── B&W theme toggle ────────────────────────────────────────────────────────────
const themeToggle = `<button id="tt" onclick="tToggle()" aria-label="Toggle theme"
style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;width:2.5rem;height:2.5rem;
border-radius:50%;border:1.5px solid var(--line,#e0e0e0);cursor:pointer;font-size:.85rem;
display:flex;align-items:center;justify-content:center;
background:var(--bg,#fff);color:var(--text-primary,#111);
box-shadow:0 2px 12px rgba(0,0,0,.12);transition:all .25s;font-family:inherit;"></button>
<script>(function(){
  var b=document.getElementById('tt'),r=document.documentElement,K='folio-theme';
  function apply(m){
    r.dataset.theme=m;
    b.textContent=m==='dark'?'☼':'●';
    b.title=m==='dark'?'Switch to light':'Switch to dark';
  }
  window.tToggle=function(){apply(r.dataset.theme==='dark'?'light':'dark');};
  var saved=null;try{saved=localStorage.getItem(K);}catch(e){}
  apply(saved||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
  r.addEventListener('data-themechange',function(){try{localStorage.setItem(K,r.dataset.theme);}catch(e){}});
  var obs=new MutationObserver(function(){try{localStorage.setItem(K,r.dataset.theme);}catch(e){}});
  obs.observe(r,{attributes:true,attributeFilter:['data-theme']});
  window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(e){
    var s=null;try{s=localStorage.getItem(K);}catch(x){}if(!s)apply(e.matches?'dark':'light');
  });
})();<\/script>`;

// ── Shared base CSS (strictly B&W, no color) ───────────────────────────────────
const bwBase = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{line-height:1.6;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
img{display:block;max-width:100%;height:auto}
a{color:inherit;text-decoration:none}
a:hover{text-decoration:underline}
/* ── Light ── */
[data-theme="light"]{
  --bg:#ffffff;--bg2:#f7f7f7;--bg3:#f0f0f0;
  --text-primary:#111111;--text-secondary:#333333;--text-muted:#666666;--text-faint:#999999;
  --line:#e0e0e0;--line2:#cccccc;--label:#aaaaaa;
  --card-bg:#ffffff;--card-border:#e0e0e0;--card-shadow:rgba(0,0,0,.06);
  --badge-bg:transparent;--badge-border:#cccccc;--badge-color:#444444;
  --inv:#111111;
}
/* ── Dark ── */
[data-theme="dark"]{
  --bg:#111111;--bg2:#1a1a1a;--bg3:#222222;
  --text-primary:#f0f0f0;--text-secondary:#cccccc;--text-muted:#888888;--text-faint:#555555;
  --line:#2a2a2a;--line2:#333333;--label:#555555;
  --card-bg:#1a1a1a;--card-border:#2a2a2a;--card-shadow:rgba(0,0,0,.4);
  --badge-bg:transparent;--badge-border:#333333;--badge-color:#aaaaaa;
  --inv:#f0f0f0;
}
body{background:var(--bg);color:var(--text-primary);transition:background .25s,color .25s;}
.badge{
  display:inline-block;padding:.18em .65em;
  border:1px solid var(--badge-border);border-radius:2px;
  font-size:.67rem;letter-spacing:.04em;margin:.12rem;
  color:var(--badge-color);background:var(--badge-bg);
}
.pcard{
  background:var(--card-bg);border:1px solid var(--card-border);
  overflow:hidden;transition:box-shadow .2s;
}
.pcard:hover{box-shadow:0 4px 20px var(--card-shadow);}
.pcard-img{width:100%;height:150px;object-fit:cover;filter:grayscale(100%);transition:filter .3s;}
.pcard:hover .pcard-img{filter:grayscale(0%);}
.pcard-body{padding:.9rem}
.pcard-name{font-weight:700;font-size:.88rem;margin-bottom:.25rem;}
.pcard-desc{font-size:.78rem;color:var(--text-muted);margin-bottom:.35rem;line-height:1.5}
.pcard-lang{font-size:.68rem;color:var(--text-faint);font-family:monospace;margin-bottom:.35rem}
.pcard-links{display:flex;gap:.75rem;font-size:.75rem;color:var(--text-secondary)}
.exp,.edu{padding:.8rem 0;border-bottom:1px solid var(--line)}
.exp:last-child,.edu:last-child{border:none}
.exp-top,.edu-top{display:flex;justify-content:space-between;align-items:baseline;gap:.5rem;margin-bottom:.1rem}
.exp-role,.edu-deg{font-weight:700;font-size:.86rem;}
.exp-period,.edu-period{font-size:.7rem;color:var(--text-faint);white-space:nowrap;font-variant-numeric:tabular-nums;}
.exp-co,.edu-school{font-size:.8rem;color:var(--text-muted)}
.exp-desc{font-size:.76rem;color:var(--text-faint);margin-top:.2rem;line-height:1.5}
.sec-label{
  font-size:.6rem;text-transform:uppercase;letter-spacing:.25em;
  color:var(--label);margin-bottom:1rem;
}
.gl{position:relative;overflow:hidden;aspect-ratio:16/9;max-height:460px;background:var(--bg3);margin-block:2rem;}
.gl-track{position:relative;width:100%;height:100%;}
.gl-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .4s;pointer-events:none;filter:grayscale(30%);}
.gl-img.active{opacity:1;pointer-events:auto;}
.gl-arrow{position:absolute;top:50%;transform:translateY(-50%);background:var(--inv);color:var(--bg);border:none;width:2rem;height:2rem;font-size:1.2rem;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;transition:opacity .2s;opacity:.7;}
.gl-arrow:hover{opacity:1;}
.gl-prev{left:.5rem;}.gl-next{right:.5rem;}
.gl-dots{position:absolute;bottom:.6rem;left:50%;transform:translateX(-50%);display:flex;gap:.3rem;z-index:2;}
.gl-dot{width:.4rem;height:.4rem;border-radius:50%;background:var(--text-faint);border:none;cursor:pointer;padding:0;transition:all .2s;}
.gl-dot.active{width:1rem;background:var(--text-primary);border-radius:.2rem;}
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. INK  — newspaper-style editorial, bold serif masthead, ruled columns
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildInk(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body class="ink-body">

<header class="ink-masthead">
  <div class="ink-masthead-top">
    <div class="ink-dateline">${data.location ? esc(data.location) + " · " : ""}Portfolio</div>
    <h1 class="ink-nameplate">${esc(data.name)}</h1>
    <div class="ink-rule"></div>
    <div class="ink-subhead">${data.title ? esc(data.title) : ""}</div>
  </div>
</header>

<div class="ink-wrap">
  <div class="ink-lead-row">
    <div class="ink-lead-main">
      ${data.bio ? `<p class="ink-drop-cap">${esc(data.bio)}</p>` : ""}
      ${data.about ? `<p class="ink-body-copy">${esc(data.about)}</p>` : ""}
    </div>
    <aside class="ink-lead-aside">
      ${data.avatar ? `<figure class="ink-fig">
        <img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="ink-av" />
        <figcaption class="ink-fig-cap">${esc(data.name)}</figcaption>
      </figure>` : ""}
      <div class="ink-aside-links">${socialLinks(data)}</div>
    </aside>
  </div>

  ${gallery}

  <div class="ink-rule"></div>

  <div class="ink-columns">
    <div class="ink-col">
      ${data.experience?.length ? `<section><h2 class="sec-label">Experience</h2>${expItems(data)}</section>` : ""}
      ${data.projects?.filter(p => p.include !== false).length ? `
      <section style="margin-top:2rem">
        <h2 class="sec-label">Projects</h2>
        <div class="ink-pgrid">${projectCards(data)}</div>
      </section>` : ""}
    </div>
    <div class="ink-col">
      ${data.skills?.length ? `<section><h2 class="sec-label">Skills</h2><div class="ink-badges">${skillBadges(data.skills)}</div></section>` : ""}
      ${data.education?.length ? `<section style="margin-top:2rem"><h2 class="sec-label">Education</h2>${eduItems(data)}</section>` : ""}
    </div>
  </div>
</div>
${themeToggle}
</body></html>`;

  const css = bwBase + `
.ink-body{font-family:'Inter',sans-serif;}
.ink-masthead{border-bottom:3px solid var(--text-primary);padding:2.5rem 2rem 1.5rem;text-align:center;}
.ink-masthead-top{max-width:900px;margin:0 auto;}
.ink-dateline{font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;color:var(--text-faint);margin-bottom:.75rem;}
.ink-nameplate{
  font-family:'Playfair Display',Georgia,serif;
  font-size:clamp(3rem,9vw,7.5rem);font-weight:900;
  line-height:.92;letter-spacing:-.03em;
  margin-bottom:1rem;
}
.ink-rule{border:none;border-top:1px solid var(--text-primary);margin:.6rem 0;}
.ink-subhead{font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--text-muted);margin-top:.5rem;}
.ink-wrap{max-width:900px;margin:0 auto;padding:2rem 2rem 5rem;}
.ink-lead-row{display:grid;grid-template-columns:1fr 200px;gap:2.5rem;margin-bottom:2rem;align-items:start;}
@media(max-width:640px){.ink-lead-row{grid-template-columns:1fr;}}
.ink-drop-cap{
  font-family:'Playfair Display',Georgia,serif;
  font-size:1.05rem;line-height:1.75;color:var(--text-secondary);
  margin-bottom:.85rem;
}
.ink-drop-cap::first-letter{
  float:left;font-size:4.2em;line-height:.75;margin:.06em .1em 0 0;
  font-weight:900;color:var(--text-primary);
}
.ink-body-copy{font-size:.9rem;line-height:1.8;color:var(--text-muted);}
.ink-fig{}
.ink-av{width:100%;aspect-ratio:3/4;object-fit:cover;filter:grayscale(100%);}
.ink-fig-cap{font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-faint);margin-top:.35rem;text-align:center;}
.ink-aside-links{display:flex;flex-direction:column;gap:.4rem;margin-top:1rem;}
.ink-aside-links a{font-size:.75rem;color:var(--text-secondary);border-bottom:1px solid var(--line);padding:.2rem 0;}
.ink-columns{display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;margin-top:1.5rem;}
@media(max-width:640px){.ink-columns{grid-template-columns:1fr;}}
.ink-badges{display:flex;flex-wrap:wrap;gap:.2rem;}
.ink-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;margin-top:.5rem;}
.ink-pgrid .pcard{border-radius:0;}
`;
  return { html, css };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. SHEET  — Swiss International grid, ultra-clean geometric sans
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildSheet(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&display=swap" rel="stylesheet">
</head>
<body class="sh-body">

<div class="sh-grid">
  <!-- Left column: identity -->
  <aside class="sh-aside">
    ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="sh-av" />` : ""}
    <h1 class="sh-name">${esc(data.name)}</h1>
    ${data.title ? `<div class="sh-role">${esc(data.title)}</div>` : ""}
    ${data.location ? `<div class="sh-loc">${esc(data.location)}</div>` : ""}
    ${data.bio ? `<p class="sh-bio">${esc(data.bio)}</p>` : ""}
    <nav class="sh-links">${socialLinks(data)}</nav>
    ${data.skills?.length ? `
    <div class="sh-skills-block">
      <div class="sec-label">Skills</div>
      <div class="sh-badges">${skillBadges(data.skills)}</div>
    </div>` : ""}
  </aside>

  <!-- Right column: content -->
  <main class="sh-main">
    ${gallery}
    ${data.about ? `
    <section class="sh-sec">
      <h2 class="sec-label">About</h2>
      <p class="sh-text">${esc(data.about)}</p>
    </section>` : ""}
    ${data.experience?.length ? `
    <section class="sh-sec">
      <h2 class="sec-label">Experience</h2>
      ${expItems(data)}
    </section>` : ""}
    ${data.education?.length ? `
    <section class="sh-sec">
      <h2 class="sec-label">Education</h2>
      ${eduItems(data)}
    </section>` : ""}
    ${data.projects?.filter(p => p.include !== false).length ? `
    <section class="sh-sec">
      <h2 class="sec-label">Projects</h2>
      <div class="sh-pgrid">${projectCards(data)}</div>
    </section>` : ""}
  </main>
</div>
${themeToggle}
</body></html>`;

  const css = bwBase + `
.sh-body{font-family:'DM Sans',system-ui,sans-serif;min-height:100vh;}
.sh-grid{
  display:grid;
  grid-template-columns:280px 1fr;
  min-height:100vh;
}
@media(max-width:720px){.sh-grid{grid-template-columns:1fr;}}
.sh-aside{
  position:sticky;top:0;height:100vh;overflow-y:auto;
  padding:3rem 2rem;border-right:1px solid var(--line);
  display:flex;flex-direction:column;gap:.6rem;
  background:var(--bg2);
}
@media(max-width:720px){.sh-aside{position:static;height:auto;border-right:none;border-bottom:1px solid var(--line);}}
.sh-av{
  width:64px;height:64px;border-radius:50%;
  object-fit:cover;filter:grayscale(100%);
  margin-bottom:.5rem;
  border:2px solid var(--line2);
}
.sh-name{font-size:1.35rem;font-weight:700;letter-spacing:-.03em;line-height:1.15;margin-bottom:.15rem;}
.sh-role{font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;color:var(--text-faint);margin-bottom:.1rem;}
.sh-loc{font-size:.73rem;color:var(--text-faint);margin-bottom:.6rem;}
.sh-bio{font-size:.83rem;line-height:1.65;color:var(--text-muted);max-width:30ch;margin-bottom:.5rem;}
.sh-links{display:flex;flex-direction:column;gap:.35rem;margin-bottom:1rem;}
.sh-links a{font-size:.75rem;color:var(--text-secondary);display:flex;align-items:center;gap:.4rem;}
.sh-links a::before{content:'→';font-size:.7rem;color:var(--text-faint);}
.sh-skills-block{margin-top:auto;padding-top:1.5rem;border-top:1px solid var(--line);}
.sh-badges{display:flex;flex-wrap:wrap;gap:.2rem;margin-top:.5rem;}
.sh-main{padding:3rem 2.5rem;max-width:780px;}
@media(max-width:720px){.sh-main{padding:2rem 1.5rem;}}
.sh-sec{margin-bottom:3rem;}
.sh-text{font-size:.92rem;line-height:1.82;color:var(--text-muted);max-width:60ch;}
.sh-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem;margin-top:.5rem;}
.sh-pgrid .pcard{border-radius:0;border:1px solid var(--line);}
`;
  return { html, css };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. MONO  — centred single-column, monospace + large name, timeline feel
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildMono(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,600;0,700;1,300&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body class="mo-body">
<div class="mo-wrap">
  <header class="mo-hero">
    ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="mo-av" />` : ""}
    <h1 class="mo-name">${esc(data.name)}</h1>
    ${data.title ? `<div class="mo-role">${esc(data.title)}</div>` : ""}
    <div class="mo-meta-row">
      ${data.location ? `<span class="mo-meta">${esc(data.location)}</span>` : ""}
    </div>
    ${data.bio ? `<p class="mo-bio">${esc(data.bio)}</p>` : ""}
    <div class="mo-links">${socialLinks(data)}</div>
  </header>

  <div class="mo-divider"></div>

  ${gallery}

  ${data.about ? `
  <section class="mo-sec">
    <h2 class="sec-label">About</h2>
    <p class="mo-text">${esc(data.about)}</p>
  </section>` : ""}

  ${data.skills?.length ? `
  <section class="mo-sec">
    <h2 class="sec-label">Skills</h2>
    <div class="mo-badges">${skillBadges(data.skills)}</div>
  </section>` : ""}

  ${data.experience?.length ? `
  <section class="mo-sec">
    <h2 class="sec-label">Experience</h2>
    <div class="mo-timeline">${expItems(data)}</div>
  </section>` : ""}

  ${data.education?.length ? `
  <section class="mo-sec">
    <h2 class="sec-label">Education</h2>
    ${eduItems(data)}
  </section>` : ""}

  ${data.projects?.filter(p => p.include !== false).length ? `
  <section class="mo-sec">
    <h2 class="sec-label">Projects</h2>
    <div class="mo-pgrid">${projectCards(data)}</div>
  </section>` : ""}
</div>
${themeToggle}
</body></html>`;

  const css = bwBase + `
.mo-body{font-family:'IBM Plex Sans',monospace;}
.mo-wrap{max-width:680px;margin:0 auto;padding:4rem 1.5rem 6rem;}
.mo-hero{text-align:center;margin-bottom:3rem;}
.mo-av{
  width:80px;height:80px;border-radius:50%;
  object-fit:cover;margin:0 auto 1.25rem;
  filter:grayscale(100%);
  border:1.5px solid var(--line2);
}
.mo-name{
  font-family:'IBM Plex Mono',monospace;
  font-size:clamp(1.8rem,6vw,3rem);font-weight:700;
  letter-spacing:-.04em;line-height:1.1;margin-bottom:.3rem;
}
.mo-role{
  font-family:'IBM Plex Mono',monospace;
  font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;
  color:var(--text-faint);margin-bottom:.5rem;
}
.mo-meta-row{display:flex;justify-content:center;gap:1rem;margin-bottom:.75rem;}
.mo-meta{font-size:.72rem;color:var(--text-faint);letter-spacing:.06em;}
.mo-bio{font-size:.92rem;line-height:1.72;color:var(--text-muted);max-width:48ch;margin:0 auto .9rem;}
.mo-links{display:flex;justify-content:center;flex-wrap:wrap;gap:.5rem 1.25rem;}
.mo-links a{font-size:.75rem;color:var(--text-secondary);border-bottom:1px solid var(--line2);padding-bottom:1px;transition:border-color .2s;}
.mo-links a:hover{border-color:var(--text-primary);text-decoration:none;}
.mo-divider{border:none;border-top:1px solid var(--line2);margin:2.5rem 0;}
.mo-sec{margin-bottom:2.75rem;}
.mo-text{font-size:.9rem;line-height:1.82;color:var(--text-muted);max-width:58ch;}
.mo-badges{display:flex;flex-wrap:wrap;gap:.2rem;}
.mo-timeline{border-left:1.5px solid var(--line2);padding-left:1.25rem;}
.mo-timeline .exp{position:relative;}
.mo-timeline .exp::before{content:'';position:absolute;left:-1.38rem;top:.55rem;width:.55rem;height:.55rem;border-radius:50%;background:var(--text-primary);border:2px solid var(--bg);}
.mo-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem;}
.mo-pgrid .pcard{border-radius:0;}
`;
  return { html, css };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. PAPER  — craft / notebook feel, serifed body, soft shadows, card-based
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildPaper(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Source+Sans+3:wght@300;400;600&display=swap" rel="stylesheet">
</head>
<body class="pp-body">
<div class="pp-wrap">
  <header class="pp-header">
    <div class="pp-header-left">
      <h1 class="pp-name">${esc(data.name)}</h1>
      ${data.title ? `<div class="pp-role">${esc(data.title)}</div>` : ""}
      ${data.location ? `<div class="pp-loc">${esc(data.location)}</div>` : ""}
      <div class="pp-links">${socialLinks(data)}</div>
    </div>
    ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="pp-av" />` : ""}
  </header>

  ${data.bio ? `<blockquote class="pp-quote">${esc(data.bio)}</blockquote>` : ""}

  ${gallery}

  <div class="pp-twoCol">
    <div class="pp-left">
      ${data.about ? `
      <div class="pp-card">
        <h2 class="sec-label">About</h2>
        <p class="pp-text">${esc(data.about)}</p>
      </div>` : ""}
      ${data.experience?.length ? `
      <div class="pp-card">
        <h2 class="sec-label">Experience</h2>
        ${expItems(data)}
      </div>` : ""}
      ${data.projects?.filter(p => p.include !== false).length ? `
      <div class="pp-card">
        <h2 class="sec-label">Projects</h2>
        <div class="pp-pgrid">${projectCards(data)}</div>
      </div>` : ""}
    </div>
    <div class="pp-right">
      ${data.skills?.length ? `
      <div class="pp-card">
        <h2 class="sec-label">Skills</h2>
        <div class="pp-badges">${skillBadges(data.skills)}</div>
      </div>` : ""}
      ${data.education?.length ? `
      <div class="pp-card">
        <h2 class="sec-label">Education</h2>
        ${eduItems(data)}
      </div>` : ""}
    </div>
  </div>
</div>
${themeToggle}
</body></html>`;

  const css = bwBase + `
.pp-body{font-family:'Source Sans 3',sans-serif;}
[data-theme="light"].pp-body,[data-theme="light"] .pp-body{background:#fafaf8;}
[data-theme="dark"] .pp-card{box-shadow:none;}
.pp-wrap{max-width:960px;margin:0 auto;padding:3rem 1.5rem 5rem;}
.pp-header{
  display:flex;align-items:flex-start;
  justify-content:space-between;gap:2rem;
  border-bottom:2px solid var(--text-primary);padding-bottom:1.75rem;margin-bottom:1.75rem;
}
.pp-header-left{flex:1;}
.pp-name{
  font-family:'Lora',Georgia,serif;
  font-size:clamp(2rem,5vw,3.5rem);font-weight:700;
  letter-spacing:-.03em;line-height:1.1;margin-bottom:.25rem;
}
.pp-role{font-size:.78rem;text-transform:uppercase;letter-spacing:.16em;color:var(--text-faint);margin-bottom:.15rem;}
.pp-loc{font-size:.76rem;color:var(--text-faint);margin-bottom:.85rem;}
.pp-links{display:flex;flex-wrap:wrap;gap:.4rem .9rem;}
.pp-links a{font-size:.78rem;color:var(--text-secondary);border-bottom:1px solid var(--line);padding-bottom:1px;transition:border-color .2s;}
.pp-links a:hover{border-color:var(--text-primary);text-decoration:none;}
.pp-av{width:88px;height:110px;object-fit:cover;filter:grayscale(100%);border:1px solid var(--line2);flex-shrink:0;}
.pp-quote{
  font-family:'Lora',Georgia,serif;
  font-style:italic;font-size:1.05rem;line-height:1.7;
  color:var(--text-muted);border-left:2.5px solid var(--text-primary);
  padding-left:1.25rem;margin-bottom:2rem;max-width:60ch;
}
.pp-twoCol{display:grid;grid-template-columns:1fr 280px;gap:1.5rem;}
@media(max-width:680px){.pp-twoCol{grid-template-columns:1fr;}}
.pp-card{
  background:var(--card-bg);border:1px solid var(--card-border);
  padding:1.5rem;margin-bottom:1rem;
  box-shadow:2px 2px 0 var(--line);
}
[data-theme="dark"] .pp-card{box-shadow:none;}
.pp-text{font-family:'Lora',Georgia,serif;font-size:.92rem;line-height:1.82;color:var(--text-muted);max-width:58ch;}
.pp-badges{display:flex;flex-wrap:wrap;gap:.2rem;}
.pp-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;margin-top:.5rem;}
.pp-pgrid .pcard{border-radius:0;box-shadow:2px 2px 0 var(--line);}
[data-theme="dark"] .pp-pgrid .pcard{box-shadow:none;}
`;
  return { html, css };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. RULED  — brutalist horizontal-line structure, full-width sections
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildRuled(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital@0;1&display=swap" rel="stylesheet">
</head>
<body class="rl-body">

<div class="rl-header">
  <div class="rl-header-inner">
    <div class="rl-index">001</div>
    <h1 class="rl-name">${esc(data.name)}</h1>
    <div class="rl-header-right">
      ${data.title ? `<span class="rl-role">${esc(data.title)}</span>` : ""}
      ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="rl-av" />` : ""}
    </div>
  </div>
</div>

<div class="rl-wrap">
  ${data.bio || data.location ? `
  <div class="rl-row rl-intro-row">
    <div class="rl-row-label">intro</div>
    <div class="rl-row-content">
      ${data.bio ? `<p class="rl-bio">${esc(data.bio)}</p>` : ""}
      ${data.location ? `<span class="rl-loc">${esc(data.location)}</span>` : ""}
    </div>
    <div class="rl-row-links">${socialLinks(data)}</div>
  </div>` : ""}

  ${gallery}

  ${data.about ? `
  <div class="rl-row">
    <div class="rl-row-label">about</div>
    <div class="rl-row-content rl-wide">
      <p class="rl-text">${esc(data.about)}</p>
    </div>
  </div>` : ""}

  ${data.skills?.length ? `
  <div class="rl-row">
    <div class="rl-row-label">skills</div>
    <div class="rl-row-content rl-wide">
      <div class="rl-badges">${skillBadges(data.skills)}</div>
    </div>
  </div>` : ""}

  ${data.experience?.length ? `
  <div class="rl-row">
    <div class="rl-row-label">work</div>
    <div class="rl-row-content rl-wide">${expItems(data)}</div>
  </div>` : ""}

  ${data.education?.length ? `
  <div class="rl-row">
    <div class="rl-row-label">edu</div>
    <div class="rl-row-content rl-wide">${eduItems(data)}</div>
  </div>` : ""}

  ${data.projects?.filter(p => p.include !== false).length ? `
  <div class="rl-row">
    <div class="rl-row-label">projects</div>
    <div class="rl-row-content rl-wide">
      <div class="rl-pgrid">${projectCards(data)}</div>
    </div>
  </div>` : ""}
</div>
${themeToggle}
</body></html>`;

  const css = bwBase + `
.rl-body{font-family:'Space Grotesk',sans-serif;}
.rl-header{
  border-bottom:2px solid var(--text-primary);
  padding:2rem;
}
.rl-header-inner{
  max-width:1100px;margin:0 auto;
  display:flex;align-items:center;gap:1.5rem;
}
.rl-index{
  font-family:'Space Mono',monospace;
  font-size:.65rem;letter-spacing:.18em;color:var(--text-faint);
  writing-mode:vertical-lr;transform:rotate(180deg);
  flex-shrink:0;
}
.rl-name{
  font-size:clamp(2rem,5vw,4rem);font-weight:700;
  letter-spacing:-.04em;line-height:1;flex:1;
}
.rl-header-right{display:flex;align-items:center;gap:1rem;flex-shrink:0;}
.rl-role{font-size:.72rem;text-transform:uppercase;letter-spacing:.15em;color:var(--text-faint);max-width:15ch;text-align:right;}
.rl-av{
  width:52px;height:52px;border-radius:50%;
  object-fit:cover;filter:grayscale(100%);
  border:1px solid var(--line2);
}
.rl-wrap{max-width:1100px;margin:0 auto;padding:0 2rem 5rem;}
.rl-row{
  display:grid;
  grid-template-columns:80px 1fr auto;
  border-bottom:1px solid var(--line);
  padding:1.75rem 0;
  gap:1.5rem;
  align-items:start;
}
@media(max-width:680px){.rl-row{grid-template-columns:1fr;}}
.rl-row-label{
  font-family:'Space Mono',monospace;
  font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;
  color:var(--label);padding-top:.1rem;
}
.rl-row-content{}
.rl-wide{grid-column:2 / 4;}
@media(max-width:680px){.rl-wide{grid-column:auto;}}
.rl-bio{font-size:.92rem;line-height:1.72;color:var(--text-muted);max-width:55ch;}
.rl-loc{font-size:.72rem;color:var(--text-faint);display:block;margin-top:.4rem;}
.rl-row-links{display:flex;flex-direction:column;gap:.3rem;text-align:right;}
.rl-row-links a{font-size:.72rem;color:var(--text-muted);}
.rl-text{font-size:.9rem;line-height:1.8;color:var(--text-muted);max-width:62ch;}
.rl-badges{display:flex;flex-wrap:wrap;gap:.2rem;}
.rl-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem;}
.rl-pgrid .pcard{border-radius:0;}
.rl-intro-row{border-top:1px solid var(--line);}
`;
  return { html, css };
}

// ── Public API ─────────────────────────────────────────────────────────────────
export function buildSite(data: PortfolioData, template: TemplateId): { html: string; css: string } {
  if (template === "split")     return buildSheet(data);   // Sheet — Swiss sidebar grid
  if (template === "editorial") return buildMono(data);    // Mono  — centred timeline
  if (template === "aurora")    return buildPaper(data);   // Paper — notebook cards
  if (template === "minimal")   return buildRuled(data);   // Ruled — horizontal rows
  return buildInk(data);                                    // Ink   — newspaper masthead
}
