export function extractUsername(input: string): string {
  const m = input.match(/github\.com\/([\w-]+)/);
  return m ? m[1] : input.replace(/^@/, "").trim();
}

export async function fetchGithub(username: string) {
  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`),
  ]);
  if (!userRes.ok) throw new Error(`GitHub user "${username}" not found.`);
  const user = await userRes.json();
  const repos = reposRes.ok ? await reposRes.json() : [];
  return { user, repos };
}

/** Build a screenshot URL for a live site or GitHub repo page */
export function screenshotUrl(liveUrl: string): string {
  return `https://image.thum.io/get/width/800/crop/450/noanimate/${encodeURIComponent(liveUrl)}`;
}

/**
 * Push portfolio.json to the user's GitHub profile repo (<username>/<username>).
 * Requires a GitHub Personal Access Token with `repo` or `public_repo` scope.
 * Uses the Contents API: GET to check for existing file SHA, then PUT to create/update.
 */
export async function pushPortfolioJson(
  username: string,
  token: string,
  portfolioJson: object,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const repo = username; // GitHub profile repo is <username>/<username>
  const path = "portfolio.json";
  const apiBase = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // 1. Check if file already exists to get its SHA (required for updates)
  let existingSha: string | undefined;
  try {
    const checkRes = await fetch(apiBase, { headers });
    if (checkRes.ok) {
      const existing = await checkRes.json();
      existingSha = existing.sha;
    }
  } catch {
    // file doesn't exist yet — that's fine
  }

  // 2. Build the JSON content, strip base64 gallery images (keep URLs only)
  const safePayload = stripBase64(portfolioJson);
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(safePayload, null, 2))));

  const body: Record<string, unknown> = {
    message: "chore: sync portfolio.json via FolioCV",
    content,
    ...(existingSha ? { sha: existingSha } : {}),
  };

  try {
    const res = await fetch(apiBase, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, url: data.content?.html_url };
    }

    const err = await res.json().catch(() => ({}));
    return { ok: false, error: (err as any).message ?? `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Replace base64 data: URIs with empty string to keep JSON small */
function stripBase64(obj: unknown): unknown {
  if (typeof obj === "string") {
    return obj.startsWith("data:") ? "[base64 image — not synced]" : obj;
  }
  if (Array.isArray(obj)) return obj.map(stripBase64);
  if (obj && typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, stripBase64(v)]));
  }
  return obj;
}
