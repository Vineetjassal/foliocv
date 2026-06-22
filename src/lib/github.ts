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
