/**
 * scholar.ts
 * Fetches academic metrics from ORCID public API and a Scholar proxy.
 *
 * ORCID public API is free, CORS-friendly and requires no auth for public profiles.
 * Google Scholar has no official API; we use a Vercel serverless proxy (api/scholar.ts)
 * to scrape citation count + h-index server-side (avoids CORS / bot-detection).
 */

export interface AcademicStats {
  orcid?: string;
  scholarId?: string; // Google Scholar user ID, e.g. "abc123"
  name?: string;
  affiliation?: string;
  totalCitations?: number;
  hIndex?: number;
  i10Index?: number;
  works?: OrcidWork[];
  fetchedAt?: string; // ISO timestamp
  error?: string;
}

export interface OrcidWork {
  title: string;
  year?: string;
  journal?: string;
  doi?: string;
  url?: string;
  citations?: number;
}

// ─── ORCID ────────────────────────────────────────────────────────────────────

const ORCID_BASE = "https://pub.orcid.org/v3.0";

function orcidHeaders() {
  return { Accept: "application/json" };
}

export async function fetchOrcidProfile(orcid: string): Promise<Partial<AcademicStats>> {
  const clean = orcid.trim().replace(/^https?:\/\/orcid\.org\//, "");
  try {
    const [personRes, worksRes] = await Promise.all([
      fetch(`${ORCID_BASE}/${clean}/person`, { headers: orcidHeaders() }),
      fetch(`${ORCID_BASE}/${clean}/works`, { headers: orcidHeaders() }),
    ]);

    if (!personRes.ok) throw new Error(`ORCID person fetch failed: ${personRes.status}`);
    if (!worksRes.ok) throw new Error(`ORCID works fetch failed: ${worksRes.status}`);

    const person = await personRes.json();
    const worksData = await worksRes.json();

    const name =
      person?.name?."credit-name"?.value ||
      `${person?.name?.["given-names"]?.value ?? ""} ${person?.name?.["family-name"]?.value ?? ""}`.trim();

    const affiliation =
      person?.activities?.["employments"]?.["affiliation-group"]?.[0]
        ?.["summaries"]?.[0]?.["employment-summary"]?.["organization"]?.["name"] ||
      undefined;

    const rawWorks: OrcidWork[] = (
      (worksData?.["group"] as any[]) ?? []
    ).slice(0, 20).map((group: any) => {
      const summary = group?.["work-summary"]?.[0];
      const title = summary?.["title"]?.["title"]?.["value"] ?? "Untitled";
      const year = summary?.["publication-date"]?.["year"]?.["value"];
      const journal = summary?.["journal-title"]?.["value"];
      const doiExternalId = (summary?.["external-ids"]?.["external-id"] as any[])?.find(
        (id: any) => id?.["external-id-type"] === "doi"
      );
      const doi = doiExternalId?.["external-id-value"];
      const url = doi ? `https://doi.org/${doi}` : summary?.["url"]?.["value"];
      return { title, year, journal, doi, url };
    });

    return {
      orcid: clean,
      name: name || undefined,
      affiliation,
      works: rawWorks,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return { orcid: clean, error: err?.message ?? "ORCID fetch failed", fetchedAt: new Date().toISOString() };
  }
}

// ─── Google Scholar (via serverless proxy) ────────────────────────────────────

/**
 * Calls /api/scholar?id=<scholarId> which is a Vercel serverless function
 * that scrapes the Scholar profile page server-side.
 * Returns citation counts, h-index, i10-index.
 */
export async function fetchScholarStats(
  scholarId: string
): Promise<Partial<AcademicStats>> {
  try {
    const res = await fetch(`/api/scholar?id=${encodeURIComponent(scholarId.trim())}`);
    if (!res.ok) throw new Error(`Scholar proxy returned ${res.status}`);
    const data = await res.json();
    return {
      scholarId: scholarId.trim(),
      totalCitations: data?.citations,
      hIndex: data?.hIndex,
      i10Index: data?.i10Index,
      name: data?.name,
      affiliation: data?.affiliation,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      scholarId: scholarId.trim(),
      error: err?.message ?? "Scholar fetch failed",
      fetchedAt: new Date().toISOString(),
    };
  }
}

/**
 * Convenience: fetch from both sources and merge.
 * Scholar stats take precedence for metrics (citations, h-index);
 * ORCID provides the works list.
 */
export async function fetchAcademicStats(
  orcid?: string,
  scholarId?: string
): Promise<AcademicStats> {
  const results = await Promise.all([
    orcid ? fetchOrcidProfile(orcid) : Promise.resolve({}),
    scholarId ? fetchScholarStats(scholarId) : Promise.resolve({}),
  ]);

  const [orcidData, scholarData] = results;
  return {
    ...orcidData,
    ...scholarData,
    // Prefer ORCID works list; keep Scholar citation metrics
    works: orcidData.works ?? [],
    orcid: orcidData.orcid,
    scholarId: scholarData.scholarId,
    fetchedAt: new Date().toISOString(),
  };
}
