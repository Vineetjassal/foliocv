export interface GhUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  location: string | null;
  blog: string | null;
  email: string | null;
  html_url: string;
}
export interface GhRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
}

export function extractUsername(input: string): string {
  const t = input.trim();
  const m = t.match(/github\.com\/([A-Za-z0-9-]+)/i);
  if (m) return m[1];
  return t.replace(/^@/, "");
}

export async function fetchGithub(username: string): Promise<{ user: GhUser; repos: GhRepo[] }> {
  const [uRes, rRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
  ]);
  if (!uRes.ok) throw new Error(`GitHub user not found (${uRes.status})`);
  const user = (await uRes.json()) as GhUser;
  const repos = (await rRes.json()) as GhRepo[];
  return { user, repos };
}

/**
 * Returns a URL for a live screenshot of the given URL.
 * Uses thum.io — free, no API key required.
 * Falls back to the URL itself so <img> still renders something.
 */
export function screenshotUrl(url: string, width = 800, height = 450): string {
  return `https://image.thum.io/get/width/${width}/crop/${height}/noanimate/${encodeURIComponent(url)}`;
}
