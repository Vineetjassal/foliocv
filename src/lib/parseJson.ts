import type { PortfolioData } from "./types";

/**
 * A flexible JSON resume parser. Accepts either the popular
 * jsonresume.org schema or a simple flat shape.
 */
export function parseResumeJson(raw: any): Partial<PortfolioData> {
  if (!raw || typeof raw !== "object") return {};

  // JSON Resume schema (https://jsonresume.org)
  if (raw.basics || raw.work || raw.education) {
    const b = raw.basics ?? {};
    return {
      name: b.name ?? "",
      title: b.label ?? "",
      location: [b.location?.city, b.location?.region, b.location?.countryCode]
        .filter(Boolean)
        .join(", "),
      bio: b.summary ?? "",
      about: raw.about ?? b.summary ?? "",
      email: b.email ?? "",
      website: b.url ?? b.website ?? "",
      github:
        (b.profiles ?? []).find((p: any) => /github/i.test(p.network ?? ""))?.username ?? "",
      avatar: b.image ?? "",
      skills: (raw.skills ?? [])
        .flatMap((s: any) => (s.keywords?.length ? s.keywords : [s.name]))
        .filter(Boolean)
        .slice(0, 24),
      experience: (raw.work ?? []).map((w: any) => ({
        role: w.position ?? w.role ?? "",
        company: w.name ?? w.company ?? "",
        period: `${w.startDate ?? ""}${w.endDate ? ` – ${w.endDate}` : " – Present"}`,
        description: w.summary ?? w.description ?? "",
      })),
      education: (raw.education ?? []).map((e: any) => ({
        degree: [e.studyType, e.area].filter(Boolean).join(" in ") || e.degree || "",
        school: e.institution ?? e.school ?? "",
        period: `${e.startDate ?? ""}${e.endDate ? ` – ${e.endDate}` : ""}`,
      })),
      projects: (raw.projects ?? []).map((p: any) => ({
        name: p.name ?? "",
        description: p.description ?? "",
        url: p.url ?? "",
        language: (p.keywords ?? [])[0],
        image: p.image,
        include: true,
      })),
      links: (b.profiles ?? [])
        .filter((p: any) => !/github/i.test(p.network ?? ""))
        .map((p: any) => ({ label: p.network ?? "link", url: p.url ?? "" })),
    };
  }

  // Simple flat shape — pass through known fields
  return {
    name: raw.name,
    title: raw.title ?? raw.headline,
    location: raw.location,
    bio: raw.bio ?? raw.summary,
    about: raw.about ?? raw.bio ?? raw.summary,
    email: raw.email,
    website: raw.website ?? raw.url,
    github: raw.github,
    avatar: raw.avatar,
    skills: raw.skills ?? [],
    experience: raw.experience ?? raw.work ?? [],
    education: raw.education ?? [],
    projects: (raw.projects ?? []).map((p: any) => ({ include: true, ...p })),
    links: raw.links ?? [],
  };
}

export const sampleResumeJson = {
  name: "Ada Lovelace",
  title: "Software Engineer",
  location: "London, UK",
  bio: "Engineer who loves building elegant tools.",
  about:
    "I'm a software engineer focused on developer tooling, design systems, and crafting calm, useful interfaces. Previously I worked across analytical engines and visual programming environments.",
  email: "ada@example.com",
  website: "https://example.com",
  github: "adalovelace",
  skills: ["TypeScript", "React", "Node.js", "Postgres", "Figma"],
  experience: [
    {
      role: "Senior Engineer",
      company: "Analytical Co.",
      period: "2022 – Present",
      description: "Led the design system and editor experience.",
    },
  ],
  education: [
    { degree: "B.Sc. Computer Science", school: "Trinity College", period: "2014 – 2018" },
  ],
  projects: [],
  links: [{ label: "Twitter", url: "https://twitter.com/adalovelace" }],
};
