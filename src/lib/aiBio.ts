/**
 * AI bio enhancer — no API key required.
 * Uses Hugging Face free Inference API (Mistral-7B).
 * Falls back to a smart rule-based rewriter that handles LinkedIn-style bios
 * (pipe-separated tokens, abbreviations, @mentions, certifications, awards).
 */

const HF_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

// ── Abbreviation / shorthand dictionary ──────────────────────────────────────
const EXPAND: Record<string, string> = {
  ML: "Machine Learning",
  AI: "Artificial Intelligence",
  BS: "Bachelor of Science",
  BE: "Bachelor of Engineering",
  BTech: "B.Tech",
  MS: "Master of Science",
  PhD: "PhD",
  SWE: "Software Engineer",
  SDE: "Software Development Engineer",
  DS: "Data Science",
  NLP: "Natural Language Processing",
  CV: "Computer Vision",
  FS: "Full Stack",
  FE: "Frontend",
  BE2: "Backend",
  DevOps: "DevOps",
  POTM: "Profile of the Month",
  OSS: "Open Source",
  Hons: "Honours",
  "Hons.": "Honours",
};

function expandAbbr(text: string): string {
  return text.replace(/\b([A-Z]{2,}|Hons\.?)\b/g, (m) => EXPAND[m] ?? m);
}

// ── Parse a messy LinkedIn-style bio string ───────────────────────────────────
interface ParsedBio {
  roles: string[];
  certs: string[];
  education: string[];
  awards: string[];
  orgs: string[];
  projects: string[];
  rest: string[];
}

function parseBio(raw: string): ParsedBio {
  // Split on | · • / and newlines
  const tokens = raw
    .split(/[|·•\/\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const roles: string[] = [];
  const certs: string[] = [];
  const education: string[] = [];
  const awards: string[] = [];
  const orgs: string[] = [];
  const projects: string[] = [];
  const rest: string[] = [];

  for (const tok of tokens) {
    const t = tok.trim();
    // Certifications
    if (/certified|certification|\(certified\)/i.test(t)) {
      certs.push(expandAbbr(t));
    }
    // Education — degree patterns
    else if (
      /\b(BS|BE|MS|BTech|B\.Tech|B\.Sc|Bachelor|Master|PhD|Maths|Math|Science|Hons)\b/i.test(t)
    ) {
      education.push(expandAbbr(t));
    }
    // Awards — POTM, award, winner, top, #1
    else if (/\d+x\s+\w+|\bPOTM\b|award|winner|top spot|#1|spotlight/i.test(t)) {
      awards.push(expandAbbr(t));
    }
    // Organisations — @mention
    else if (/@\w+/.test(t)) {
      // Strip leading @ from org name
      orgs.push(t.replace(/@(\w+)/g, "$1"));
    }
    // Building / building X projects
    else if (/^building\s+/i.test(t)) {
      projects.push(t.replace(/^building\s+/i, "").trim());
    }
    // Role-like tokens (contains Engineer, Developer, Scientist, etc.)
    else if (
      /engineer|developer|scientist|designer|founder|researcher|analyst|architect|lead|manager|intern/i.test(
        t,
      )
    ) {
      roles.push(expandAbbr(t));
    } else {
      rest.push(expandAbbr(t));
    }
  }

  return { roles, certs, education, awards, orgs, projects, rest };
}

// ── Rule-based paragraph writer ───────────────────────────────────────────────
function ruleBasedEnhance(raw: string, name: string, title: string): string {
  const p = parseBio(raw);
  const parts: string[] = [];

  // Opener with name + primary role
  const primaryRole = p.roles[0] || title || "professional";
  const displayName = name?.trim() || "They";

  // Sentence 1 — who they are
  if (p.projects.length) {
    parts.push(
      `${displayName} is a ${primaryRole} currently building ${p.projects.join(" and ")}.`,
    );
  } else {
    parts.push(`${displayName} is a ${primaryRole}.`);
  }

  // Sentence 2 — education
  if (p.education.length) {
    const edu = p.education.join(", ");
    parts.push(`${name?.split(" ")[0] || "They"} is pursuing a ${edu}.`);
  }

  // Sentence 3 — certifications
  if (p.certs.length) {
    parts.push(
      `${name?.split(" ")[0] || "They"} holds certifications in ${p.certs.join(" and ")}, reinforcing a deep commitment to the field.`,
    );
  }

  // Sentence 4 — awards & recognition
  if (p.awards.length) {
    const aw = p.awards.join(" and ");
    parts.push(
      `Recognised for outstanding contributions, ${name?.split(" ")[0] || "they"} has earned ${aw}.`,
    );
  }

  // Sentence 5 — orgs / affiliations
  if (p.orgs.length) {
    parts.push(`${name?.split(" ")[0] || "They"} is affiliated with ${p.orgs.join(", ")}.`);
  }

  // Sentence 6 — anything leftover
  if (p.rest.length) {
    parts.push(p.rest.join(" "));
  }

  return parts
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── HuggingFace AI call ───────────────────────────────────────────────────────
export async function enhanceBio(raw: string, name: string, title: string): Promise<string> {
  const prompt = `<s>[INST]
You are a professional bio writer. The user has given you a messy LinkedIn-style bio string with pipe-separated fragments, abbreviations like "ML", "BS Maths", "POTM", "@Peerlist", certifications, and award shoutouts.

Your job:
1. Parse ALL the fragments carefully — do not skip any.
2. Expand abbreviations (ML → Machine Learning, BS → Bachelor of Science, POTM → Profile of the Month, Hons → Honours, etc.).
3. Rewrite as 2-3 fluent, confident paragraph sentences in FIRST PERSON.
4. Cover: current role/what they're building, education, certifications, awards/recognition, affiliations.
5. Tone: warm, professional, human — no clichés like "passionate about" or "results-driven".
6. Output ONLY the rewritten bio. No explanations, no labels, no quotes.

Name: ${name || "the person"}
Role: ${title || ""}
Raw bio: "${raw}"
[/INST]`;

  try {
    const res = await fetch(HF_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.65,
          top_p: 0.9,
          return_full_text: false,
        },
      }),
    });
    if (!res.ok) throw new Error("HF error");
    const data = await res.json();
    const text: string =
      (Array.isArray(data) ? data[0]?.generated_text : data?.generated_text) ?? "";
    // Strip any echoed prompt or [INST] tags
    const clean = text
      .replace(/^.*\[\/?INST\]/s, "")
      .replace(/^\s*["']|["']\s*$/g, "")
      .trim();
    if (clean.length > 20) return clean;
    throw new Error("empty response");
  } catch {
    return ruleBasedEnhance(raw, name, title);
  }
}
