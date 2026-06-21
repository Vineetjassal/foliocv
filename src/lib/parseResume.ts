import type { PortfolioData } from "./types";

// Lazy-load pdfjs only on client
async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  // Use worker via CDN URL matching installed version
  const ver = (pdfjs as any).version ?? "6.0.227";
  (pdfjs as any).GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${ver}/build/pdf.worker.min.mjs`;
  return pdfjs;
}

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await loadPdfjs();
  const buf = await file.arrayBuffer();
  const doc = await (pdfjs as any).getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => it.str);
    text += strings.join(" ") + "\n";
  }
  return text;
}

/* Heuristic resume parser — works without any AI */
export function parseResumeText(text: string): Partial<PortfolioData> {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  const emailMatch = clean.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  const phoneMatch = clean.match(/(\+?\d[\d\s\-()]{8,}\d)/);
  const urlMatches = Array.from(clean.matchAll(/https?:\/\/[^\s)]+/g)).map((m) => m[0]);
  const githubMatch = clean.match(/github\.com\/([A-Za-z0-9-]+)/i);
  const linkedinMatch = clean.match(/linkedin\.com\/in\/([A-Za-z0-9-_]+)/i);

  // Name = first line that looks like a name (1-4 words, mostly letters)
  const name =
    lines.find((l) => /^[A-Z][A-Za-z'’.-]+(\s+[A-Z][A-Za-z'’.-]+){0,3}$/.test(l)) ?? lines[0] ?? "Your Name";

  // Title = line directly after name if short
  const nameIdx = lines.indexOf(name);
  const title =
    (nameIdx >= 0 && lines[nameIdx + 1] && lines[nameIdx + 1].length < 60 && !/@|http/.test(lines[nameIdx + 1])
      ? lines[nameIdx + 1]
      : "Software Engineer");

  // Skills: scan a section
  const skillsSectionIdx = lines.findIndex((l) => /^(skills|technologies|tech stack|tools)/i.test(l));
  let skills: string[] = [];
  if (skillsSectionIdx !== -1) {
    const block = lines.slice(skillsSectionIdx + 1, skillsSectionIdx + 8).join(", ");
    skills = block
      .split(/[,•·|\/\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && s.length < 30 && !/^(experience|education|projects)/i.test(s))
      .slice(0, 18);
  }
  if (skills.length === 0) {
    const common = ["JavaScript", "TypeScript", "React", "Node.js", "Python", "Go", "Rust", "SQL", "AWS", "Docker", "Kubernetes", "GraphQL", "Next.js", "Tailwind"];
    skills = common.filter((s) => new RegExp(`\\b${s.replace(".", "\\.")}\\b`, "i").test(clean));
  }

  // Bio: first paragraph after "summary" or "about"
  let bio = "";
  const summaryIdx = lines.findIndex((l) => /^(summary|about|profile|objective)/i.test(l));
  if (summaryIdx !== -1) {
    bio = lines.slice(summaryIdx + 1, summaryIdx + 4).join(" ");
  }
  if (!bio) bio = `${title} based on resume.`;

  // Experience: parse blocks under "experience"
  const expIdx = lines.findIndex((l) => /^(experience|work|employment)/i.test(l));
  const experience: PortfolioData["experience"] = [];
  if (expIdx !== -1) {
    const endIdx = lines.findIndex((l, i) => i > expIdx && /^(education|projects|skills|certifications)/i.test(l));
    const block = lines.slice(expIdx + 1, endIdx === -1 ? expIdx + 25 : endIdx);
    let cur: any = null;
    for (const l of block) {
      const dateMatch = l.match(/(\d{4})\s*[–-]\s*(\d{4}|present|now)/i);
      if (dateMatch) {
        if (cur) experience.push(cur);
        cur = { role: l.replace(dateMatch[0], "").trim() || "Role", company: "", period: dateMatch[0], description: "" };
      } else if (cur && !cur.company) {
        cur.company = l;
      } else if (cur) {
        cur.description = (cur.description ? cur.description + " " : "") + l;
      }
    }
    if (cur) experience.push(cur);
  }

  // Education
  const eduIdx = lines.findIndex((l) => /^education/i.test(l));
  const education: PortfolioData["education"] = [];
  if (eduIdx !== -1) {
    const block = lines.slice(eduIdx + 1, eduIdx + 8);
    let cur: any = null;
    for (const l of block) {
      const dateMatch = l.match(/(\d{4})\s*[–-]\s*(\d{4}|present)/i);
      if (dateMatch) {
        if (cur) education.push(cur);
        cur = { degree: l.replace(dateMatch[0], "").trim() || "Degree", school: "", period: dateMatch[0] };
      } else if (cur && !cur.school) {
        cur.school = l;
      }
    }
    if (cur) education.push(cur);
  }

  const links: PortfolioData["links"] = [];
  if (linkedinMatch) links.push({ label: "LinkedIn", url: `https://linkedin.com/in/${linkedinMatch[1]}` });
  for (const u of urlMatches.slice(0, 4)) {
    if (!/github\.com|linkedin\.com/.test(u)) links.push({ label: new URL(u).hostname.replace("www.", ""), url: u });
  }

  return {
    name,
    title,
    bio,
    email: emailMatch?.[0] ?? "",
    github: githubMatch?.[1] ?? "",
    skills,
    experience,
    education,
    links,
    website: urlMatches.find((u) => !/github\.com|linkedin\.com/.test(u)) ?? "",
    location: "",
  };
}
