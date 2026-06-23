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

// ── Theme toggle ───────────────────────────────────────────────────────────────
const themeToggle = `<button id="tt" onclick="tToggle()" aria-label="Toggle theme"
style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;width:2.5rem;height:2.5rem;
border-radius:50%;border:1.5px solid var(--accent);cursor:pointer;font-size:.85rem;
display:flex;align-items:center;justify-content:center;
background:var(--bg,#fff);color:var(--accent);
box-shadow:0 2px 12px rgba(0,0,0,.15);transition:all .25s;font-family:inherit;"></button>
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
  var obs=new MutationObserver(function(){try{localStorage.setItem(K,r.dataset.theme);}catch(e){}});
  obs.observe(r,{attributes:true,attributeFilter:['data-theme']});
  window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(e){
    var s=null;try{s=localStorage.getItem(K);}catch(x){}if(!s)apply(e.matches?'dark':'light');
  });
})();<\/script>`;

// ── Shared Black & White base CSS ──────────────────────────────────────────────
const bwBase = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{line-height:1.6;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
img{display:block;max-width:100%;height:auto}
a{color:inherit;text-decoration:none}
a:hover{text-decoration:underline}

/* ── Black & White Palette ── */
:root{
  --accent:#000000;
  --accent-light:#f5f5f5;
  --accent-mid:#555555;
  --accent-dark:#000000;
}
/* ── Light ── */
[data-theme="light"]{
  --bg:#ffffff;--bg2:#f9f9f9;--bg3:#f0f0f0;
  --text-primary:#000000;--text-secondary:#111111;--text-muted:#444444;--text-faint:#888888;
  --line:rgba(0,0,0,.15);--line2:rgba(0,0,0,.25);--label:#555555;
  --card-bg:#ffffff;--card-border:rgba(0,0,0,.18);--card-shadow:rgba(0,0,0,.08);
  --badge-bg:#f5f5f5;--badge-border:rgba(0,0,0,.2);--badge-color:#111111;
  --nav-bg:#ffffff;
}
/* ── Dark ── */
[data-theme="dark"]{
  --bg:#0a0a0a;--bg2:#111111;--bg3:#1a1a1a;
  --text-primary:#ffffff;--text-secondary:#e5e5e5;--text-muted:#aaaaaa;--text-faint:#666666;
  --line:rgba(255,255,255,.12);--line2:rgba(255,255,255,.22);--label:#bbbbbb;
  --card-bg:#111111;--card-border:rgba(255,255,255,.18);--card-shadow:rgba(0,0,0,.5);
  --badge-bg:#1a1a1a;--badge-border:rgba(255,255,255,.18);--badge-color:#e5e5e5;
  --nav-bg:#0a0a0a;
}
body{background:var(--bg);color:var(--text-primary);transition:background .25s,color .25s;}

/* ── Navbar ── */
.fc-nav{
  display:flex;align-items:center;gap:2rem;
  padding:.9rem 2rem;
  background:var(--nav-bg);
  border-bottom:1px solid var(--line);
  position:sticky;top:0;z-index:100;
}
.fc-nav a{
  font-size:.85rem;font-weight:500;letter-spacing:.06em;
  color:var(--accent);text-transform:capitalize;
  transition:opacity .2s;
}
.fc-nav a:hover{opacity:.6;text-decoration:none;}
.fc-nav-brand{font-weight:700;font-size:.92rem;color:var(--text-primary);margin-right:auto;}

/* ── Main rounded card ── */
.fc-card{
  border:1.5px solid var(--card-border);
  border-radius:1.5rem;
  background:var(--card-bg);
  box-shadow:0 4px 32px var(--card-shadow);
  padding:2.5rem;
  transition:box-shadow .25s;
}
.fc-card:hover{box-shadow:0 8px 48px var(--card-shadow);}

/* ── Shared components ── */
.badge{
  display:inline-block;padding:.2em .7em;
  border:1px solid var(--badge-border);border-radius:999px;
  font-size:.67rem;letter-spacing:.04em;margin:.12rem;
  color:var(--badge-color);background:var(--badge-bg);
}
.pcard{
  background:var(--card-bg);border:1px solid var(--card-border);
  border-radius:.75rem;overflow:hidden;transition:box-shadow .2s;
}
.pcard:hover{box-shadow:0 4px 20px var(--card-shadow);}
.pcard-img{width:100%;height:150px;object-fit:cover;transition:filter .3s;}
.pcard-body{padding:.9rem}
.pcard-name{font-weight:700;font-size:.88rem;margin-bottom:.25rem;color:var(--text-primary);}
.pcard-desc{font-size:.78rem;color:var(--text-muted);margin-bottom:.35rem;line-height:1.5}
.pcard-lang{font-size:.68rem;color:var(--accent-mid);font-family:monospace;margin-bottom:.35rem}
.pcard-links{display:flex;gap:.75rem;font-size:.75rem;}
.pcard-links a{color:var(--text-primary);}
.exp,.edu{padding:.8rem 0;border-bottom:1px solid var(--line)}
.exp:last-child,.edu:last-child{border:none}
.exp-top,.edu-top{display:flex;justify-content:space-between;align-items:baseline;gap:.5rem;margin-bottom:.1rem}
.exp-role,.edu-deg{font-weight:700;font-size:.86rem;}
.exp-period,.edu-period{font-size:.7rem;color:var(--text-faint);white-space:nowrap;font-variant-numeric:tabular-nums;}
.exp-co,.edu-school{font-size:.8rem;color:var(--accent-mid);}
.exp-desc{font-size:.76rem;color:var(--text-muted);margin-top:.2rem;line-height:1.5}
.sec-label{
  font-size:.6rem;text-transform:uppercase;letter-spacing:.25em;
  color:var(--text-faint);margin-bottom:1rem;font-weight:600;
}
.gl{position:relative;overflow:hidden;aspect-ratio:16/9;max-height:460px;background:var(--bg3);margin-block:2rem;border-radius:1rem;}
.gl-track{position:relative;width:100%;height:100%;}
.gl-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .4s;pointer-events:none;}
.gl-img.active{opacity:1;pointer-events:auto;}
.gl-arrow{position:absolute;top:50%;transform:translateY(-50%);background:var(--accent);color:var(--bg);border:none;width:2rem;height:2rem;font-size:1.2rem;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;transition:opacity .2s;opacity:.8;border-radius:50%;}
.gl-arrow:hover{opacity:1;}
.gl-prev{left:.5rem;}.gl-next{right:.5rem;}
.gl-dots{position:absolute;bottom:.6rem;left:50%;transform:translateX(-50%);display:flex;gap:.3rem;z-index:2;}
.gl-dot{width:.4rem;height:.4rem;border-radius:50%;background:rgba(255,255,255,.5);border:none;cursor:pointer;padding:0;transition:all .2s;}
.gl-dot.active{width:1rem;background:var(--accent);border-radius:.2rem;}
`;

// ── Navbar HTML helper ─────────────────────────────────────────────────────────
function buildNav(name: string): string {
  return `<nav class="fc-nav">
  <span class="fc-nav-brand">${esc(name)}</span>
  <a href="#home">Home</a>
  <a href="#about">About</a>
  <a href="#project">Project</a>
</nav>`;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. INK  — newspaper-style editorial, bold serif masthead
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

${buildNav(data.name)}

<div class="ink-outer" id="home">
  <div class="fc-card ink-card">
    <header class="ink-masthead">
      <div class="ink-dateline">${data.location ? esc(data.location) + " · " : ""}Portfolio</div>
      <h1 class="ink-nameplate">${esc(data.name)}</h1>
      <div class="ink-rule"></div>
      <div class="ink-subhead">${data.title ? esc(data.title) : ""}</div>
    </header>

    <div class="ink-lead-row" id="about">
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

    <div class="ink-columns" id="project">
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
</div>
${themeToggle}
</body></html>`;

  const css = bwBase + `
.ink-body{font-family:'Inter',sans-serif;}
.ink-outer{padding:2rem;max-width:980px;margin:0 auto;}
.ink-card{padding:2.5rem 2.5rem 3rem;}
.ink-masthead{text-align:center;padding-bottom:1.5rem;margin-bottom:1.5rem;border-bottom:2px solid var(--card-border);}
.ink-dateline{font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;color:var(--text-faint);margin-bottom:.75rem;}
.ink-nameplate{font-family:'Playfair Display',Georgia,serif;font-size:clamp(3rem,9vw,7.5rem);font-weight:900;line-height:.92;letter-spacing:-.03em;margin-bottom:1rem;color:var(--text-primary);}
.ink-rule{border:none;border-top:2px solid var(--card-border);margin:.6rem 0;}
.ink-subhead{font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--text-muted);margin-top:.5rem;}
.ink-lead-row{display:grid;grid-template-columns:1fr 200px;gap:2.5rem;margin-bottom:2rem;align-items:start;}
@media(max-width:640px){.ink-lead-row{grid-template-columns:1fr;}}
.ink-drop-cap{font-family:'Playfair Display',Georgia,serif;font-size:1.05rem;line-height:1.75;color:var(--text-secondary);margin-bottom:.85rem;}
.ink-drop-cap::first-letter{float:left;font-size:4.2em;line-height:.75;margin:.06em .1em 0 0;font-weight:900;color:var(--text-primary);}
.ink-body-copy{font-size:.9rem;line-height:1.8;color:var(--text-muted);}
.ink-av{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:.75rem;border:2px solid var(--card-border);}
.ink-fig-cap{font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-faint);margin-top:.35rem;text-align:center;}
.ink-aside-links{display:flex;flex-direction:column;gap:.4rem;margin-top:1rem;}
.ink-aside-links a{font-size:.75rem;color:var(--text-primary);border-bottom:1px solid var(--line);padding:.2rem 0;}
.ink-columns{display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;margin-top:1.5rem;}
@media(max-width:640px){.ink-columns{grid-template-columns:1fr;}}
.ink-badges{display:flex;flex-wrap:wrap;gap:.2rem;}
.ink-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;margin-top:.5rem;}
`;
  return { html, css };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. SHEET  — Swiss sidebar grid
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

${buildNav(data.name)}

<div class="sh-outer" id="home">
  <div class="fc-card sh-layout">
    <aside class="sh-aside" id="about">
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
    <main class="sh-main" id="project">
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
</div>
${themeToggle}
</body></html>`;

  const css = bwBase + `
.sh-body{font-family:'DM Sans',system-ui,sans-serif;}
.sh-outer{padding:2rem;max-width:1100px;margin:0 auto;}
.sh-layout{display:grid;grid-template-columns:260px 1fr;gap:0;padding:0;overflow:hidden;}
@media(max-width:720px){.sh-layout{grid-template-columns:1fr;}}
.sh-aside{padding:2.5rem 2rem;border-right:1.5px solid var(--card-border);display:flex;flex-direction:column;gap:.6rem;background:var(--bg2);border-radius:1.5rem 0 0 1.5rem;}
@media(max-width:720px){.sh-aside{border-right:none;border-bottom:1.5px solid var(--card-border);border-radius:1.5rem 1.5rem 0 0;}}
.sh-av{width:64px;height:64px;border-radius:50%;object-fit:cover;margin-bottom:.5rem;border:2px solid var(--card-border);}
.sh-name{font-size:1.35rem;font-weight:700;letter-spacing:-.03em;line-height:1.15;margin-bottom:.15rem;color:var(--text-primary);}
.sh-role{font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;color:var(--text-faint);margin-bottom:.1rem;}
.sh-loc{font-size:.73rem;color:var(--text-faint);margin-bottom:.6rem;}
.sh-bio{font-size:.83rem;line-height:1.65;color:var(--text-muted);max-width:30ch;margin-bottom:.5rem;}
.sh-links{display:flex;flex-direction:column;gap:.35rem;margin-bottom:1rem;}
.sh-links a{font-size:.75rem;color:var(--text-primary);display:flex;align-items:center;gap:.4rem;}
.sh-links a::before{content:'→';font-size:.7rem;color:var(--accent-mid);}
.sh-skills-block{margin-top:auto;padding-top:1.5rem;border-top:1px solid var(--line);}
.sh-badges{display:flex;flex-wrap:wrap;gap:.2rem;margin-top:.5rem;}
.sh-main{padding:2.5rem 2rem;border-radius:0 1.5rem 1.5rem 0;}
@media(max-width:720px){.sh-main{border-radius:0 0 1.5rem 1.5rem;}}
.sh-sec{margin-bottom:2.5rem;}
.sh-text{font-size:.92rem;line-height:1.82;color:var(--text-muted);max-width:60ch;}
.sh-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem;margin-top:.5rem;}
`;
  return { html, css };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. MONO  — centred single-column, monospace, timeline feel
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildMono(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,600;0,700;1,300&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body class="mo-body">

${buildNav(data.name)}

<div class="mo-outer" id="home">
  <div class="fc-card mo-card">
    <header class="mo-hero" id="about">
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
    <section class="mo-sec" id="project">
      <h2 class="sec-label">Projects</h2>
      <div class="mo-pgrid">${projectCards(data)}</div>
    </section>` : ""}
  </div>
</div>
${themeToggle}
</body></html>`;

  const css = bwBase + `
.mo-body{font-family:'IBM Plex Sans',monospace;}
.mo-outer{padding:2rem;max-width:760px;margin:0 auto;}
.mo-card{padding:3rem 2.5rem;}
.mo-hero{text-align:center;margin-bottom:2rem;}
.mo-av{width:80px;height:80px;border-radius:50%;object-fit:cover;margin:0 auto 1.25rem;border:2px solid var(--card-border);}
.mo-name{font-family:'IBM Plex Mono',monospace;font-size:clamp(1.8rem,6vw,3rem);font-weight:700;letter-spacing:-.04em;line-height:1.1;margin-bottom:.3rem;color:var(--text-primary);}
.mo-role{font-family:'IBM Plex Mono',monospace;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-faint);margin-bottom:.5rem;}
.mo-meta-row{display:flex;justify-content:center;gap:1rem;margin-bottom:.75rem;}
.mo-meta{font-size:.72rem;color:var(--text-faint);letter-spacing:.06em;}
.mo-bio{font-size:.92rem;line-height:1.72;color:var(--text-muted);max-width:48ch;margin:0 auto .9rem;}
.mo-links{display:flex;justify-content:center;flex-wrap:wrap;gap:.5rem 1.25rem;}
.mo-links a{font-size:.75rem;color:var(--text-primary);border-bottom:1px solid var(--line);padding-bottom:1px;transition:border-color .2s;}
.mo-links a:hover{border-color:var(--accent);text-decoration:none;}
.mo-divider{border:none;border-top:1.5px solid var(--card-border);margin:2rem 0;}
.mo-sec{margin-bottom:2.5rem;}
.mo-text{font-size:.9rem;line-height:1.82;color:var(--text-muted);max-width:58ch;}
.mo-badges{display:flex;flex-wrap:wrap;gap:.2rem;}
.mo-timeline{border-left:2px solid var(--accent);padding-left:1.25rem;}
.mo-timeline .exp{position:relative;}
.mo-timeline .exp::before{content:'';position:absolute;left:-1.43rem;top:.55rem;width:.6rem;height:.6rem;border-radius:50%;background:var(--accent);border:2px solid var(--bg);}
.mo-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem;}
`;
  return { html, css };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. RULED  — brutalist horizontal-line structure, full-width sections
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildRuled(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital@0;1&display=swap" rel="stylesheet">
</head>
<body class="rl-body">

${buildNav(data.name)}

<div class="rl-outer" id="home">
  <div class="fc-card rl-card">
    <div class="rl-header-inner">
      <div class="rl-index">001</div>
      <h1 class="rl-name">${esc(data.name)}</h1>
      <div class="rl-header-right">
        ${data.title ? `<span class="rl-role">${esc(data.title)}</span>` : ""}
        ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="rl-av" />` : ""}
      </div>
    </div>
    ${data.bio || data.location ? `
    <div class="rl-row rl-intro-row" id="about">
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
      <div class="rl-row-content rl-wide"><p class="rl-text">${esc(data.about)}</p></div>
    </div>` : ""}
    ${data.skills?.length ? `
    <div class="rl-row">
      <div class="rl-row-label">skills</div>
      <div class="rl-row-content rl-wide"><div class="rl-badges">${skillBadges(data.skills)}</div></div>
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
    <div class="rl-row" id="project">
      <div class="rl-row-label">projects</div>
      <div class="rl-row-content rl-wide"><div class="rl-pgrid">${projectCards(data)}</div></div>
    </div>` : ""}
  </div>
</div>
${themeToggle}
</body></html>`;

  const css = bwBase + `
.rl-body{font-family:'Space Grotesk',sans-serif;}
.rl-outer{padding:2rem;max-width:1100px;margin:0 auto;}
.rl-card{padding:2.5rem 2.5rem 3rem;overflow:hidden;}
.rl-header-inner{display:flex;align-items:center;gap:1.5rem;border-bottom:2px solid var(--card-border);padding-bottom:1.5rem;margin-bottom:0;}
.rl-index{font-family:'Space Mono',monospace;font-size:.65rem;letter-spacing:.18em;color:var(--accent-mid);writing-mode:vertical-lr;transform:rotate(180deg);flex-shrink:0;}
.rl-name{font-size:clamp(2rem,5vw,4rem);font-weight:700;letter-spacing:-.04em;line-height:1;flex:1;color:var(--text-primary);}
.rl-header-right{display:flex;align-items:center;gap:1rem;flex-shrink:0;}
.rl-role{font-size:.72rem;text-transform:uppercase;letter-spacing:.15em;color:var(--text-faint);max-width:15ch;text-align:right;}
.rl-av{width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid var(--card-border);}
.rl-row{display:grid;grid-template-columns:80px 1fr auto;border-bottom:1px solid var(--line);padding:1.75rem 0;gap:1.5rem;align-items:start;}
@media(max-width:680px){.rl-row{grid-template-columns:1fr;}}
.rl-row-label{font-family:'Space Mono',monospace;font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--text-faint);padding-top:.1rem;}
.rl-wide{grid-column:2 / 4;}
@media(max-width:680px){.rl-wide{grid-column:auto;}}
.rl-bio{font-size:.92rem;line-height:1.72;color:var(--text-muted);max-width:55ch;}
.rl-loc{font-size:.72rem;color:var(--text-faint);display:block;margin-top:.4rem;}
.rl-row-links{display:flex;flex-direction:column;gap:.3rem;text-align:right;}
.rl-row-links a{font-size:.72rem;color:var(--text-primary);}
.rl-text{font-size:.9rem;line-height:1.8;color:var(--text-muted);max-width:62ch;}
.rl-badges{display:flex;flex-wrap:wrap;gap:.2rem;}
.rl-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem;}
.rl-intro-row{border-top:1px solid var(--line);}
`;
  return { html, css };
}

// ── Public API ─────────────────────────────────────────────────────────────────
export function buildSite(data: PortfolioData, template: TemplateId): { html: string; css: string } {
  if (template === "split")     return buildSheet(data);   // Sheet — Swiss sidebar grid
  if (template === "editorial") return buildMono(data);    // Mono  — centred timeline
  if (template === "minimal")   return buildRuled(data);   // Ruled — horizontal rows
  return buildInk(data);                                    // Ink   — newspaper masthead (default)
}
