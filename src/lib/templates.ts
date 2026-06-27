import type { PortfolioData, TemplateId, CustomSection } from "./types";

// ── helpers ────────────────────────────────────────────────────────────────────
function esc(s: string | undefined | null): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function skillBadges(skills: string[]): string {
  return skills.map(s => `<span class="badge">${esc(s)}</span>`).join("");
}
function socialLinks(data: PortfolioData): string {
  const links: string[] = [];
  if (data.email)   links.push(`<a href="mailto:${esc(data.email)}">${esc(data.email)}</a>`);
  if (data.website) links.push(`<a href="${esc(data.website)}" target="_blank" rel="noopener">${esc(data.website.replace(/^https?:\/\//, ""))}</a>`);
  if (data.github)  links.push(`<a href="https://github.com/${esc(data.github)}" target="_blank" rel="noopener">github.com/${esc(data.github)}</a>`);
  (data.links ?? []).forEach(l => links.push(`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`));
  return links.join("");
}
function projectCards(data: PortfolioData): string {
  return (data.projects ?? [])
    .filter(p => p.include !== false)
    .map(p => {
      const img = p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" class="pc-img" loading="lazy" />` : "";
      const gh  = p.githubUrl ? `<a href="${esc(p.githubUrl)}" class="pc-link" target="_blank" rel="noopener">GitHub</a>` : "";
      const live = p.url ? `<a href="${esc(p.url)}" class="pc-link" target="_blank" rel="noopener">Live</a>` : "";
      return `<div class="pc">${img}<div class="pc-body"><div class="pc-name">${esc(p.name)}</div><div class="pc-desc">${esc(p.description)}</div><div class="pc-links">${gh}${live}</div></div></div>`;
    }).join("");
}
function expItems(data: PortfolioData): string {
  return (data.experience ?? []).map(e =>
    `<div class="timeline-item"><div class="ti-head"><span class="ti-role">${esc(e.role)}</span><span class="ti-sep">·</span><span class="ti-co">${esc(e.company)}</span></div><div class="ti-period">${esc(e.period)}</div>${e.description ? `<div class="ti-desc">${esc(e.description)}</div>` : ""}</div>`
  ).join("");
}
function eduItems(data: PortfolioData): string {
  return (data.education ?? []).map(e =>
    `<div class="timeline-item"><div class="ti-head"><span class="ti-role">${esc(e.degree)}</span><span class="ti-sep">·</span><span class="ti-co">${esc(e.school)}</span></div><div class="ti-period">${esc(e.period)}</div></div>`
  ).join("");
}
function gallerySection(images: string[]): string {
  if (!images?.length) return "";
  const items = images.map(src =>
    `<div class="gal-item"><img src="${esc(src)}" alt="Gallery" class="gal-img" loading="lazy" /></div>`
  ).join("");
  return `<div class="gal-strip" id="gallery"><div class="gal-track">${items}</div></div>`;
}

// ── Custom section & ordered section renderer ─────────────────────────────────
function renderCustomSection(sec: CustomSection, cssPrefix: string): string {
  if (!sec.content?.trim()) return "";
  const paragraphs = sec.content
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return "";
      const isList = lines.every((l) => /^[•\-\*]/.test(l));
      if (isList) {
        const items = lines.map((l) => `<li>${esc(l.replace(/^[•\-\*]\s*/, ""))}</li>`).join("");
        return `<ul class="custom-list">${items}</ul>`;
      }
      return `<p>${lines.map(esc).join("<br/>")}</p>`;
    })
    .join("");
  return `<section class="${cssPrefix}-sec sr custom-sec">
  <h2 class="${cssPrefix}-sec-label">${esc(sec.label)}</h2>
  <div class="custom-sec-body">${paragraphs}</div>
</section>`;
}

const DEFAULT_SECTION_ORDER_TPL = ["hero", "skills", "experience", "projects", "education", "links"];

type SectionRendererFn = (data: PortfolioData) => string;

function renderOrderedSections(
  data: PortfolioData,
  renderers: Record<string, SectionRendererFn>,
  cssPrefix: string
): string {
  const order: string[] = data.sectionOrder?.length
    ? data.sectionOrder
    : DEFAULT_SECTION_ORDER_TPL;
  const customMap = new Map((data.customSections ?? []).map((s) => [s.id, s]));
  return order
    .filter((id) => id !== "hero")
    .map((id) => {
      if (renderers[id]) return renderers[id](data);
      const custom = customMap.get(id);
      if (custom) return renderCustomSection(custom, cssPrefix);
      return "";
    })
    .join("\n");
}

// ── SEO head ──────────────────────────────────────────────────────────────────
function buildSeoHead(data: PortfolioData): string {
  const desc = data.bio || data.about || `${data.name} — Portfolio`;
  const img  = data.avatar || "";
  return `
<meta name="description" content="${esc(desc.slice(0, 160))}" />
<meta property="og:title" content="${esc(data.name)} — Portfolio" />
<meta property="og:description" content="${esc(desc.slice(0, 160))}" />
${img ? `<meta property="og:image" content="${esc(img)}" />` : ""}
<meta name="twitter:card" content="summary_large_image" />`.trim();
}

// ── Shared CSS (B&W base + tokens) ────────────────────────────────────────────
const bwBase = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;}
body{min-height:100dvh;}

/* ── Themes ── */
[data-theme="light"]{
  --bg:#fafaf9;--bg2:#f4f4f0;--card-bg:#ffffff;--card-border:#e5e5e1;
  --card-shadow:rgba(0,0,0,.07);--text-primary:#111;--text-secondary:#333;
  --text-muted:#666;--text-faint:#999;--line:#e5e5e1;
  --accent:var(--accent-user,#7c3aed);
  --accent-mid:var(--accent-user,#7c3aed);
  --accent-bg:color-mix(in oklab,var(--accent) 8%,transparent);
}
[data-theme="dark"]{
  --bg:#111110;--bg2:#181817;--card-bg:#1c1c1b;--card-border:#2a2a28;
  --card-shadow:rgba(0,0,0,.4);--text-primary:#f0f0ed;--text-secondary:#ccc;
  --text-muted:#999;--text-faint:#555;--line:#2a2a28;
  --accent:var(--accent-user,#a78bfa);
  --accent-mid:var(--accent-user,#a78bfa);
  --accent-bg:color-mix(in oklab,var(--accent) 12%,transparent);
}

body{background:var(--bg);color:var(--text-primary);transition:background .3s,color .3s;}

/* ── Accent injection ── */
:root{--accent-user:inherit;}

/* ── Shared card ── */
.fc-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:1.5rem;box-shadow:0 2px 24px var(--card-shadow);}

/* ── Timeline ── */
.timeline-item{padding:.75rem 0;border-bottom:1px solid var(--line);animation:fadeUp .4s both;}
.timeline-item:last-child{border-bottom:none;}
.ti-head{display:flex;flex-wrap:wrap;gap:.3rem;align-items:baseline;margin-bottom:.2rem;}
.ti-role{font-weight:600;font-size:.9rem;color:var(--text-primary);}
.ti-sep{color:var(--text-faint);font-size:.75rem;}
.ti-co{font-size:.85rem;color:var(--text-muted);}
.ti-period{font-size:.72rem;color:var(--text-faint);letter-spacing:.04em;margin-bottom:.25rem;}
.ti-desc{font-size:.82rem;line-height:1.6;color:var(--text-muted);}

/* ── Project cards ── */
.pc{border:1px solid var(--card-border);border-radius:.75rem;overflow:hidden;transition:box-shadow .2s,transform .2s;background:var(--bg2);}
.pc:hover{box-shadow:0 8px 24px var(--card-shadow);transform:translateY(-2px);}
.pc-img{width:100%;aspect-ratio:16/9;object-fit:cover;}
.pc-body{padding:.75rem;}
.pc-name{font-weight:600;font-size:.88rem;color:var(--text-primary);margin-bottom:.25rem;}
.pc-desc{font-size:.78rem;line-height:1.5;color:var(--text-muted);margin-bottom:.5rem;}
.pc-links{display:flex;gap:.5rem;}
.pc-link{font-size:.72rem;color:var(--accent);text-decoration:none;border:1px solid var(--accent);border-radius:999px;padding:.15em .65em;transition:background .2s,color .2s;}
.pc-link:hover{background:var(--accent);color:#fff;}

/* ── Badge ── */
.badge{display:inline-block;font-size:.7rem;padding:.2em .65em;border-radius:999px;background:var(--accent-bg);color:var(--accent);border:1px solid color-mix(in oklab,var(--accent) 25%,transparent);font-weight:500;}

/* ── Section label ── */
.sec-label{font-size:.65rem;letter-spacing:.18em;text-transform:uppercase;color:var(--text-faint);margin-bottom:.75rem;font-weight:500;}

/* ── Custom sections ── */
.custom-sec-body{font-size:.88rem;line-height:1.75;color:var(--text-muted);}
.custom-sec-body p{margin-bottom:.6rem;}
.custom-list{padding-left:1.2rem;list-style:disc;display:flex;flex-direction:column;gap:.25rem;}

/* ── Gallery strip ── */
.gal-strip{overflow-x:auto;margin:1.5rem 0;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
.gal-strip::-webkit-scrollbar{display:none;}
.gal-track{display:flex;gap:.75rem;width:max-content;}
.gal-item{flex-shrink:0;width:220px;border-radius:.75rem;overflow:hidden;border:1px solid var(--card-border);}
.gal-img{width:100%;height:160px;object-fit:cover;}

/* ── Nav ── */
.fc-nav{position:sticky;top:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:.75rem 1.5rem;backdrop-filter:blur(12px);background:color-mix(in oklab,var(--bg) 80%,transparent);border-bottom:1px solid var(--card-border);animation:fadeIn .4s both;}
.fc-nav-brand{font-size:.8rem;font-weight:600;letter-spacing:.04em;color:var(--text-primary);text-decoration:none;}
.fc-nav-links{display:flex;gap:1.25rem;align-items:center;}
.fc-nav-links a{font-size:.72rem;color:var(--text-muted);text-decoration:none;letter-spacing:.06em;text-transform:uppercase;transition:color .2s;}
.fc-nav-links a:hover{color:var(--text-primary);}

/* ── Theme toggle ── */
.theme-btn{
  background:none;border:1px solid var(--card-border);border-radius:999px;
  padding:.35rem .7rem;cursor:pointer;font-size:.75rem;color:var(--text-muted);
  display:flex;align-items:center;gap:.3rem;transition:border-color .2s,color .2s;
}
.theme-btn:hover{border-color:var(--text-muted);color:var(--text-primary);}
.fixed-theme-btn{position:fixed;bottom:1.25rem;right:1.25rem;z-index:200;box-shadow:0 2px 12px var(--card-shadow);}

/* ── Loader ── */
.fc-loader{
  position:fixed;inset:0;z-index:999;background:var(--bg);
  display:flex;align-items:center;justify-content:center;
  animation:loaderOut .3s .8s cubic-bezier(.4,0,.2,1) forwards;
}
.fc-loader-ring{
  width:36px;height:36px;border:2.5px solid var(--card-border);
  border-top-color:var(--accent);border-radius:50%;
  animation:spin .7s linear infinite;
}

/* ── Avatar entrance ── */
.fc-av-anim{animation:avPop .65s .25s cubic-bezier(.16,1,.3,1) both;}

/* ── Typing cursor ── */
.fc-typing::after{content:'|';animation:blink .9s step-end infinite;margin-left:.05em;color:var(--accent);}

/* ── Scroll reveal ── */
.sr{opacity:0;transform:translateY(18px);transition:opacity .55s cubic-bezier(.16,1,.3,1),transform .55s cubic-bezier(.16,1,.3,1);}
.sr-d1{transition-delay:.05s!important;}
.sr-d2{transition-delay:.1s!important;}
.sr-d3{transition-delay:.15s!important;}
.sr-d4{transition-delay:.2s!important;}
.sr-d5{transition-delay:.25s!important;}
.sr.sr-visible{opacity:1;transform:none;}

/* ── Keyframes ── */
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes slideInLeft{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}
@keyframes slideInRight{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
@keyframes mastheadDrop{from{opacity:0;transform:translateY(-16px)}to{opacity:1;transform:none}}
@keyframes monoHeroIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes drawLine{from{transform:scaleX(0);transform-origin:left}to{transform:scaleX(1)}}
@keyframes avPop{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes loaderOut{to{opacity:0;pointer-events:none}}
`;

// ── Theme toggle — starts showing ☀ Light because page opens in dark mode ──
const themeToggle = `<button class="theme-btn fixed-theme-btn" id="tt" aria-label="Toggle theme">☀ Light</button>
<script>
(function(){
  var btn=document.getElementById('tt');
  var html=document.documentElement;
  function apply(t){
    html.setAttribute('data-theme',t);
    btn.textContent=t==='dark'?'☀ Light':'☾ Dark';
  }
  btn.addEventListener('click',function(){apply(html.getAttribute('data-theme')==='dark'?'light':'dark');});
  // Respect system preference only if user hasn't set a saved pref
  try{
    var saved=localStorage.getItem('folio-theme');
    if(saved){apply(saved);return;}
  }catch(e){}
  // Default: dark
  apply('dark');
  // Watch for changes and persist
  new MutationObserver(function(){
    try{localStorage.setItem('folio-theme',html.getAttribute('data-theme'));}catch(e){}
  }).observe(html,{attributes:true,attributeFilter:['data-theme']});
})();
<\/script>`;

const scrollRevealScript = `<script>
(function(){
  const els=document.querySelectorAll('.sr');
  const io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('sr-visible');io.unobserve(e.target);}
    });
  },{threshold:.1});
  els.forEach(function(el){io.observe(el);});
  // Accent color injection
  const accent=document.documentElement.dataset.accent;
  if(accent){document.documentElement.style.setProperty('--accent-user',accent);}
})();
<\/script>`;

// ════════════════════════════════════════════════════════════════════════════════
// NAV
// ════════════════════════════════════════════════════════════════════════════════
function buildLoader(name: string): string {
  return `<div class="fc-loader" aria-hidden="true"><div class="fc-loader-ring"></div></div>`;
}

// ════════════════════════════════════════════════════════════════════════════════
// Shared accent injection helper
// ════════════════════════════════════════════════════════════════════════════════
function accentStyle(data: PortfolioData): string {
  if (!data.accentColor) return "";
  return `<style>:root{--accent-user:${data.accentColor};}</style>`;
}

// ════════════════════════════════════════════════════════════════════════════════
// Font injection helper
// ════════════════════════════════════════════════════════════════════════════════
const FONT_LINKS: Record<string, string> = {
  "playfair": `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap" rel="stylesheet">`,
  "roboto-mono": `<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;700&display=swap" rel="stylesheet">`,
  "syne": `<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet">`,
  "dm-sans": `<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&display=swap" rel="stylesheet">`,
};
function fontLink(data: PortfolioData): string {
  return data.fontFamily && FONT_LINKS[data.fontFamily] ? FONT_LINKS[data.fontFamily] : "";
}

function buildNav(name: string): string {
  return `<nav class="fc-nav">
  <a class="fc-nav-brand" href="#home">${esc(name) || "Portfolio"}</a>
  <div class="fc-nav-links">
    <a href="#about">About</a>
    <a href="#project">Work</a>
  </div>
</nav>`;
}

// ── Centered/Quiet (template: "centered") ────────────────────────────────────
function buildCentered(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const centRenderers: Record<string, (d: PortfolioData) => string> = {
    skills:     (d) => d.skills?.length ? `<section class="cent-sec sr"><h2 class="sec-label">Skills</h2><div class="cent-badges">${skillBadges(d.skills)}</div></section>` : "",
    experience: (d) => d.experience?.length ? `<section class="cent-sec sr sr-d1"><h2 class="sec-label">Experience</h2>${expItems(d)}</section>` : "",
    projects:   (d) => d.projects?.filter(p => p.include !== false).length ? `<section class="cent-sec sr sr-d2" id="project"><h2 class="sec-label">Projects</h2><div class="cent-pgrid">${projectCards(d)}</div></section>` : "",
    education:  (d) => d.education?.length ? `<section class="cent-sec sr sr-d3"><h2 class="sec-label">Education</h2>${eduItems(d)}</section>` : "",
    links:      (d) => d.links?.length ? `<section class="cent-sec sr"><h2 class="sec-label">Links</h2><div class="cent-links-extra">${socialLinks(d)}</div></section>` : "",
  };
  const centSections = renderOrderedSections(data, centRenderers, "cent");

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark"${data.accentColor ? ` data-accent="${esc(data.accentColor)}"` : ""}>
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
${buildSeoHead(data)}
${accentStyle(data)}
${fontLink(data)}
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body class="cent-body">

${buildLoader(data.name)}
${buildNav(data.name)}

<div class="cent-outer" id="home">
  <div class="fc-card cent-card" id="about">
    <header class="cent-head">
      ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="cent-av fc-av-anim" />` : ""}
      <h1 class="cent-name fc-typing">${esc(data.name)}</h1>
      ${data.title ? `<div class="cent-title">${esc(data.title)}</div>` : ""}
      ${data.location ? `<div class="cent-loc">${esc(data.location)}</div>` : ""}
      <div class="cent-links">${socialLinks(data)}</div>
    </header>
    ${data.bio || data.about ? `
    <section class="cent-sec cent-bio sr">
      ${data.bio ? `<p class="cent-lead">${esc(data.bio)}</p>` : ""}
      ${data.about ? `<p class="cent-body">${esc(data.about)}</p>` : ""}
    </section>` : ""}
    ${gallery}
    ${centSections}
  </div>
</div>
${themeToggle}
${scrollRevealScript}
</body></html>`;

  const css = bwBase + `
.cent-body{font-family:'Inter',system-ui,sans-serif;}
.cent-outer{padding:2rem;max-width:680px;margin:0 auto;}
.cent-card{padding:2.5rem 2rem 3rem;}
.cent-head{display:flex;flex-direction:column;align-items:center;text-align:center;padding-bottom:2rem;gap:.4rem;animation:fadeUp .6s both;}
.cent-av{width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--card-border);margin-bottom:.5rem;transition:box-shadow .3s,transform .3s;}
.cent-av:hover{box-shadow:0 8px 28px var(--card-shadow);transform:scale(1.07);}
.cent-name{font-size:clamp(1.6rem,5vw,2.6rem);font-weight:700;letter-spacing:-.04em;line-height:1.1;color:var(--text-primary);}
.cent-title{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-faint);}
.cent-loc{font-size:.75rem;color:var(--text-faint);}
.cent-links{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;margin-top:.5rem;}
.cent-links a{font-size:.75rem;color:var(--text-muted);text-decoration:none;border-bottom:1px solid var(--line);padding-bottom:.1rem;transition:color .2s,border-color .2s;}
.cent-links a:hover{color:var(--accent);border-color:var(--accent);}
.cent-sec{margin-bottom:2rem;}
.cent-bio{border-bottom:1px solid var(--line);padding-bottom:2rem;margin-bottom:2rem;}
.cent-lead{font-size:1.05rem;line-height:1.75;color:var(--text-secondary);margin-bottom:.75rem;}
.cent-body{font-size:.9rem;line-height:1.8;color:var(--text-muted);}
.cent-badges{display:flex;flex-wrap:wrap;gap:.3rem;}
.cent-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;margin-top:.5rem;}
.cent-links-extra{display:flex;flex-wrap:wrap;gap:.5rem;}
`;
  return { html, css };
}

// ════════════════════════════════════════════════════════════════════════════════
// 1. INK — Editorial newspaper  (template: "editorial")
// ════════════════════════════════════════════════════════════════════════════════
function buildInk(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const inkRenderers: Record<string, (d: PortfolioData) => string> = {
    skills:     (d) => d.skills?.length ? `<section class="ink-sec sr"><h2 class="sec-label">Skills</h2><div class="ink-badges">${skillBadges(d.skills)}</div></section>` : "",
    experience: (d) => d.experience?.length ? `<section class="ink-sec sr sr-d1"><h2 class="sec-label">Experience</h2>${expItems(d)}</section>` : "",
    projects:   (d) => d.projects?.filter(p => p.include !== false).length ? `<section class="ink-sec sr sr-d2" id="project"><h2 class="sec-label">Projects</h2><div class="ink-pgrid">${projectCards(d)}</div></section>` : "",
    education:  (d) => d.education?.length ? `<section class="ink-sec sr sr-d3"><h2 class="sec-label">Education</h2>${eduItems(d)}</section>` : "",
    links:      (d) => d.links?.length ? `<section class="ink-sec sr"><h2 class="sec-label">Links</h2><div class="ink-links-extra">${socialLinks(d)}</div></section>` : "",
  };
  const inkSections = renderOrderedSections(data, inkRenderers, "ink");

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark"${data.accentColor ? ` data-accent="${esc(data.accentColor)}"` : ""}>
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
${buildSeoHead(data)}
${accentStyle(data)}
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body class="ink-body">

${buildLoader(data.name)}
${buildNav(data.name)}

<div class="ink-outer" id="home">
  <div class="fc-card ink-card">
    <header class="ink-masthead">
      <div class="ink-dateline">${data.location ? esc(data.location) + " · " : ""}Portfolio</div>
      <h1 class="ink-nameplate fc-typing">${esc(data.name)}</h1>
      <div class="ink-rule ink-rule-anim"></div>
      <div class="ink-subhead">${data.title ? esc(data.title) : ""}</div>
    </header>

    <div class="ink-lead-row" id="about">
      <div class="ink-lead-main">
        ${data.bio ? `<p class="ink-drop-cap">${esc(data.bio)}</p>` : ""}
        ${data.about ? `<p class="ink-body-copy">${esc(data.about)}</p>` : ""}
      </div>
      <aside class="ink-lead-aside">
        ${data.avatar ? `<figure class="ink-fig">
          <img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="ink-av fc-av-anim" />
          <figcaption class="ink-fig-cap">${esc(data.name)}</figcaption>
        </figure>` : ""}
        <div class="ink-aside-links">${socialLinks(data)}</div>
      </aside>
    </div>

    ${gallery}
    <div class="ink-rule"></div>

    <div class="ink-sections" id="project">
      ${inkSections}
    </div>
  </div>
</div>
${themeToggle}
${scrollRevealScript}
</body></html>`;

  const css = bwBase + `
.ink-body{font-family:'Inter',sans-serif;}
.ink-outer{padding:2rem;max-width:980px;margin:0 auto;}
.ink-card{padding:2.5rem 2.5rem 3rem;}
.ink-masthead{
  text-align:center;padding-bottom:1.5rem;margin-bottom:1.5rem;
  border-bottom:2px solid var(--card-border);
  animation:mastheadDrop .7s cubic-bezier(.16,1,.3,1) both;
}
.ink-dateline{font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;color:var(--text-faint);margin-bottom:.75rem;animation:fadeIn .6s .2s both;}
.ink-nameplate{font-family:'Playfair Display',Georgia,serif;font-size:clamp(3rem,9vw,7.5rem);font-weight:900;line-height:.92;letter-spacing:-.03em;margin-bottom:1rem;color:var(--text-primary);}
.ink-rule{border:none;border-top:2px solid var(--card-border);margin:.6rem 0;}
.ink-rule-anim{animation:drawLine .8s .4s cubic-bezier(.16,1,.3,1) both;}
.ink-subhead{font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--text-muted);margin-top:.5rem;animation:fadeIn .6s .5s both;}
.ink-lead-row{display:grid;grid-template-columns:1fr 200px;gap:2.5rem;margin-bottom:2rem;align-items:start;}
@media(max-width:640px){.ink-lead-row{grid-template-columns:1fr;}}
.ink-lead-main{animation:slideInLeft .6s .15s cubic-bezier(.16,1,.3,1) both;}
.ink-lead-aside{animation:slideInRight .6s .2s cubic-bezier(.16,1,.3,1) both;}
.ink-drop-cap{font-family:'Playfair Display',Georgia,serif;font-size:1.05rem;line-height:1.75;color:var(--text-secondary);margin-bottom:.85rem;}
.ink-drop-cap::first-letter{float:left;font-size:4.2em;line-height:.75;margin:.06em .1em 0 0;font-weight:900;color:var(--text-primary);}
.ink-body-copy{font-size:.9rem;line-height:1.8;color:var(--text-muted);}
.ink-av{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:.75rem;border:2px solid var(--card-border);transition:box-shadow .3s;}
.ink-av:hover{box-shadow:0 12px 36px var(--card-shadow);}
.ink-fig-cap{font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-faint);margin-top:.35rem;text-align:center;}
.ink-aside-links{display:flex;flex-direction:column;gap:.4rem;margin-top:1rem;}
.ink-aside-links a{
  font-size:.75rem;color:var(--text-primary);border-bottom:1px solid var(--line);padding:.2rem 0;
  position:relative;transition:padding-left .2s;
}
.ink-aside-links a:hover{padding-left:.5rem;text-decoration:none;}
.ink-sections{display:flex;flex-direction:column;gap:2rem;margin-top:1.5rem;}
.ink-sec{margin-bottom:0;}
.ink-badges{display:flex;flex-wrap:wrap;gap:.2rem;}
.ink-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;margin-top:.5rem;}
.ink-links-extra{display:flex;flex-wrap:wrap;gap:.5rem;}
`;
  return { html, css };
}

// ════════════════════════════════════════════════════════════════════════════════
// 2. SHEET — Swiss sidebar grid  (template: "split")
// ════════════════════════════════════════════════════════════════════════════════
function buildSheet(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const shRenderers: Record<string, (d: PortfolioData) => string> = {
    skills:     (d) => d.skills?.length ? `<section class="sh-sec sr"><h2 class="sec-label">Skills</h2><div class="sh-badges">${skillBadges(d.skills)}</div></section>` : "",
    experience: (d) => d.experience?.length ? `<section class="sh-sec sr sr-d1"><h2 class="sec-label">Experience</h2>${expItems(d)}</section>` : "",
    projects:   (d) => d.projects?.filter(p => p.include !== false).length ? `<section class="sh-sec sr sr-d2" id="project"><h2 class="sec-label">Projects</h2><div class="sh-pgrid">${projectCards(d)}</div></section>` : "",
    education:  (d) => d.education?.length ? `<section class="sh-sec sr sr-d3"><h2 class="sec-label">Education</h2>${eduItems(d)}</section>` : "",
    links:      (d) => d.links?.length ? `<section class="sh-sec sr"><h2 class="sec-label">Links</h2><div class="sh-links-extra">${socialLinks(d)}</div></section>` : "",
  };
  const shSections = renderOrderedSections(data, shRenderers, "sh");

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark"${data.accentColor ? ` data-accent="${esc(data.accentColor)}"` : ""}>
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
${buildSeoHead(data)}
${accentStyle(data)}
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&display=swap" rel="stylesheet">
</head>
<body class="sh-body">

${buildLoader(data.name)}
${buildNav(data.name)}

<div class="sh-outer" id="home">
  <div class="fc-card sh-layout">
    <aside class="sh-aside" id="about">
      ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="sh-av fc-av-anim" />` : ""}
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
      <section class="sh-sec sr">
        <h2 class="sec-label">About</h2>
        <p class="sh-text">${esc(data.about)}</p>
      </section>` : ""}
      ${shSections}
    </main>
  </div>
</div>
${themeToggle}
${scrollRevealScript}
</body></html>`;

  const css = bwBase + `
.sh-body{font-family:'DM Sans',system-ui,sans-serif;}
.sh-outer{padding:2rem;max-width:1100px;margin:0 auto;}
.sh-layout{display:grid;grid-template-columns:260px 1fr;gap:0;padding:0;overflow:hidden;}
@media(max-width:720px){.sh-layout{grid-template-columns:1fr;}}
.sh-aside{
  padding:2.5rem 2rem;border-right:1.5px solid var(--card-border);
  display:flex;flex-direction:column;gap:.6rem;
  background:var(--bg2);border-radius:1.5rem 0 0 1.5rem;
  animation:slideInLeft .65s cubic-bezier(.16,1,.3,1) both;
}
@media(max-width:720px){.sh-aside{border-right:none;border-bottom:1.5px solid var(--card-border);border-radius:1.5rem 1.5rem 0 0;}}
.sh-av{
  width:72px;height:72px;border-radius:50%;object-fit:cover;
  margin-bottom:.5rem;border:2px solid var(--card-border);
  transition:box-shadow .3s,transform .3s;
}
.sh-av:hover{box-shadow:0 8px 28px var(--card-shadow);transform:scale(1.06) !important;}
.sh-name{
  font-size:1.35rem;font-weight:700;letter-spacing:-.03em;line-height:1.15;
  margin-bottom:.15rem;color:var(--text-primary);
  animation:fadeUp .5s .15s cubic-bezier(.16,1,.3,1) both;
}
.sh-role{font-size:.72rem;text-transform:uppercase;letter-spacing:.14em;color:var(--text-faint);margin-bottom:.1rem;}
.sh-loc{font-size:.73rem;color:var(--text-faint);margin-bottom:.6rem;}
.sh-bio{font-size:.83rem;line-height:1.65;color:var(--text-muted);max-width:30ch;margin-bottom:.5rem;}
.sh-links{display:flex;flex-direction:column;gap:.35rem;margin-bottom:1rem;}
.sh-links a{
  font-size:.75rem;color:var(--text-primary);
  display:flex;align-items:center;gap:.4rem;
  transition:gap .2s,opacity .2s;
}
.sh-links a::before{
  content:'→';font-size:.7rem;color:var(--accent-mid);
  display:inline-block;transition:transform .25s cubic-bezier(.16,1,.3,1);
}
.sh-links a:hover::before{transform:translateX(4px);}
.sh-links a:hover{opacity:.7;text-decoration:none;}
.sh-skills-block{margin-top:auto;padding-top:1.5rem;border-top:1px solid var(--line);}
.sh-badges{display:flex;flex-wrap:wrap;gap:.2rem;margin-top:.5rem;}
.sh-main{
  padding:2.5rem 2rem;border-radius:0 1.5rem 1.5rem 0;
  animation:slideInRight .65s .05s cubic-bezier(.16,1,.3,1) both;
}
@media(max-width:720px){.sh-main{border-radius:0 0 1.5rem 1.5rem;}}
.sh-sec{margin-bottom:2.5rem;}
.sh-text{font-size:.92rem;line-height:1.82;color:var(--text-muted);max-width:60ch;}
.sh-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem;margin-top:.5rem;}
.sh-links-extra{display:flex;flex-wrap:wrap;gap:.5rem;}
.sh-sec .custom-sec-body{font-size:.88rem;line-height:1.75;color:var(--text-muted);}
.sh-sec .custom-list{padding-left:1.2rem;list-style:disc;display:flex;flex-direction:column;gap:.25rem;}
`;
  return { html, css };
}

// ════════════════════════════════════════════════════════════════════════════════
// 3. MONO — Monospace terminal  (template: "minimal")
// ════════════════════════════════════════════════════════════════════════════════
function buildMono(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const moRenderers: Record<string, (d: PortfolioData) => string> = {
    skills:     (d) => d.skills?.length ? `<section class="mo-sec sr sr-d1"><div class="mo-sec-label">skills</div><div class="mo-badges">${skillBadges(d.skills)}</div></section>` : "",
    experience: (d) => d.experience?.length ? `<section class="mo-sec sr sr-d2"><div class="mo-sec-label">experience</div>${expItems(d)}</section>` : "",
    projects:   (d) => d.projects?.filter(p => p.include !== false).length ? `<section class="mo-sec sr sr-d3" id="project"><div class="mo-sec-label">projects</div><div class="mo-pgrid">${projectCards(d)}</div></section>` : "",
    education:  (d) => d.education?.length ? `<section class="mo-sec sr sr-d4"><div class="mo-sec-label">education</div>${eduItems(d)}</section>` : "",
    links:      (d) => d.links?.length ? `<section class="mo-sec sr"><div class="mo-sec-label">links</div><div class="mo-links-extra">${socialLinks(d)}</div></section>` : "",
  };
  const moSections = renderOrderedSections(data, moRenderers, "mo");

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark"${data.accentColor ? ` data-accent="${esc(data.accentColor)}"` : ""}>
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
${buildSeoHead(data)}
${accentStyle(data)}
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,600;0,700;1,300&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body class="mo-body">

${buildLoader(data.name)}
${buildNav(data.name)}

<div class="mo-outer" id="home">
  <div class="fc-card mo-card">
    <header class="mo-hero" id="about">
      ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="mo-av fc-av-anim" />` : ""}
      <h1 class="mo-name fc-typing">${esc(data.name)}</h1>
      ${data.title ? `<div class="mo-title">${esc(data.title)}</div>` : ""}
      ${data.location ? `<div class="mo-loc">${esc(data.location)}</div>` : ""}
      <div class="mo-links">${socialLinks(data)}</div>
    </header>

    <div class="mo-divider mo-divider-anim"></div>

    ${gallery}

    ${data.bio || data.about ? `
    <section class="mo-sec sr">
      <div class="mo-sec-label">about</div>
      ${data.bio ? `<p class="mo-bio">${esc(data.bio)}</p>` : ""}
      ${data.about ? `<p class="mo-text">${esc(data.about)}</p>` : ""}
    </section>` : ""}

    ${moSections}
  </div>
</div>
${themeToggle}
${scrollRevealScript}
</body></html>`;

  const css = bwBase + `
.mo-body{font-family:'IBM Plex Sans',system-ui,sans-serif;}
.mo-outer{padding:2rem;max-width:780px;margin:0 auto;}
.mo-card{padding:3rem 2.5rem;}
.mo-hero{
  display:flex;flex-direction:column;align-items:center;text-align:center;
  padding-bottom:2.5rem;gap:.5rem;
  animation:monoHeroIn .75s cubic-bezier(.16,1,.3,1) both;
}
.mo-av{
  width:88px;height:88px;border-radius:50%;object-fit:cover;
  border:2.5px solid var(--card-border);margin-bottom:.75rem;
  transition:box-shadow .3s,transform .3s;
}
.mo-av:hover{box-shadow:0 12px 40px var(--card-shadow);transform:scale(1.08) !important;}
.mo-name{font-family:'IBM Plex Mono',monospace;font-size:clamp(1.8rem,5vw,3.2rem);font-weight:700;letter-spacing:-.04em;line-height:1.05;color:var(--text-primary);}
.mo-title{font-family:'IBM Plex Mono',monospace;font-size:.75rem;letter-spacing:.18em;text-transform:uppercase;color:var(--text-faint);margin-top:.2rem;}
.mo-loc{font-size:.72rem;color:var(--text-faint);}
.mo-links{display:flex;flex-wrap:wrap;justify-content:center;gap:.6rem;margin-top:.75rem;}
.mo-links a{
  font-family:'IBM Plex Mono',monospace;font-size:.7rem;letter-spacing:.06em;
  padding:.3em .8em;border:1px solid var(--card-border);border-radius:999px;
  color:var(--text-primary);
  transition:background .2s,color .2s,transform .2s;
}
.mo-links a:hover{background:var(--accent);color:#fff;transform:scale(1.04);text-decoration:none;}
.mo-divider{border:none;border-top:2px solid var(--card-border);margin:0 0 2.5rem;}
.mo-divider-anim{animation:drawLine .7s .3s cubic-bezier(.16,1,.3,1) both;}
.mo-sec{margin-bottom:2.5rem;}
.mo-sec-label{
  font-family:'IBM Plex Mono',monospace;font-size:.6rem;
  letter-spacing:.28em;text-transform:uppercase;color:var(--text-faint);
  margin-bottom:1rem;position:relative;display:inline-block;
}
.mo-sec-label::after{
  content:'';display:block;height:1px;background:currentColor;
  margin-top:.3rem;animation:drawLine .6s .2s cubic-bezier(.16,1,.3,1) both;
}
.mo-bio{font-size:1rem;line-height:1.75;color:var(--text-secondary);margin-bottom:.75rem;font-weight:300;}
.mo-text{font-size:.9rem;line-height:1.82;color:var(--text-muted);}
.mo-badges{display:flex;flex-wrap:wrap;gap:.2rem;}
.mo-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;margin-top:.5rem;}
.mo-links-extra{display:flex;flex-wrap:wrap;gap:.5rem;}
.mo-sec .custom-sec-body{font-size:.88rem;line-height:1.75;color:var(--text-muted);}
.mo-sec .custom-list{padding-left:1.2rem;list-style:disc;display:flex;flex-direction:column;gap:.25rem;}
`;
  return { html, css };
}

// ════════════════════════════════════════════════════════════════════════════════
// 4. RULED — Structured ruled layout  (template: "ruled")
// ════════════════════════════════════════════════════════════════════════════════
function buildRuled(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const rlRenderers: Record<string, (d: PortfolioData) => string> = {
    skills:     (d) => d.skills?.length ? `<div class="rl-row sr sr-d1"><div class="rl-row-label">skills</div><div class="rl-row-content rl-wide"><div class="rl-badges">${skillBadges(d.skills)}</div></div></div>` : "",
    experience: (d) => d.experience?.length ? `<div class="rl-row sr sr-d2"><div class="rl-row-label">work</div><div class="rl-row-content rl-wide">${expItems(d)}</div></div>` : "",
    projects:   (d) => d.projects?.filter(p => p.include !== false).length ? `<div class="rl-row sr sr-d3" id="project"><div class="rl-row-label">projects</div><div class="rl-row-content rl-wide"><div class="rl-pgrid">${projectCards(d)}</div></div></div>` : "",
    education:  (d) => d.education?.length ? `<div class="rl-row sr sr-d4"><div class="rl-row-label">edu</div><div class="rl-row-content rl-wide">${eduItems(d)}</div></div>` : "",
    links:      (d) => d.links?.length ? `<div class="rl-row sr"><div class="rl-row-label">links</div><div class="rl-row-content rl-wide"><div class="rl-links-extra">${socialLinks(d)}</div></div></div>` : "",
  };
  const rlSections = renderOrderedSections(data, rlRenderers, "rl");

  const html = `<!DOCTYPE html>
<html lang="en" data-theme="dark"${data.accentColor ? ` data-accent="${esc(data.accentColor)}"` : ""}>
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
${buildSeoHead(data)}
${accentStyle(data)}
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:ital@0;1&display=swap" rel="stylesheet">
</head>
<body class="rl-body">

${buildLoader(data.name)}
${buildNav(data.name)}

<div class="rl-outer" id="home">
  <div class="fc-card rl-card">
    <div class="rl-header-inner">
      <div class="rl-index">001</div>
      <h1 class="rl-name">${esc(data.name)}</h1>
      <div class="rl-header-right">
        ${data.title ? `<span class="rl-role">${esc(data.title)}</span>` : ""}
        ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="rl-av fc-av-anim" />` : ""}
      </div>
    </div>

    ${data.bio || data.location ? `
    <div class="rl-row rl-intro-row sr" id="about">
      <div class="rl-row-label">intro</div>
      <div class="rl-row-content">
        ${data.bio ? `<p class="rl-bio">${esc(data.bio)}</p>` : ""}
        ${data.location ? `<span class="rl-loc">${esc(data.location)}</span>` : ""}
      </div>
      <div class="rl-row-links">${socialLinks(data)}</div>
    </div>` : ""}

    ${gallery}

    ${data.about ? `
    <div class="rl-row sr sr-d1">
      <div class="rl-row-label">about</div>
      <div class="rl-row-content rl-wide"><p class="rl-text">${esc(data.about)}</p></div>
    </div>` : ""}

    ${rlSections}
  </div>
</div>
${themeToggle}
${scrollRevealScript}
</body></html>`;

  const css = bwBase + `
.rl-body{font-family:'Space Grotesk',sans-serif;}
.rl-outer{padding:2rem;max-width:1100px;margin:0 auto;}
.rl-card{padding:0;overflow:hidden;}
.rl-header-inner{
  display:grid;grid-template-columns:auto 1fr auto;
  align-items:center;gap:1.5rem;
  padding:2rem 2.5rem 1.5rem;
  border-bottom:2px solid var(--card-border);
  animation:fadeIn .5s both;
}
.rl-index{font-family:'Space Mono',monospace;font-size:.65rem;letter-spacing:.2em;color:var(--text-faint);align-self:flex-start;padding-top:.25rem;}
.rl-name{font-size:clamp(2rem,6vw,5rem);font-weight:700;letter-spacing:-.04em;line-height:.95;color:var(--text-primary);}
.rl-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:.5rem;}
.rl-role{font-family:'Space Mono',monospace;font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;color:var(--text-faint);}
.rl-av{width:52px;height:52px;border-radius:50%;object-fit:cover;border:1.5px solid var(--card-border);transition:box-shadow .3s,transform .3s;}
.rl-av:hover{box-shadow:0 6px 20px var(--card-shadow);transform:scale(1.08) !important;}
.rl-row{
  display:grid;grid-template-columns:80px 1fr;
  gap:1rem 2rem;padding:1.25rem 2.5rem;
  border-bottom:1px solid var(--card-border);
  transition:background .2s;
}
.rl-row:hover{background:var(--bg2);}
.rl-row:last-child{border-bottom:none;}
.rl-intro-row{grid-template-columns:80px 1fr auto;}
@media(max-width:640px){.rl-row,.rl-intro-row{grid-template-columns:1fr;gap:.5rem;padding:1rem 1.25rem;}}
.rl-row-label{font-family:'Space Mono',monospace;font-size:.58rem;letter-spacing:.22em;text-transform:uppercase;color:var(--text-faint);padding-top:.2rem;}
.rl-row-content{}
.rl-wide{grid-column:2/-1;}
.rl-bio{font-size:.92rem;line-height:1.72;color:var(--text-secondary);}
.rl-loc{font-size:.72rem;color:var(--text-faint);display:block;margin-top:.3rem;}
.rl-text{font-size:.9rem;line-height:1.82;color:var(--text-muted);max-width:60ch;}
.rl-badges{display:flex;flex-wrap:wrap;gap:.2rem;}
.rl-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.75rem;margin-top:.5rem;}
.rl-row-links{display:flex;flex-direction:column;gap:.3rem;min-width:120px;}
.rl-row-links a{font-size:.72rem;color:var(--text-muted);text-decoration:none;text-align:right;transition:color .2s;}
.rl-row-links a:hover{color:var(--accent);}
.rl-links-extra{display:flex;flex-wrap:wrap;gap:.5rem;}
.rl-row .custom-sec-body,.custom-sec-body{font-size:.88rem;line-height:1.75;color:var(--text-muted);}
.custom-list{padding-left:1.2rem;list-style:disc;display:flex;flex-direction:column;gap:.25rem;}
`;
  return { html, css };
}

export function buildSite(data: PortfolioData, template: TemplateId): { html: string; css: string } {
  const accent = data.accentColor ?? "#7c3aed";
  let result: { html: string; css: string };
  switch (template) {
    case "split":     result = buildSheet(data); break;
    case "editorial": result = buildInk(data);   break;
    case "minimal":   result = buildMono(data);  break;
    default:          result = buildCentered(data);
  }
  // Inject accent CSS variable into the generated HTML
  const accentInject = `<style>:root,[data-theme="light"],[data-theme="dark"]{--accent-user:${accent};}</style>`;
  return {
    html: result.html.replace("</head>", accentInject + "\n</head>"),
    css: result.css,
  };
}

/**
 * generatePortfolioHtml — convenience wrapper used by the /preview route.
 * Returns the complete self-contained HTML string for the portfolio.
 */
export function generatePortfolioHtml(data: PortfolioData, template: TemplateId): string {
  return buildSite(data, template).html;
}
