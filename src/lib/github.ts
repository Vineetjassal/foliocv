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

// ── GitHub Pages Deploy ───────────────────────────────────────────────────────

export interface GhPagesResult {
  ok: boolean;
  /** URL of the deployed GitHub Pages site */
  siteUrl?: string;
  /** URL of the repo on GitHub */
  repoUrl?: string;
  error?: string;
}

/**
 * Deploy the portfolio to GitHub Pages.
 * Strategy:
 *  1. Ensure repo `<username>/<repoName>` exists (create if missing).
 *  2. Push `index.html` + `styles.css` to the repo's default branch.
 *  3. Enable GitHub Pages on that branch (root).
 *
 * Requires a PAT with `repo` scope (to create/update repo + enable Pages).
 */
export async function deployToGitHubPages(
  username: string,
  token: string,
  html: string,
  css: string,
  repoName = "foliocv-portfolio",
): Promise<GhPagesResult> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const repoApi = `https://api.github.com/repos/${username}/${repoName}`;

  // 1. Create repo if it doesn't exist
  const repoCheck = await fetch(repoApi, { headers });
  if (!repoCheck.ok) {
    const createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: repoName,
        description: "Portfolio generated with FolioCV",
        homepage: `https://${username}.github.io/${repoName}`,
        private: false,
        auto_init: true,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      return { ok: false, error: (err as any).message ?? `Failed to create repo (HTTP ${createRes.status})` };
    }
    // Wait a moment for GitHub to initialise the repo
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Helper: upsert a file (create or update)
  async function upsertFile(path: string, fileContent: string, commitMsg: string) {
    const fileApi = `${repoApi}/contents/${path}`;
    let sha: string | undefined;
    const existing = await fetch(fileApi, { headers });
    if (existing.ok) {
      const d = await existing.json();
      sha = d.sha;
    }
    const encoded = btoa(unescape(encodeURIComponent(fileContent)));
    const res = await fetch(fileApi, {
      method: "PUT",
      headers,
      body: JSON.stringify({ message: commitMsg, content: encoded, ...(sha ? { sha } : {}) }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message ?? `HTTP ${res.status}`);
    }
  }

  try {
    // 2. Push index.html — embed CSS inline for single-file deploy
    const inlineHtml = html.replace("</head>", `<style>\n${css}\n</style>\n</head>`);
    await upsertFile("index.html", inlineHtml, "deploy: update portfolio via FolioCV");

    // Also push styles.css separately for reference
    await upsertFile("styles.css", css, "deploy: update styles via FolioCV");

    // 3. Enable GitHub Pages on the default branch (main / master)
    // First, get the default branch
    const repoData = await (await fetch(repoApi, { headers })).json();
    const branch = repoData.default_branch ?? "main";

    const pagesRes = await fetch(`${repoApi}/pages`, {
      method: "POST",
      headers,
      body: JSON.stringify({ source: { branch, path: "/" } }),
    });

    // 422 = Pages already enabled — that's fine
    if (!pagesRes.ok && pagesRes.status !== 422) {
      // Try PATCH to update existing Pages config
      await fetch(`${repoApi}/pages`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ source: { branch, path: "/" } }),
      });
    }

    const siteUrl = `https://${username}.github.io/${repoName}`;
    const repoUrl = `https://github.com/${username}/${repoName}`;
    return { ok: true, siteUrl, repoUrl };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── Vercel Deploy ─────────────────────────────────────────────────────────────

export interface VercelDeployResult {
  ok: boolean;
  /** Public URL of the Vercel deployment */
  url?: string;
  error?: string;
}

/**
 * Deploy the portfolio to Vercel using the Deployments API v13.
 * Requires a Vercel personal access token (Settings → Tokens → scope: Full Account).
 * Docs: https://vercel.com/docs/rest-api/endpoints/deployments
 */
export async function deployToVercel(
  token: string,
  html: string,
  css: string,
  name = "foliocv-portfolio",
): Promise<VercelDeployResult> {
  // Embed CSS inline so the portfolio is a single-file deployment
  const inlineHtml = html.replace("</head>", `<style>\n${css}\n</style>\n</head>`);

  const body = {
    name,
    target: "production",
    files: [
      {
        file: "index.html",
        data: inlineHtml,
        encoding: "utf-8",
      },
    ],
    projectSettings: {
      framework: null,
      outputDirectory: ".",
    },
  };

  try {
    const res = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok && data.url) {
      return { ok: true, url: `https://${data.url}` };
    }

    return {
      ok: false,
      error: data.error?.message ?? data.message ?? `HTTP ${res.status}`,
    };
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
