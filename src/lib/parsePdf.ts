/**
 * parsePdf.ts
 * Client-side PDF → PortfolioData extractor using pdf.js (loaded from CDN).
 * No server needed — everything runs in the browser.
 */

import type { PortfolioData } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadPdfJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const lib = (window as any).pdfjsLib;
      lib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(lib);
    };
    script.onerror = () => reject(new Error("Failed to load pdf.js"));
    document.head.appendChild(script);
  });
}

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const lines: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Group items by approximate Y position so reading order is correct
    const byY = new Map<number, string[]>();
    for (const item of content.items as any[]) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push(item.str);
    }
    // Sort descending Y (top of page = high Y in PDF coords)
    const sorted = [...byY.entries()].sort((a, b) => b[0] - a[0]);
    for (const [, parts] of sorted) lines.push(parts.join(" ").trim());
  }
  return lines.join("\n");
}

// ── Regex patterns ────────────────────────────────────────────────────────────

const EMAIL_RE = /[\w.+\-]+@[\w\-]+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+?\d[\s\-.]?){7,14}/;
const URL_RE = /https?:\/\/[^\s,)"'<>]+/gi;
const GITHUB_RE = /(?:github\.com\/|@?)([a-zA-Z0-9][a-zA-Z0-9\-]{0,38})/i;
const LINKEDIN_RE = /linkedin\.com\/in\/([\w\-]+)/i;

// Section heading keywords
const SECTION_HEADINGS = [
  { key: "experience", patterns: [/^(work\s*)?experience$/i, /^employment\s*(history)?$/i, /^professional\s*experience$/i, /^career$/i] },
  { key: "education", patterns: [/^education$/i, /^academic(s|\s+background)?$/i, /^qualifications?$/i] },
  { key: "skills", patterns: [/^(technical\s*)?skills?$/i, /^competenc(y|ies)$/i, /^technologies?$/i, /^tools?\s*&?\s*tech(nologies?)?$/i, /^core\s*competencies$/i] },
  { key: "projects", patterns: [/^projects?$/i, /^(key|notable|personal|side)\s*projects?$/i, /^portfolio$/i] },
  { key: "summary", patterns: [/^(professional\s*)?summary$/i, /^profile$/i, /^about\s*(me)?$/i, /^objective$/i, /^overview$/i] },
  { key: "links", patterns: [/^links?$/i, /^(social\s*)?profiles?$/i, /^online\s*presence$/i] },
];

function detectSection(line: string): string | null {
  const clean = line.trim().replace(/[:\-_]+$/, "").trim();
  for (const { key, patterns } of SECTION_HEADINGS) {
    if (patterns.some((p) => p.test(clean))) return key;
  }
  return null;
}

function isLikelySectionHeading(line: string): boolean {
  const t = line.trim();
  // All caps, short, no punctuation in middle
  if (t.length < 3 || t.length > 45) return false;
  if (/^[A-Z][A-Z\s&\/]+$/.test(t)) return true; // ALL CAPS
  if (detectSection(t)) return true;
  return false;
}

// ── Date / period helpers ─────────────────────────────────────────────────────

const MONTHS = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const YEAR = "\\d{4}";
const PRESENT = "(?:present|current|now|ongoing)";
const DATE_TOKEN = `(?:${MONTHS}\\s*\.?\\s*${YEAR}|${YEAR}|${PRESENT})`;
const PERIOD_RE = new RegExp(`(${DATE_TOKEN})\\s*(?:–|\u2014|-|to|\u2013)\\s*(${DATE_TOKEN})`, "i");

// ── Main extractor ────────────────────────────────────────────────────────────

export async function parsePdfResume(file: File): Promise<Partial<PortfolioData>> {
  const raw = await extractTextFromPdf(file);
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  const result: Partial<PortfolioData> = {};

  // ── Contact info (scan first 25 lines)
  const contactBlock = lines.slice(0, 25).join(" ");
  const emailMatch = contactBlock.match(EMAIL_RE);
  if (emailMatch) result.email = emailMatch[0].toLowerCase();

  // URLs in contact block
  const urls: string[] = Array.from(contactBlock.matchAll(URL_RE), (m) => m[0]);
  const ghUrl = urls.find((u) => GITHUB_RE.test(u)) ?? contactBlock.match(GITHUB_RE)?.[0] ?? null;
  if (ghUrl) {
    const m = ghUrl.match(GITHUB_RE);
    if (m) result.github = m[1];
  }
  const liUrl = urls.find((u) => LINKEDIN_RE.test(u)) ?? null;
  const website = urls.find((u) => !GITHUB_RE.test(u) && !LINKEDIN_RE.test(u)) ?? null;
  if (website) result.website = website;

  // ── Name: first non-empty line that isn't clearly an email/URL/phone
  const nameLine = lines.find(
    (l) =>
      l.length > 2 &&
      l.length < 60 &&
      !EMAIL_RE.test(l) &&
      !URL_RE.test(l) &&
      !PHONE_RE.test(l) &&
      !/^\d/.test(l),
  );
  if (nameLine) result.name = toTitleCase(nameLine);

  // ── Title / headline: second non-contact line or line containing common titles
  const TITLE_KEYWORDS = /developer|engineer|designer|manager|analyst|architect|consultant|scientist|intern|lead|director|officer|full.?stack|front.?end|back.?end|devops|ml|ai/i;
  const titleLine = lines.slice(1, 10).find(
    (l) =>
      l !== nameLine &&
      l.length > 3 &&
      l.length < 80 &&
      !EMAIL_RE.test(l) &&
      !URL_RE.test(l) &&
      !PHONE_RE.test(l) &&
      (TITLE_KEYWORDS.test(l) || (l.split(" ").length <= 6 && /[A-Z]/.test(l[0]))),
  );
  if (titleLine) result.title = titleLine;

  // ── Location: look for city/country patterns in first 20 lines
  const locationLine = lines.slice(0, 20).find(
    (l) =>
      l !== nameLine &&
      l !== titleLine &&
      /[A-Za-z]/.test(l) &&
      l.length < 60 &&
      /,\s*[A-Za-z]/.test(l) &&
      !EMAIL_RE.test(l) &&
      !URL_RE.test(l),
  );
  if (locationLine) result.location = locationLine;

  // ── Section splitting
  const sections: Record<string, string[]> = {
    summary: [], experience: [], education: [], skills: [], projects: [], links: [], other: [],
  };
  let currentSection = "other";

  for (const line of lines) {
    const sec = detectSection(line);
    if (sec || isLikelySectionHeading(line)) {
      currentSection = sec ?? "other";
      continue;
    }
    sections[currentSection]?.push(line) ?? sections.other.push(line);
  }

  // ── Summary / bio
  const summaryText = sections.summary.join(" ").trim();
  if (summaryText.length > 20) {
    result.bio = summaryText.slice(0, 300);
    result.about = summaryText;
  }

  // ── Skills: comma/pipe/bullet separated tokens
  if (sections.skills.length) {
    const skillRaw = sections.skills.join(" | ");
    const tokens = skillRaw
      .split(/[,|•·\n\t\/]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 40 && !/^\d+$/.test(s));
    result.skills = [...new Set(tokens)].slice(0, 30);
  }

  // ── Experience: parse into blocks
  if (sections.experience.length) {
    result.experience = parseExperienceBlocks(sections.experience);
  }

  // ── Education
  if (sections.education.length) {
    result.education = parseEducationBlocks(sections.education);
  }

  // ── Projects (basic: treat each run of lines as a project)
  if (sections.projects.length) {
    result.projects = parseProjectBlocks(sections.projects);
  }

  // ── Links
  const allUrls: string[] = [];
  for (const line of lines) {
    const matches = Array.from(line.matchAll(URL_RE), (m) => m[0]);
    allUrls.push(...matches);
  }
  const links: { label: string; url: string }[] = [];
  if (liUrl) links.push({ label: "LinkedIn", url: liUrl.startsWith("http") ? liUrl : `https://${liUrl}` });
  for (const u of allUrls) {
    if (GITHUB_RE.test(u) && !links.find((l) => l.label === "GitHub")) links.push({ label: "GitHub", url: u });
  }
  if (links.length) result.links = links;

  return result;
}

// ── Block parsers ─────────────────────────────────────────────────────────────

function parseExperienceBlocks(lines: string[]): PortfolioData["experience"] {
  const blocks: PortfolioData["experience"] = [];
  let current: (typeof blocks)[0] | null = null;
  const descLines: string[] = [];

  function flush() {
    if (current) {
      current.description = descLines.join(" ").replace(/\s+/g, " ").trim();
      blocks.push({ ...current });
    }
    descLines.length = 0;
    current = null;
  }

  for (const line of lines) {
    const periodMatch = line.match(PERIOD_RE);
    // Lines with a period are likely role/company headers
    if (periodMatch && line.length < 120) {
      flush();
      const period = periodMatch[0];
      const rest = line.replace(period, "").replace(/[|·,\-–—]+/g, " ").replace(/\s+/g, " ").trim();
      const parts = rest.split(/\s{2,}|\s*[|·@,]\s*/); // split by big whitespace or separators
      current = {
        role: parts[0]?.trim() ?? "Role",
        company: parts[1]?.trim() ?? "Company",
        period,
        description: "",
      };
    } else if (current) {
      // continuation / description bullet
      const clean = line.replace(/^[\-•·*>]+\s*/, "");
      if (clean.length > 2) descLines.push(clean);
    } else {
      // before first period match — might be first job's role line
      if (!current && line.length < 80 && /[A-Z]/.test(line[0])) {
        current = { role: line, company: "", period: "", description: "" };
      }
    }
  }
  flush();
  return blocks.slice(0, 10);
}

function parseEducationBlocks(lines: string[]): PortfolioData["education"] {
  const blocks: PortfolioData["education"] = [];
  let degree = "", school = "", period = "";

  function flush() {
    if (degree || school) blocks.push({ degree: degree || "Degree", school: school || "Institution", period });
    degree = ""; school = ""; period = "";
  }

  for (const line of lines) {
    const periodMatch = line.match(PERIOD_RE);
    if (periodMatch) {
      period = periodMatch[0];
      const rest = line.replace(periodMatch[0], "").replace(/[|·,]+/g, " ").trim();
      if (!degree && rest) degree = rest;
    } else if (/bachelor|master|phd|b\.?(sc|tech|e|a)|m\.?(sc|tech|s|a)|mba|b\.?s\.|m\.?s\.|associate|diploma|high\s*school/i.test(line)) {
      flush();
      degree = line;
    } else if (line.length > 3 && line.length < 80 && !degree) {
      degree = line;
    } else if (line.length > 3 && line.length < 80 && !school) {
      school = line;
    } else if (line.length > 3 && degree && !school) {
      school = line;
    }
  }
  flush();
  return blocks.slice(0, 5);
}

function parseProjectBlocks(lines: string[]): PortfolioData["projects"] {
  const blocks: PortfolioData["projects"] = [];
  let name = "", descParts: string[] = [], url = "";

  function flush() {
    if (name) {
      blocks.push({ name, description: descParts.join(" ").trim(), url: url || "", include: true });
    }
    name = ""; descParts = []; url = "";
  }

  for (const line of lines) {
    const urlMatch = line.match(URL_RE);
    if (urlMatch) { url = urlMatch[0]; continue; }
    // Short lines starting with capital are probably project titles
    if (line.length < 60 && /^[A-Z]/.test(line) && line.split(" ").length <= 6) {
      flush();
      name = line;
    } else if (name) {
      const clean = line.replace(/^[\-•·*>]+\s*/, "");
      if (clean.length > 3) descParts.push(clean);
    }
  }
  flush();
  return blocks.slice(0, 8);
}

// ── Utility ───────────────────────────────────────────────────────────────────

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
