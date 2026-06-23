/**
 * api/scholar.ts  –  Vercel serverless function
 *
 * Proxies a Google Scholar profile page fetch server-side to bypass CORS
 * and bot-detection. Parses citation count, h-index, i10-index from the HTML.
 *
 * Usage: GET /api/scholar?id=<Google_Scholar_user_id>
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing ?id= parameter" });
  }

  const url = `https://scholar.google.com/citations?user=${encodeURIComponent(id)}&hl=en`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FolioCVBot/1.0; +https://github.com/vineetjassal/foliocv)",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Scholar responded with ${response.status}` });
    }

    const html = await response.text();

    // Parse name
    const nameMatch = html.match(/<div id="gsc_prf_in"[^>]*>([^<]+)<\/div>/);
    const name = nameMatch ? nameMatch[1].trim() : undefined;

    // Parse affiliation
    const affiliationMatch = html.match(/<div class="gsc_prf_il"[^>]*>([^<]+)<\/div>/);
    const affiliation = affiliationMatch ? affiliationMatch[1].trim() : undefined;

    // Parse stats table: citations, h-index, i10-index
    // Scholar renders a <table id="gsc_rsb_st"> with rows for each metric
    const statsRows = [...html.matchAll(/<td class="gsc_rsb_std">([\d,]+)<\/td>/g)];
    const parseNum = (s: string) => parseInt(s.replace(/,/g, ""), 10);

    const citations = statsRows[0] ? parseNum(statsRows[0][1]) : undefined;
    const hIndex = statsRows[2] ? parseNum(statsRows[2][1]) : undefined;
    const i10Index = statsRows[4] ? parseNum(statsRows[4][1]) : undefined;

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json({ name, affiliation, citations, hIndex, i10Index });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Internal server error" });
  }
}
