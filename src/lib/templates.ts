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
function projectCards(data: PortfolioData, cls = ""): string {
  return (data.projects ?? []).filter(p => p.include !== false).map(p => {
    const img = (p.images?.length ? p.images[0] : p.image) ?? "";
    return `<div class="pcard${cls ? " " + cls : ""}">
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
  const imgs = images.map((s, i) => `<img src="${s}" alt="Gallery ${i+1}" class="gl-img${i===0?" active":""}" loading="lazy" />`).join("");
  const dots = images.map((_, i) => `<button class="gl-dot${i===0?" active":""}" onclick="glTo(${i})" aria-label="Slide ${i+1}"></button>`).join("");
  return `<div class="gl" id="gl">
  <div class="gl-track">${imgs}</div>
  <button class="gl-arrow gl-prev" onclick="glPrev()" aria-label="Prev">‹</button>
  <button class="gl-arrow gl-next" onclick="glNext()" aria-label="Next">›</button>
  <div class="gl-dots">${dots}</div>
</div>
<script>(function(){var I=document.querySelectorAll('.gl-img'),D=document.querySelectorAll('.gl-dot'),c=0;function go(n){I[c].classList.remove('active');D[c].classList.remove('active');c=(n+I.length)%I.length;I[c].classList.add('active');D[c].classList.add('active');}window.glTo=go;window.glPrev=function(){go(c-1);};window.glNext=function(){go(c+1);};var t=0;var el=document.getElementById('gl');el.addEventListener('touchstart',function(e){t=e.touches[0].clientX;},{passive:true});el.addEventListener('touchend',function(e){var d=e.changedTouches[0].clientX-t;if(Math.abs(d)>40){d<0?glNext():glPrev();}},{passive:true});})();<\/script>`;
}

// ── shared toggle script injected into every portfolio ─────────────────────
const themeToggle = `<button id="tt" onclick="tToggle()" aria-label="Toggle theme" title="Toggle dark/light"
style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;width:2.75rem;height:2.75rem;border-radius:50%;
border:1.5px solid rgba(128,128,128,.25);cursor:pointer;font-size:1.1rem;display:flex;align-items:center;
justify-content:center;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
box-shadow:0 4px 20px rgba(0,0,0,.3);transition:all .25s;"></button>
<script>(function(){
  var b=document.getElementById('tt'),r=document.documentElement,K='folio-theme';
  function apply(m){
    r.dataset.theme=m;
    b.textContent=m==='dark'?'☀️':'🌙';
    b.style.background=m==='dark'?'rgba(20,20,20,.9)':'rgba(248,248,248,.9)';
    b.style.color=m==='dark'?'#f0f0f0':'#111';
    try{localStorage.setItem(K,m);}catch(e){}
  }
  window.tToggle=function(){apply(r.dataset.theme==='dark'?'light':'dark');};
  var saved=null;try{saved=localStorage.getItem(K);}catch(e){}
  apply(saved||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
  window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(e){
    var s=null;try{s=localStorage.getItem(K);}catch(x){}if(!s)apply(e.matches?'dark':'light');
  });
})();<\/script>`;

const sharedCss = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{line-height:1.6;-webkit-font-smoothing:antialiased}
img{display:block;max-width:100%;height:auto}
a{color:inherit;text-decoration:none}
a:hover{text-decoration:underline}
.badge{
  display:inline-block;padding:.2em .75em;border-radius:9999px;
  font-size:.68rem;letter-spacing:.04em;margin:.15rem;
  border:1px solid var(--badge-border);color:var(--badge-color);background:var(--badge-bg);
}
.pcard{
  border-radius:1rem;overflow:hidden;
  background:var(--card-bg);border:1px solid var(--card-border);
  transition:transform .2s,box-shadow .2s;
}
.pcard:hover{transform:translateY(-3px);box-shadow:0 12px 32px var(--card-shadow);}
.pcard-img{width:100%;height:155px;object-fit:cover;}
.pcard-body{padding:1rem 1rem .9rem}
.pcard-name{font-weight:600;font-size:.9rem;margin-bottom:.3rem;color:var(--text-primary)}
.pcard-desc{font-size:.8rem;color:var(--text-muted);margin-bottom:.4rem;line-height:1.5}
.pcard-lang{font-size:.7rem;color:var(--text-faint);font-family:monospace;margin-bottom:.4rem}
.pcard-links{display:flex;gap:.75rem;font-size:.78rem;color:var(--accent)}
.exp,.edu{padding:.85rem 0;border-bottom:1px solid var(--line)}
.exp:last-child,.edu:last-child{border:none}
.exp-top,.edu-top{display:flex;justify-content:space-between;align-items:baseline;gap:.5rem;margin-bottom:.15rem}
.exp-role,.edu-deg{font-weight:600;font-size:.88rem;color:var(--text-primary)}
.exp-period,.edu-period{font-size:.72rem;color:var(--text-faint);white-space:nowrap}
.exp-co,.edu-school{font-size:.82rem;color:var(--text-muted)}
.exp-desc{font-size:.78rem;color:var(--text-faint);margin-top:.25rem;line-height:1.55}
.sec-label{font-size:.62rem;text-transform:uppercase;letter-spacing:.22em;color:var(--label);margin-bottom:1.1rem;}
/* gallery */
.gl{position:relative;border-radius:.85rem;overflow:hidden;aspect-ratio:16/9;max-height:480px;background:#000;margin-block:2rem;}
.gl-track{position:relative;width:100%;height:100%;}
.gl-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .4s;pointer-events:none;}
.gl-img.active{opacity:1;pointer-events:auto;}
.gl-arrow{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.5);color:#fff;border:none;width:2.25rem;height:2.25rem;border-radius:50%;font-size:1.3rem;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;transition:background .2s;}
.gl-arrow:hover{background:rgba(0,0,0,.8);}
.gl-prev{left:.6rem;}.gl-next{right:.6rem;}
.gl-dots{position:absolute;bottom:.65rem;left:50%;transform:translateX(-50%);display:flex;gap:.35rem;z-index:2;}
.gl-dot{width:.45rem;height:.45rem;border-radius:50%;background:rgba(255,255,255,.4);border:none;cursor:pointer;padding:0;transition:all .2s;}
.gl-dot.active{width:1.1rem;background:#fff;border-radius:.45rem;}
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. NOVA  — bold bento-grid dark-first design
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildNova(data: PortfolioData): { html: string; css: string } {
  const acc = data.accentColor || "#6366f1";
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="nova-body">
<div class="nova-wrap">

  <!-- Hero bento cell -->
  <div class="nova-bento">
    <div class="nova-cell nova-hero">
      ${data.avatar ? `<img src="${esc(data.avatar)}" class="nova-av" alt="${esc(data.name)}" />` : ""}
      <div class="nova-hero-text">
        <h1 class="nova-name">${esc(data.name)}</h1>
        ${data.title ? `<div class="nova-role">${esc(data.title)}</div>` : ""}
        ${data.location ? `<div class="nova-loc">📍 ${esc(data.location)}</div>` : ""}
      </div>
    </div>

    ${data.bio ? `<div class="nova-cell nova-bio-cell"><p class="nova-bio">${esc(data.bio)}</p></div>` : ""}

    ${data.skills?.length ? `
    <div class="nova-cell nova-skills-cell">
      <div class="sec-label">Skills</div>
      <div class="nova-skills">${skillBadges(data.skills)}</div>
    </div>` : ""}

    <div class="nova-cell nova-links-cell">
      <div class="sec-label">Connect</div>
      <div class="nova-links">${socialLinks(data)}</div>
    </div>
  </div>

  ${gallery}

  ${data.about ? `
  <section class="nova-section">
    <div class="sec-label">About</div>
    <p class="nova-about">${esc(data.about)}</p>
  </section>` : ""}

  ${data.experience?.length ? `
  <section class="nova-section">
    <div class="sec-label">Experience</div>
    ${expItems(data)}
  </section>` : ""}

  ${data.education?.length ? `
  <section class="nova-section">
    <div class="sec-label">Education</div>
    ${eduItems(data)}
  </section>` : ""}

  ${data.projects?.filter(p=>p.include!==false).length ? `
  <section class="nova-section">
    <div class="sec-label">Projects</div>
    <div class="nova-grid">${projectCards(data)}</div>
  </section>` : ""}

</div>
${themeToggle}
</body></html>`;

  const css = sharedCss + `
:root{--acc:${acc};}
.nova-body{
  font-family:'Outfit',sans-serif;
  background:var(--bg);color:var(--text-primary);
  transition:background .3s,color .3s;
}
[data-theme="dark"]{
  --bg:#0a0a0f;--bg2:#111118;--text-primary:#eeeef2;--text-muted:#9999aa;
  --text-faint:#666680;--accent:${acc};--label:#666680;
  --card-bg:#111118;--card-border:rgba(255,255,255,.07);--card-shadow:rgba(0,0,0,.4);
  --badge-bg:rgba(255,255,255,.05);--badge-border:rgba(255,255,255,.12);--badge-color:#ccccd8;
  --line:rgba(255,255,255,.07);
}
[data-theme="light"]{
  --bg:#f5f5fa;--bg2:#fff;--text-primary:#0f0f1a;--text-muted:#55556a;
  --text-faint:#9999aa;--accent:${acc};--label:#9999aa;
  --card-bg:#fff;--card-border:rgba(0,0,0,.08);--card-shadow:rgba(0,0,0,.08);
  --badge-bg:rgba(0,0,0,.04);--badge-border:rgba(0,0,0,.1);--badge-color:#33334a;
  --line:rgba(0,0,0,.08);
}
.nova-wrap{max-width:860px;margin:0 auto;padding:2.5rem 1.25rem 5rem;}
.nova-bento{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.75rem;}
@media(max-width:600px){.nova-bento{grid-template-columns:1fr;}}
.nova-cell{
  background:var(--card-bg);border:1px solid var(--card-border);
  border-radius:1.25rem;padding:1.5rem;
}
.nova-hero{
  grid-column:span 2;display:flex;align-items:center;gap:1.5rem;
  background:linear-gradient(135deg,var(--bg2) 60%, color-mix(in srgb,${acc} 12%,var(--bg2)));
}
@media(max-width:600px){.nova-hero{grid-column:span 1;}}
.nova-av{width:72px;height:72px;border-radius:1rem;object-fit:cover;flex-shrink:0;
  outline:3px solid ${acc};outline-offset:3px;}
.nova-name{font-size:clamp(1.6rem,4vw,2.4rem);font-weight:800;letter-spacing:-.04em;line-height:1.1;margin-bottom:.2rem;}
.nova-role{font-size:.82rem;color:${acc};font-weight:500;letter-spacing:.04em;margin-bottom:.2rem;}
.nova-loc{font-size:.75rem;color:var(--text-faint);}
.nova-bio-cell{grid-column:span 2;}
@media(max-width:600px){.nova-bio-cell{grid-column:span 1;}}
.nova-bio{font-size:.95rem;color:var(--text-muted);line-height:1.75;}
.nova-skills-cell{}
.nova-skills{display:flex;flex-wrap:wrap;gap:.2rem;}
.nova-links-cell{}
.nova-links{display:flex;flex-direction:column;gap:.5rem;}
.nova-links a{font-size:.83rem;color:${acc};display:inline-flex;align-items:center;gap:.3rem;}
.nova-links a::before{content:'→';font-size:.7rem;}
.nova-section{
  background:var(--card-bg);border:1px solid var(--card-border);
  border-radius:1.25rem;padding:1.5rem 1.5rem 1.25rem;
  margin-bottom:1rem;
}
.nova-about{font-size:.93rem;color:var(--text-muted);line-height:1.8;max-width:66ch;}
.nova-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:.85rem;margin-top:.5rem;}
`;
  return { html, css };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. PRISM  — animated gradient mesh + glassmorphism
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildPrism(data: PortfolioData): { html: string; css: string } {
  const acc = data.accentColor || "#a855f7";
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="prism-body">
  <div class="prism-mesh" aria-hidden="true">
    <div class="mesh-orb o1"></div><div class="mesh-orb o2"></div><div class="mesh-orb o3"></div>
  </div>
  <div class="prism-wrap">
    <header class="prism-hero">
      <div class="prism-glass prism-intro">
        ${data.avatar ? `<img src="${esc(data.avatar)}" class="prism-av" alt="${esc(data.name)}" />` : ""}
        <div>
          <h1 class="prism-name">${esc(data.name)}</h1>
          ${data.title ? `<div class="prism-role">${esc(data.title)}</div>` : ""}
          ${data.location ? `<div class="prism-loc">${esc(data.location)}</div>` : ""}
          ${data.bio ? `<p class="prism-bio">${esc(data.bio)}</p>` : ""}
          <div class="prism-links">${socialLinks(data)}</div>
        </div>
      </div>
      ${data.skills?.length ? `
      <div class="prism-glass prism-skills">
        <div class="sec-label">Skills</div>
        ${skillBadges(data.skills)}
      </div>` : ""}
    </header>

    ${gallery}

    ${data.about ? `
    <div class="prism-glass prism-sec">
      <div class="sec-label">About</div>
      <p class="prism-about">${esc(data.about)}</p>
    </div>` : ""}

    ${data.experience?.length ? `
    <div class="prism-glass prism-sec">
      <div class="sec-label">Experience</div>
      ${expItems(data)}
    </div>` : ""}

    ${data.education?.length ? `
    <div class="prism-glass prism-sec">
      <div class="sec-label">Education</div>
      ${eduItems(data)}
    </div>` : ""}

    ${data.projects?.filter(p=>p.include!==false).length ? `
    <div class="prism-glass prism-sec">
      <div class="sec-label">Projects</div>
      <div class="prism-pgrid">${projectCards(data)}</div>
    </div>` : ""}

  </div>
${themeToggle}
</body></html>`;

  const css = sharedCss + `
:root{--acc:${acc};}
[data-theme="dark"]{
  --bg:#07070f;--text-primary:#e8e4f8;--text-muted:#9990c0;--text-faint:#5f5888;
  --accent:${acc};--label:#5f5888;
  --glass-bg:rgba(255,255,255,.04);--glass-border:rgba(255,255,255,.08);
  --card-bg:rgba(255,255,255,.04);--card-border:rgba(255,255,255,.08);--card-shadow:rgba(0,0,0,.5);
  --badge-bg:rgba(168,85,247,.1);--badge-border:rgba(168,85,247,.25);--badge-color:#d8b4fe;
  --line:rgba(255,255,255,.07);
}
[data-theme="light"]{
  --bg:#faf8ff;--text-primary:#1a0a30;--text-muted:#5a4a7a;--text-faint:#9988bb;
  --accent:${acc};--label:#9988bb;
  --glass-bg:rgba(255,255,255,.7);--glass-border:rgba(168,85,247,.18);
  --card-bg:rgba(255,255,255,.75);--card-border:rgba(168,85,247,.15);--card-shadow:rgba(100,50,180,.08);
  --badge-bg:rgba(168,85,247,.08);--badge-border:rgba(168,85,247,.2);--badge-color:#6d28d9;
  --line:rgba(168,85,247,.12);
}
.prism-body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--text-primary);min-height:100vh;overflow-x:hidden;transition:background .3s,color .3s;}
.prism-mesh{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
.mesh-orb{position:absolute;border-radius:50%;filter:blur(90px);animation:mesh-float 16s ease-in-out infinite alternate;}
.o1{width:550px;height:550px;background:${acc};opacity:.15;top:-180px;left:-120px;animation-delay:0s;}
.o2{width:450px;height:450px;background:#06b6d4;opacity:.12;bottom:0;right:-100px;animation-delay:-6s;}
.o3{width:350px;height:350px;background:#f43f5e;opacity:.1;top:40%;left:35%;animation-delay:-11s;}
[data-theme="light"] .o1{opacity:.09;}[data-theme="light"] .o2{opacity:.07;}[data-theme="light"] .o3{opacity:.07;}
@keyframes mesh-float{0%{transform:translate(0,0) scale(1);}50%{transform:translate(35px,25px) scale(1.06);}100%{transform:translate(-15px,15px) scale(.96);}}
.prism-wrap{position:relative;z-index:1;max-width:800px;margin:0 auto;padding:3rem 1.25rem 5rem;}
.prism-glass{background:var(--glass-bg);border:1px solid var(--glass-border);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:1.25rem;padding:1.75rem;}
.prism-hero{display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:start;margin-bottom:1.25rem;}
@media(max-width:620px){.prism-hero{grid-template-columns:1fr;}}
.prism-intro{display:flex;gap:1.5rem;align-items:flex-start;}
.prism-av{width:78px;height:78px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid ${acc};}
.prism-name{font-size:clamp(1.7rem,4vw,2.5rem);font-weight:700;letter-spacing:-.03em;line-height:1.1;margin-bottom:.2rem;}
.prism-role{font-size:.78rem;color:${acc};letter-spacing:.07em;text-transform:uppercase;margin-bottom:.15rem;}
.prism-loc{font-size:.75rem;color:var(--text-faint);margin-bottom:.65rem;}
.prism-bio{font-size:.88rem;color:var(--text-muted);line-height:1.7;margin-bottom:.85rem;max-width:48ch;}
.prism-links{display:flex;flex-wrap:wrap;gap:.4rem .9rem;}
.prism-links a{font-size:.78rem;color:${acc};border-bottom:1px solid transparent;transition:border-color .2s;}
.prism-links a:hover{border-color:${acc};text-decoration:none;}
.prism-skills{min-width:170px;max-width:220px;}
@media(max-width:620px){.prism-skills{max-width:100%;}}
.prism-sec{margin-top:1.25rem;}
.prism-about{font-size:.92rem;color:var(--text-muted);line-height:1.8;max-width:64ch;}
.prism-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.85rem;margin-top:.6rem;}
`;
  return { html, css };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. FOLIO  — magazine editorial with oversized type + full-width header
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildFolio(data: PortfolioData): { html: string; css: string } {
  const acc = data.accentColor || "#e85d04";
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,400&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body class="folio-body">

<header class="folio-header">
  <div class="folio-header-inner">
    <div class="folio-eyebrow">${data.title ? esc(data.title) : "Portfolio"}</div>
    <h1 class="folio-name">${esc(data.name)}</h1>
    <div class="folio-header-foot">
      <div class="folio-hlinks">${socialLinks(data)}</div>
      ${data.location ? `<span class="folio-loc">${esc(data.location)}</span>` : ""}
    </div>
  </div>
  ${data.avatar ? `<img src="${esc(data.avatar)}" class="folio-av" alt="${esc(data.name)}" />` : ""}
</header>

<div class="folio-wrap">
  ${data.bio ? `<p class="folio-lead">${esc(data.bio)}</p>` : ""}

  ${gallery}

  <div class="folio-cols">
    <div class="folio-main">
      ${data.about ? `<section class="folio-sec"><h2 class="sec-label">About</h2><p class="folio-body-text">${esc(data.about)}</p></section>` : ""}
      ${data.experience?.length ? `<section class="folio-sec"><h2 class="sec-label">Experience</h2>${expItems(data)}</section>` : ""}
      ${data.projects?.filter(p=>p.include!==false).length ? `<section class="folio-sec"><h2 class="sec-label">Projects</h2><div class="folio-pgrid">${projectCards(data)}</div></section>` : ""}
    </div>
    <aside class="folio-aside">
      ${data.skills?.length ? `<section class="folio-sec"><h2 class="sec-label">Skills</h2><div class="folio-badges">${skillBadges(data.skills)}</div></section>` : ""}
      ${data.education?.length ? `<section class="folio-sec"><h2 class="sec-label">Education</h2>${eduItems(data)}</section>` : ""}
    </aside>
  </div>
</div>
${themeToggle}
</body></html>`;

  const css = sharedCss + `
:root{--acc:${acc};}
[data-theme="light"]{
  --bg:#fdfcf9;--bg-header:#111108;--text-primary:#111108;--text-muted:#555540;
  --text-faint:#999980;--accent:${acc};--label:#aaa090;
  --card-bg:#fff;--card-border:#e8e5de;--card-shadow:rgba(0,0,0,.06);
  --badge-bg:transparent;--badge-border:rgba(0,0,0,.18);--badge-color:#444430;
  --line:#e5e2d8;
}
[data-theme="dark"]{
  --bg:#0e0d09;--bg-header:#000;--text-primary:#f0edde;--text-muted:#aaa880;
  --text-faint:#706e50;--accent:${acc};--label:#706e50;
  --card-bg:#1a1810;--card-border:rgba(255,255,255,.08);--card-shadow:rgba(0,0,0,.4);
  --badge-bg:transparent;--badge-border:rgba(255,255,255,.15);--badge-color:#ccc8a8;
  --line:rgba(255,255,255,.07);
}
.folio-body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text-primary);transition:background .3s,color .3s;}
.folio-header{
  background:var(--bg-header);color:#f0ede6;
  padding:4rem 2rem 3rem;
  display:flex;align-items:flex-end;justify-content:space-between;gap:2rem;
  transition:background .3s;
}
.folio-header-inner{flex:1;}
.folio-eyebrow{font-size:.7rem;text-transform:uppercase;letter-spacing:.25em;color:${acc};margin-bottom:.75rem;}
.folio-name{
  font-family:'Fraunces',Georgia,serif;
  font-size:clamp(3rem,8vw,7rem);font-weight:900;
  line-height:.95;letter-spacing:-.04em;
  margin-bottom:1.5rem;
}
.folio-header-foot{display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;}
.folio-hlinks{display:flex;gap:1rem;flex-wrap:wrap;}
.folio-hlinks a{font-size:.8rem;color:rgba(240,237,230,.65);border-bottom:1px solid transparent;transition:border-color .2s,color .2s;}
.folio-hlinks a:hover{color:#fff;border-color:#fff;text-decoration:none;}
.folio-loc{font-size:.75rem;color:rgba(240,237,230,.4);}
.folio-av{width:120px;height:150px;object-fit:cover;border-radius:.5rem;flex-shrink:0;
  outline:3px solid ${acc};outline-offset:4px;}
.folio-wrap{max-width:1080px;margin:0 auto;padding:3rem 2rem 5rem;}
.folio-lead{
  font-family:'Fraunces',Georgia,serif;
  font-size:clamp(1.3rem,3vw,1.9rem);font-weight:300;font-style:italic;
  line-height:1.5;color:var(--text-muted);max-width:70ch;
  border-left:3px solid ${acc};padding-left:1.5rem;margin-bottom:3rem;
}
.folio-cols{display:grid;grid-template-columns:1fr 260px;gap:3.5rem;}
@media(max-width:760px){.folio-cols{grid-template-columns:1fr;}}
.folio-sec{margin-bottom:2.75rem;}
.folio-body-text{font-size:.95rem;line-height:1.85;color:var(--text-muted);max-width:62ch;}
.folio-badges{display:flex;flex-wrap:wrap;gap:.25rem;}
.folio-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;margin-top:.75rem;}
`;
  return { html, css };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. VOID  — brutalist terminal / hacker aesthetic
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildVoid(data: PortfolioData): { html: string; css: string } {
  const acc = data.accentColor || "#00ff88";
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const skills = (data.skills ?? []).map(s => `<span class="badge v-badge">${esc(s)}</span>`).join("");
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,700;1,300&display=swap" rel="stylesheet">
</head>
<body class="void-body">
<div class="void-scan" aria-hidden="true"></div>
<div class="void-wrap">
  <header class="void-header">
    <div class="void-prompt"><span class="void-cursor">▋</span></div>
    <h1 class="void-name">${esc(data.name)}</h1>
    ${data.title ? `<div class="void-role">// ${esc(data.title)}</div>` : ""}
    ${data.location ? `<div class="void-meta"># ${esc(data.location)}</div>` : ""}
    ${data.bio ? `<div class="void-meta void-bio">> ${esc(data.bio)}</div>` : ""}
    <div class="void-links">${socialLinks(data)}</div>
  </header>

  ${gallery}

  ${data.about ? `
  <section class="void-block">
    <div class="void-block-label">$ cat about.txt</div>
    <p class="void-text">${esc(data.about)}</p>
  </section>` : ""}

  ${data.skills?.length ? `
  <section class="void-block">
    <div class="void-block-label">$ ls ./skills</div>
    <div class="void-skills">${skills}</div>
  </section>` : ""}

  ${data.experience?.length ? `
  <section class="void-block">
    <div class="void-block-label">$ cat experience.log</div>
    ${expItems(data)}
  </section>` : ""}

  ${data.education?.length ? `
  <section class="void-block">
    <div class="void-block-label">$ cat education.log</div>
    ${eduItems(data)}
  </section>` : ""}

  ${data.projects?.filter(p=>p.include!==false).length ? `
  <section class="void-block">
    <div class="void-block-label">$ ls ./projects</div>
    <div class="void-pgrid">${projectCards(data, "v-pcard")}</div>
  </section>` : ""}

</div>
${themeToggle}
</body></html>`;

  const css = sharedCss + `
:root{--acc:${acc};}
[data-theme="dark"]{
  --bg:#020c06;--text-primary:${acc};--text-muted:rgba(0,255,136,.65);
  --text-faint:rgba(0,255,136,.35);--accent:${acc};--label:rgba(0,255,136,.5);
  --card-bg:rgba(0,255,136,.03);--card-border:rgba(0,255,136,.15);--card-shadow:rgba(0,255,136,.05);
  --badge-bg:rgba(0,255,136,.08);--badge-border:rgba(0,255,136,.3);--badge-color:${acc};
  --line:rgba(0,255,136,.15);
}
[data-theme="light"]{
  --bg:#f0fff6;--text-primary:#003318;--text-muted:#1a5c36;--text-faint:#5a9070;
  --accent:#006633;--label:#5a9070;
  --card-bg:#e8f8ef;--card-border:rgba(0,102,51,.2);--card-shadow:rgba(0,80,40,.07);
  --badge-bg:rgba(0,102,51,.07);--badge-border:rgba(0,102,51,.25);--badge-color:#004422;
  --line:rgba(0,102,51,.15);
}
.void-body{font-family:'JetBrains Mono',monospace;background:var(--bg);color:var(--text-primary);min-height:100vh;transition:background .3s,color .3s;}
.void-scan{
  position:fixed;inset:0;z-index:0;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,136,.012) 2px,rgba(0,255,136,.012) 4px);
}
[data-theme="light"] .void-scan{background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,80,40,.015) 2px,rgba(0,80,40,.015) 4px);}
.void-wrap{position:relative;z-index:1;max-width:820px;margin:0 auto;padding:3rem 1.25rem 5rem;}
.void-header{border:1px solid var(--line);border-radius:.5rem;padding:2rem;margin-bottom:2rem;}
.void-prompt{font-size:.7rem;color:var(--text-faint);margin-bottom:.5rem;letter-spacing:.05em;}
.void-cursor{animation:blink 1s step-end infinite;}
@keyframes blink{0%,100%{opacity:1;}50%{opacity:0;}}
.void-name{font-size:clamp(1.8rem,5vw,3.2rem);font-weight:700;letter-spacing:-.02em;line-height:1.1;margin-bottom:.4rem;text-shadow:0 0 20px ${acc}55;}
.void-role{font-size:.8rem;color:var(--text-muted);margin-bottom:.2rem;font-style:italic;}
.void-meta{font-size:.78rem;color:var(--text-faint);margin-bottom:.15rem;}
.void-bio{margin-bottom:.75rem;max-width:55ch;}
.void-links{display:flex;flex-wrap:wrap;gap:.5rem .9rem;margin-top:.75rem;}
.void-links a{font-size:.75rem;color:var(--accent);border:1px solid var(--line);padding:.2em .65em;border-radius:.25rem;transition:background .2s,color .2s;}
.void-links a:hover{background:var(--accent);color:var(--bg);text-decoration:none;}
.void-block{border-left:2px solid var(--line);padding:1.25rem 1.5rem;margin-bottom:1.75rem;}
.void-block-label{font-size:.72rem;color:var(--label);margin-bottom:1rem;letter-spacing:.05em;}
.void-text{font-size:.82rem;line-height:1.85;color:var(--text-muted);max-width:64ch;white-space:pre-wrap;}
.void-skills{display:flex;flex-wrap:wrap;gap:.25rem;}
.v-badge{border-radius:.25rem !important;font-family:'JetBrains Mono',monospace;}
.void-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.85rem;margin-top:.5rem;}
.v-pcard{border-radius:.5rem !important;}
`;
  return { html, css };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. BLOOM  — soft pastel organic with warm gradients
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function buildBloom(data: PortfolioData): { html: string; css: string } {
  const acc = data.accentColor || "#f97316";
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
<meta name="description" content="${esc(data.bio || data.about || data.name + "'s portfolio")}" />
<link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,300;0,400;0,600;0,700;0,800;1,300&family=Lora:ital@1&display=swap" rel="stylesheet">
</head>
<body class="bloom-body">
<div class="bloom-top-gradient" aria-hidden="true"></div>
<div class="bloom-wrap">

  <header class="bloom-hero">
    <div class="bloom-pill-row">
      ${data.location ? `<span class="bloom-pill">📍 ${esc(data.location)}</span>` : ""}
      ${data.title ? `<span class="bloom-pill bloom-pill-acc">${esc(data.title)}</span>` : ""}
    </div>
    <div class="bloom-hero-inner">
      <div class="bloom-hero-text">
        <h1 class="bloom-name">${esc(data.name)}</h1>
        ${data.bio ? `<p class="bloom-bio">${esc(data.bio)}</p>` : ""}
        <div class="bloom-links">${socialLinks(data)}</div>
      </div>
      ${data.avatar ? `<div class="bloom-av-wrap"><img src="${esc(data.avatar)}" class="bloom-av" alt="${esc(data.name)}" /></div>` : ""}
    </div>
  </header>

  ${gallery}

  ${data.about || data.skills?.length ? `
  <div class="bloom-row">
    ${data.about ? `
    <div class="bloom-card bloom-about-card">
      <div class="sec-label">About</div>
      <p class="bloom-about">${esc(data.about)}</p>
    </div>` : ""}
    ${data.skills?.length ? `
    <div class="bloom-card bloom-skills-card">
      <div class="sec-label">Skills</div>
      <div class="bloom-badges">${skillBadges(data.skills)}</div>
    </div>` : ""}
  </div>` : ""}

  ${data.experience?.length ? `
  <div class="bloom-card">
    <div class="sec-label">Experience</div>
    ${expItems(data)}
  </div>` : ""}

  ${data.education?.length ? `
  <div class="bloom-card">
    <div class="sec-label">Education</div>
    ${eduItems(data)}
  </div>` : ""}

  ${data.projects?.filter(p=>p.include!==false).length ? `
  <div class="bloom-card">
    <div class="sec-label">Projects</div>
    <div class="bloom-pgrid">${projectCards(data)}</div>
  </div>` : ""}

</div>
${themeToggle}
</body></html>`;

  const css = sharedCss + `
:root{--acc:${acc};}
[data-theme="light"]{
  --bg:#fef9f5;--text-primary:#1c1208;--text-muted:#6b5040;--text-faint:#b09880;
  --accent:${acc};--label:#c0a890;
  --card-bg:#fff;--card-border:#f0e8df;--card-shadow:rgba(200,120,60,.06);
  --badge-bg:#fff7f0;--badge-border:#f0cdb0;--badge-color:#7a4010;
  --line:#f0e8df;--grad1:#fde7d0;--grad2:#fef3ea;--grad3:#fff0e8;
}
[data-theme="dark"]{
  --bg:#120d08;--text-primary:#f5e8d8;--text-muted:#c09070;--text-faint:#806050;
  --accent:${acc};--label:#806050;
  --card-bg:#1e160f;--card-border:rgba(255,200,120,.1);--card-shadow:rgba(0,0,0,.3);
  --badge-bg:rgba(249,115,22,.08);--badge-border:rgba(249,115,22,.25);--badge-color:#fdba74;
  --line:rgba(255,200,120,.1);--grad1:#2a1a0e;--grad2:#1e150c;--grad3:#160f08;
}
.bloom-body{font-family:'Nunito',sans-serif;background:var(--bg);color:var(--text-primary);transition:background .3s,color .3s;overflow-x:hidden;}
.bloom-top-gradient{position:fixed;top:0;left:0;right:0;height:320px;background:radial-gradient(ellipse at top,var(--grad1),transparent 70%);z-index:0;pointer-events:none;transition:background .3s;}
.bloom-wrap{position:relative;z-index:1;max-width:860px;margin:0 auto;padding:3rem 1.25rem 5rem;}
.bloom-hero{margin-bottom:2rem;}
.bloom-pill-row{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.25rem;}
.bloom-pill{font-size:.72rem;padding:.3em .85em;border-radius:9999px;background:var(--card-bg);border:1px solid var(--card-border);color:var(--text-muted);}
.bloom-pill-acc{background:${acc};border-color:${acc};color:#fff;}
.bloom-hero-inner{display:flex;align-items:flex-start;justify-content:space-between;gap:2rem;}
.bloom-hero-text{flex:1;}
.bloom-name{font-size:clamp(2.2rem,6vw,4rem);font-weight:800;letter-spacing:-.04em;line-height:1.05;margin-bottom:.75rem;}
.bloom-bio{font-family:'Lora',Georgia,serif;font-size:1rem;font-style:italic;color:var(--text-muted);line-height:1.72;margin-bottom:1rem;max-width:52ch;}
.bloom-links{display:flex;flex-wrap:wrap;gap:.4rem .9rem;}
.bloom-links a{font-size:.8rem;color:var(--accent);font-weight:600;}
.bloom-av-wrap{flex-shrink:0;}
.bloom-av{
  width:100px;height:100px;border-radius:50%;object-fit:cover;
  border:4px solid var(--card-border);
  box-shadow:0 0 0 6px var(--grad1);
}
.bloom-row{display:grid;grid-template-columns:1fr auto;gap:1rem;margin-bottom:1rem;align-items:start;}
@media(max-width:640px){.bloom-row{grid-template-columns:1fr;}}
.bloom-card{
  background:var(--card-bg);border:1px solid var(--card-border);
  border-radius:1.5rem;padding:1.5rem 1.5rem 1.25rem;
  margin-bottom:1rem;
  box-shadow:0 2px 24px var(--card-shadow);
}
.bloom-about-card{flex:1;}
.bloom-skills-card{min-width:190px;max-width:240px;}
@media(max-width:640px){.bloom-skills-card{max-width:100%;}}
.bloom-about{font-size:.93rem;line-height:1.82;color:var(--text-muted);max-width:60ch;}
.bloom-badges{display:flex;flex-wrap:wrap;gap:.25rem;}
.bloom-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.85rem;margin-top:.75rem;}
`;
  return { html, css };
}

// ── Public API ─────────────────────────────────────────────────────────────────
export function buildSite(data: PortfolioData, template: TemplateId): { html: string; css: string } {
  if (template === "split")     return buildPrism(data);      // split → Prism
  if (template === "editorial") return buildFolio(data);      // editorial → Folio
  if (template === "aurora")    return buildVoid(data);       // aurora → Void
  if (template === "minimal")   return buildBloom(data);      // minimal → Bloom
  return buildNova(data);                                      // centered → Nova
}
