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
<button class="gl-arrow gl-prev" onclick="glPrev()" aria-label="Prev">&#8249;</button>
<button class="gl-arrow gl-next" onclick="glNext()" aria-label="Next">&#8250;</button>
<div class="gl-dots">${dots}</div></div>
<script>(function(){var I=document.querySelectorAll('.gl-img'),D=document.querySelectorAll('.gl-dot'),c=0;function go(n){I[c].classList.remove('active');D[c].classList.remove('active');c=(n+I.length)%I.length;I[c].classList.add('active');D[c].classList.add('active');}window.glTo=go;window.glPrev=function(){go(c-1);};window.glNext=function(){go(c+1);};var t=0;var el=document.getElementById('gl');el.addEventListener('touchstart',function(e){t=e.touches[0].clientX;},{passive:true});el.addEventListener('touchend',function(e){var d=e.changedTouches[0].clientX-t;if(Math.abs(d)>40){d<0?glNext():glPrev();}},{passive:true});})();<\/script>`;
}

// ── SEO Head ───────────────────────────────────────────────────────────────────
function buildSeoHead(data: PortfolioData): string {
  const name    = esc(data.name  || "Portfolio");
  const title   = esc(data.title || "");
  const bio     = esc(data.bio   || data.about || `${name}'s portfolio`);
  const siteUrl = esc(data.website || "");
  let ogImage = "";
  if (data.avatar && data.avatar.startsWith("http")) {
    ogImage = esc(data.avatar);
  } else {
    const svgName  = (data.name  || "Portfolio").replace(/[<>&"]/g, "");
    const svgTitle = (data.title || "").replace(/[<>&"]/g, "");
    const svgBio   = (data.bio   || "").slice(0, 90).replace(/[<>&"]/g, "");
    const initials = svgName.split(" ").slice(0, 2).map((w: string) => w[0] || "").join("").toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0a0a0a"/><stop offset="100%" stop-color="#1a1a1a"/></linearGradient></defs><rect width="1200" height="630" fill="url(#bg)"/><rect x="60" y="60" width="1080" height="510" rx="24" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/><circle cx="180" cy="315" r="80" fill="#222" stroke="rgba(255,255,255,0.15)" stroke-width="2"/><text x="180" y="328" text-anchor="middle" font-family="system-ui,sans-serif" font-size="48" font-weight="700" fill="rgba(255,255,255,0.7)">${initials}</text><text x="310" y="280" font-family="Georgia,serif" font-size="64" font-weight="700" fill="#ffffff" letter-spacing="-2">${svgName}</text>${svgTitle ? `<text x="312" y="340" font-family="system-ui,sans-serif" font-size="28" fill="rgba(255,255,255,0.55)" letter-spacing="1">${svgTitle}</text>` : ""}${svgBio ? `<text x="312" y="400" font-family="system-ui,sans-serif" font-size="22" fill="rgba(255,255,255,0.35)">${svgBio}</text>` : ""}<text x="1140" y="600" text-anchor="end" font-family="system-ui,sans-serif" font-size="18" fill="rgba(255,255,255,0.2)" letter-spacing="2">FOLIOCV</text></svg>`;
    ogImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  const sameAs: string[] = [];
  if (data.website) sameAs.push(data.website);
  if (data.github)  sameAs.push(`https://github.com/${data.github}`);
  (data.links ?? []).forEach((l: {url?: string}) => { if (l.url) sameAs.push(l.url); });
  const jsonLd = JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: data.name || "", jobTitle: data.title || undefined, description: data.bio || data.about || undefined, email: data.email || undefined, url: data.website || undefined, image: data.avatar && data.avatar.startsWith("http") ? data.avatar : undefined, sameAs: sameAs.length ? sameAs : undefined });
  return `<meta name="description" content="${bio}" /><meta name="author" content="${name}" />${siteUrl ? `<link rel="canonical" href="${siteUrl}" />` : ""}<meta property="og:type" content="profile" /><meta property="og:title" content="${name}${title ? ` — ${title}` : ""}" /><meta property="og:description" content="${bio}" /><meta property="og:image" content="${ogImage}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />${siteUrl ? `<meta property="og:url" content="${siteUrl}" />` : ""}<meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${name}${title ? ` — ${title}` : ""}" /><meta name="twitter:description" content="${bio}" /><meta name="twitter:image" content="${ogImage}" /><script type="application/ld+json">${jsonLd}<\/script>`;
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
  function apply(m){r.dataset.theme=m;b.textContent=m==='dark'?'☼':'●';b.title=m==='dark'?'Switch to light':'Switch to dark';}
  window.tToggle=function(){apply(r.dataset.theme==='dark'?'light':'dark');};
  var saved=null;try{saved=localStorage.getItem(K);}catch(e){}
  apply(saved||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
  var obs=new MutationObserver(function(){try{localStorage.setItem(K,r.dataset.theme);}catch(e){}});
  obs.observe(r,{attributes:true,attributeFilter:['data-theme']});
  window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(e){var s=null;try{s=localStorage.getItem(K);}catch(x){}if(!s)apply(e.matches?'dark':'light');});
})();<\/script>`;

// ════════════════════════════════════════════════════════════════════════════════
// PURE CSS ANIMATIONS — shared across all 4 templates
// Zero JS. Uses @keyframes, animation-delay stagger, :hover transitions.
// All animations respect prefers-reduced-motion.
// ════════════════════════════════════════════════════════════════════════════════
const cssAnimations = `
@keyframes fadeUp {
  from { opacity:0; transform:translateY(28px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes fadeIn {
  from { opacity:0; }
  to   { opacity:1; }
}
@keyframes slideInLeft {
  from { opacity:0; transform:translateX(-28px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes slideInRight {
  from { opacity:0; transform:translateX(28px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes scaleIn {
  from { opacity:0; transform:scale(0.86); }
  to   { opacity:1; transform:scale(1); }
}
@keyframes floatY {
  0%,100% { transform:translateY(0px) rotate(0deg); }
  40%     { transform:translateY(-8px) rotate(.4deg); }
  70%     { transform:translateY(-4px) rotate(-.3deg); }
}
@keyframes badgePop {
  0%   { opacity:0; transform:scale(0.55); }
  68%  { transform:scale(1.14); }
  100% { opacity:1; transform:scale(1); }
}
@keyframes cardEnter {
  from { opacity:0; transform:translateY(18px) scale(0.97); }
  to   { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes drawLine {
  from { transform:scaleX(0); transform-origin:left; }
  to   { transform:scaleX(1); transform-origin:left; }
}
@keyframes mastheadDrop {
  from { opacity:0; transform:translateY(-20px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes ruledRowIn {
  from { opacity:0; transform:translateX(-16px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes monoHeroIn {
  from { opacity:0; transform:scale(0.94) translateY(12px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}
@keyframes navSlideDown {
  from { opacity:0; transform:translateY(-100%); }
  to   { opacity:1; transform:translateY(0); }
}

/* ── Respect reduced-motion ── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── Nav entrance ── */
.fc-nav {
  animation: navSlideDown .55s cubic-bezier(.16,1,.3,1) both;
}

/* ── Nav link animated underline on hover ── */
.fc-nav a {
  position: relative;
  display: inline-flex;
  text-decoration: none !important;
}
.fc-nav a::after {
  content: '';
  position: absolute;
  bottom: -2px; left: 0;
  width: 100%; height: 1.5px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .28s cubic-bezier(.16,1,.3,1);
}
.fc-nav a:hover::after { transform: scaleX(1); }
.fc-nav a:hover { text-decoration: none !important; }

/* ── Main card entrance ── */
.fc-card { animation: fadeUp .75s .05s cubic-bezier(.16,1,.3,1) both; }

/* ── Avatar gentle infinite float ── */
.fc-av-anim {
  animation: floatY 6s ease-in-out infinite;
  will-change: transform;
}
.fc-av-anim:hover { animation-play-state: paused; }

/* ── Skill badge spring-pop with stagger ── */
.badge { animation: badgePop .4s cubic-bezier(.34,1.56,.64,1) both; }
.badge:nth-child(1)  { animation-delay: .05s; }
.badge:nth-child(2)  { animation-delay: .10s; }
.badge:nth-child(3)  { animation-delay: .15s; }
.badge:nth-child(4)  { animation-delay: .20s; }
.badge:nth-child(5)  { animation-delay: .25s; }
.badge:nth-child(6)  { animation-delay: .30s; }
.badge:nth-child(7)  { animation-delay: .35s; }
.badge:nth-child(8)  { animation-delay: .40s; }
.badge:nth-child(n+9){ animation-delay: .45s; }

/* ── Badge hover invert ── */
.badge {
  transition: background .2s, color .2s, transform .15s cubic-bezier(.34,1.56,.64,1);
  cursor: default;
}
.badge:hover { background: var(--accent); color: var(--bg); transform: scale(1.08); }

/* ── Project cards stagger + lift + image zoom on hover ── */
.pcard { animation: cardEnter .5s cubic-bezier(.16,1,.3,1) both; }
.pcard:nth-child(1) { animation-delay: .08s; }
.pcard:nth-child(2) { animation-delay: .16s; }
.pcard:nth-child(3) { animation-delay: .24s; }
.pcard:nth-child(4) { animation-delay: .32s; }
.pcard:nth-child(5) { animation-delay: .40s; }
.pcard:nth-child(6) { animation-delay: .48s; }
.pcard:nth-child(n+7){ animation-delay: .56s; }

.pcard { transition: box-shadow .3s, transform .3s cubic-bezier(.16,1,.3,1); }
.pcard:hover { transform: translateY(-5px); box-shadow: 0 20px 48px var(--card-shadow); }
.pcard-img { transition: transform .45s cubic-bezier(.16,1,.3,1), filter .45s; }
.pcard:hover .pcard-img { transform: scale(1.07); filter: brightness(1.06); }

/* ── Experience / Education slide-in stagger ── */
.exp, .edu { animation: slideInLeft .5s cubic-bezier(.16,1,.3,1) both; }
.exp:nth-child(1), .edu:nth-child(1) { animation-delay: .06s; }
.exp:nth-child(2), .edu:nth-child(2) { animation-delay: .14s; }
.exp:nth-child(3), .edu:nth-child(3) { animation-delay: .22s; }
.exp:nth-child(4), .edu:nth-child(4) { animation-delay: .30s; }
.exp:nth-child(n+5), .edu:nth-child(n+5) { animation-delay: .38s; }

/* ── Exp/Edu hover highlight ── */
.exp, .edu {
  transition: background .2s, padding-left .2s;
  border-radius: .25rem;
}
.exp:hover, .edu:hover {
  background: var(--accent-light);
  padding-left: .5rem;
}

/* ── Section label with animated underline draw ── */
.sec-label { position: relative; display: inline-block; }
.sec-label::after {
  content: '';
  display: block;
  height: 1px;
  background: currentColor;
  margin-top: .3rem;
  animation: drawLine .65s .3s cubic-bezier(.16,1,.3,1) both;
}
`;

// ── Shared Black & White base CSS ──────────────────────────────────────────────
const bwBase = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{line-height:1.6;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
img{display:block;max-width:100%;height:auto}
a{color:inherit;text-decoration:none}
a:hover{text-decoration:underline}

:root{
  --accent:#000000;
  --accent-light:#f5f5f5;
  --accent-mid:#555555;
  --accent-dark:#000000;
}
[data-theme="light"]{
  --bg:#ffffff;--bg2:#f9f9f9;--bg3:#f0f0f0;
  --text-primary:#000000;--text-secondary:#111111;--text-muted:#444444;--text-faint:#888888;
  --line:rgba(0,0,0,.15);--line2:rgba(0,0,0,.25);--label:#555555;
  --card-bg:#ffffff;--card-border:rgba(0,0,0,.18);--card-shadow:rgba(0,0,0,.08);
  --badge-bg:#f5f5f5;--badge-border:rgba(0,0,0,.2);--badge-color:#111111;
  --nav-bg:rgba(255,255,255,.85);
}
[data-theme="dark"]{
  --bg:#0a0a0a;--bg2:#111111;--bg3:#1a1a1a;
  --text-primary:#ffffff;--text-secondary:#e5e5e5;--text-muted:#aaaaaa;--text-faint:#666666;
  --line:rgba(255,255,255,.12);--line2:rgba(255,255,255,.22);--label:#bbbbbb;
  --card-bg:#111111;--card-border:rgba(255,255,255,.18);--card-shadow:rgba(0,0,0,.5);
  --badge-bg:#1a1a1a;--badge-border:rgba(255,255,255,.18);--badge-color:#e5e5e5;
  --nav-bg:rgba(10,10,10,.85);
  --accent-light:#1a1a1a;
}
body{background:var(--bg);color:var(--text-primary);transition:background .3s,color .3s;}

.fc-nav{
  display:flex;align-items:center;gap:2rem;
  padding:.9rem 2rem;
  background:var(--nav-bg);
  border-bottom:1px solid var(--line);
  position:sticky;top:0;z-index:100;
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
}
.fc-nav a{
  font-size:.85rem;font-weight:500;letter-spacing:.06em;
  color:var(--accent);text-transform:capitalize;
  transition:opacity .2s;
}
.fc-nav a:hover{opacity:.6;}
.fc-nav-brand{font-weight:700;font-size:.92rem;color:var(--text-primary);margin-right:auto;}

.fc-card{
  border:1.5px solid var(--card-border);
  border-radius:1.5rem;
  background:var(--card-bg);
  box-shadow:0 4px 32px var(--card-shadow);
  padding:2.5rem;
  transition:box-shadow .25s;
}
.fc-card:hover{box-shadow:0 8px 48px var(--card-shadow);}

.badge{
  display:inline-block;padding:.2em .7em;
  border:1px solid var(--badge-border);border-radius:999px;
  font-size:.67rem;letter-spacing:.04em;margin:.12rem;
  color:var(--badge-color);background:var(--badge-bg);
}
.pcard{
  background:var(--card-bg);border:1px solid var(--card-border);
  border-radius:.75rem;overflow:hidden;
}
.pcard-img{width:100%;height:150px;object-fit:cover;}
.pcard-body{padding:.9rem}
.pcard-name{font-weight:700;font-size:.88rem;margin-bottom:.25rem;color:var(--text-primary);}
.pcard-desc{font-size:.78rem;color:var(--text-muted);margin-bottom:.35rem;line-height:1.5}
.pcard-lang{font-size:.68rem;color:var(--accent-mid);font-family:monospace;margin-bottom:.35rem}
.pcard-links{display:flex;gap:.75rem;font-size:.75rem;}
.pcard-links a{color:var(--text-primary);transition:opacity .2s;}
.pcard-links a:hover{opacity:.6;}
.exp,.edu{padding:.8rem 0;border-bottom:1px solid var(--line);}
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
.gl-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s cubic-bezier(.16,1,.3,1);pointer-events:none;}
.gl-img.active{opacity:1;pointer-events:auto;}
.gl-arrow{position:absolute;top:50%;transform:translateY(-50%);background:var(--accent);color:var(--bg);border:none;width:2.2rem;height:2.2rem;border-radius:50%;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:.7;transition:opacity .2s,transform .2s;}
.gl-arrow:hover{opacity:1;transform:translateY(-50%) scale(1.1);}
.gl-prev{left:.75rem;}.gl-next{right:.75rem;}
.gl-dots{position:absolute;bottom:.75rem;left:50%;transform:translateX(-50%);display:flex;gap:.4rem;}
.gl-dot{width:.5rem;height:.5rem;border-radius:50%;background:rgba(255,255,255,.5);border:none;cursor:pointer;transition:background .25s,transform .25s;}
.gl-dot.active{background:#fff;transform:scale(1.3);}
` + cssAnimations;

// ── Navbar HTML ────────────────────────────────────────────────────────────────
function buildNav(name: string): string {
  return `<nav class="fc-nav">
  <span class="fc-nav-brand">${esc(name)}</span>
  <a href="#home">Home</a>
  <a href="#about">About</a>
  <a href="#project">Project</a>
</nav>`;
}

// ════════════════════════════════════════════════════════════════════════════════
// 1. INK — newspaper masthead  (template: "centered" / default)
// ════════════════════════════════════════════════════════════════════════════════
function buildInk(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
${buildSeoHead(data)}
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body class="ink-body">

${buildNav(data.name)}

<div class="ink-outer" id="home">
  <div class="fc-card ink-card">
    <header class="ink-masthead">
      <div class="ink-dateline">${data.location ? esc(data.location) + " · " : ""}Portfolio</div>
      <h1 class="ink-nameplate">${esc(data.name)}</h1>
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
.ink-columns{display:grid;grid-template-columns:1fr 1fr;gap:2.5rem;margin-top:1.5rem;}
@media(max-width:640px){.ink-columns{grid-template-columns:1fr;}}
.ink-col{animation:fadeUp .6s .3s cubic-bezier(.16,1,.3,1) both;}
.ink-col:nth-child(2){animation-delay:.45s;}
.ink-badges{display:flex;flex-wrap:wrap;gap:.2rem;}
.ink-pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.75rem;margin-top:.5rem;}
`;
  return { html, css };
}

// ════════════════════════════════════════════════════════════════════════════════
// 2. SHEET — Swiss sidebar grid  (template: "split")
// ════════════════════════════════════════════════════════════════════════════════
function buildSheet(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
${buildSeoHead(data)}
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,300&display=swap" rel="stylesheet">
</head>
<body class="sh-body">

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
`;
  return { html, css };
}

// ════════════════════════════════════════════════════════════════════════════════
// 3. MONO — centred single-column monospace  (template: "editorial")
// ════════════════════════════════════════════════════════════════════════════════
function buildMono(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
${buildSeoHead(data)}
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,300;0,400;0,600;0,700;1,300&family=IBM+Plex+Sans:wght@300;400;500&display=swap" rel="stylesheet">
</head>
<body class="mo-body">

${buildNav(data.name)}

<div class="mo-outer" id="home">
  <div class="fc-card mo-card">
    <header class="mo-hero" id="about">
      ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="mo-av fc-av-anim" />` : ""}
      <h1 class="mo-name">${esc(data.name)}</h1>
      ${data.title ? `<div class="mo-title">${esc(data.title)}</div>` : ""}
      ${data.location ? `<div class="mo-loc">${esc(data.location)}</div>` : ""}
      <div class="mo-links">${socialLinks(data)}</div>
    </header>

    <div class="mo-divider mo-divider-anim"></div>

    ${gallery}

    ${data.bio || data.about ? `
    <section class="mo-sec">
      <div class="mo-sec-label">about</div>
      ${data.bio ? `<p class="mo-bio">${esc(data.bio)}</p>` : ""}
      ${data.about ? `<p class="mo-text">${esc(data.about)}</p>` : ""}
    </section>` : ""}

    ${data.skills?.length ? `
    <section class="mo-sec">
      <div class="mo-sec-label">skills</div>
      <div class="mo-badges">${skillBadges(data.skills)}</div>
    </section>` : ""}

    ${data.experience?.length ? `
    <section class="mo-sec">
      <div class="mo-sec-label">experience</div>
      ${expItems(data)}
    </section>` : ""}

    ${data.education?.length ? `
    <section class="mo-sec">
      <div class="mo-sec-label">education</div>
      ${eduItems(data)}
    </section>` : ""}

    ${data.projects?.filter(p => p.include !== false).length ? `
    <section class="mo-sec" id="project">
      <div class="mo-sec-label">projects</div>
      <div class="mo-pgrid">${projectCards(data)}</div>
    </section>` : ""}
  </div>
</div>
${themeToggle}
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
.mo-links a:hover{background:var(--accent);color:var(--bg);transform:scale(1.04);text-decoration:none;}
.mo-divider{border:none;border-top:2px solid var(--card-border);margin:0 0 2.5rem;}
.mo-divider-anim{animation:drawLine .7s .3s cubic-bezier(.16,1,.3,1) both;}
.mo-sec{
  margin-bottom:2.5rem;
  animation:fadeUp .5s cubic-bezier(.16,1,.3,1) both;
}
.mo-sec:nth-child(2){animation-delay:.08s;}
.mo-sec:nth-child(3){animation-delay:.16s;}
.mo-sec:nth-child(4){animation-delay:.24s;}
.mo-sec:nth-child(5){animation-delay:.32s;}
.mo-sec:nth-child(n+6){animation-delay:.40s;}
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
`;
  return { html, css };
}

// ════════════════════════════════════════════════════════════════════════════════
// 4. RULED — horizontal rows typographic  (template: "minimal")
// ════════════════════════════════════════════════════════════════════════════════
function buildRuled(data: PortfolioData): { html: string; css: string } {
  const gallery = data.galleryImages?.length ? gallerySection(data.galleryImages) : "";
  const html = `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(data.name)} — Portfolio</title>
${buildSeoHead(data)}
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
        ${data.avatar ? `<img src="${esc(data.avatar)}" alt="${esc(data.name)}" class="rl-av fc-av-anim" />` : ""}
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
.rl-header-inner{
  display:flex;align-items:center;gap:1.5rem;
  border-bottom:2px solid var(--card-border);
  padding-bottom:1.5rem;margin-bottom:0;
  animation:fadeUp .6s cubic-bezier(.16,1,.3,1) both;
}
.rl-index{font-family:'Space Mono',monospace;font-size:.65rem;letter-spacing:.18em;color:var(--accent-mid);writing-mode:vertical-lr;transform:rotate(180deg);flex-shrink:0;}
.rl-name{font-size:clamp(2rem,5vw,4rem);font-weight:700;letter-spacing:-.04em;line-height:1;flex:1;color:var(--text-primary);}
.rl-header-right{display:flex;align-items:center;gap:1rem;flex-shrink:0;}
.rl-role{font-size:.72rem;text-transform:uppercase;letter-spacing:.15em;color:var(--text-faint);max-width:15ch;text-align:right;}
.rl-av{
  width:56px;height:56px;border-radius:50%;object-fit:cover;
  border:2px solid var(--card-border);
  transition:box-shadow .3s,transform .3s;
}
.rl-av:hover{box-shadow:0 8px 24px var(--card-shadow);transform:scale(1.08) !important;}
.rl-row{
  display:grid;grid-template-columns:80px 1fr auto;
  border-bottom:1px solid var(--line);padding:1.75rem 0;gap:1.5rem;align-items:start;
  animation:ruledRowIn .5s cubic-bezier(.16,1,.3,1) both;
  transition:background .2s,padding-left .2s;
  border-radius:.25rem;
}
.rl-row:hover{background:var(--accent-light);}
.rl-row:nth-child(2){animation-delay:.07s;}
.rl-row:nth-child(3){animation-delay:.14s;}
.rl-row:nth-child(4){animation-delay:.21s;}
.rl-row:nth-child(5){animation-delay:.28s;}
.rl-row:nth-child(6){animation-delay:.35s;}
.rl-row:nth-child(n+7){animation-delay:.42s;}
@media(max-width:680px){.rl-row{grid-template-columns:1fr;}}
.rl-row-label{font-family:'Space Mono',monospace;font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--text-faint);padding-top:.1rem;}
.rl-wide{grid-column:2 / 4;}
@media(max-width:680px){.rl-wide{grid-column:auto;}}
.rl-bio{font-size:.92rem;line-height:1.72;color:var(--text-muted);max-width:55ch;}
.rl-loc{font-size:.72rem;color:var(--text-faint);display:block;margin-top:.4rem;}
.rl-row-links{display:flex;flex-direction:column;gap:.3rem;text-align:right;}
.rl-row-links a{font-size:.72rem;color:var(--text-primary);transition:opacity .2s;}
.rl-row-links a:hover{opacity:.6;text-decoration:none;}
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
  if (template === "editorial") return buildMono(data);    // Mono  — centred monospace
  if (template === "minimal")   return buildRuled(data);   // Ruled — horizontal rows
  return buildInk(data);                                    // Ink   — newspaper masthead (default)
}
