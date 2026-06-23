import React, { useEffect, useState } from "react";
import { fetchAcademicStats, type AcademicStats } from "@/lib/scholar";

interface Props {
  orcid?: string;
  scholarId?: string;
  /** If true, renders a compact badge row (for portfolio cards) */
  compact?: boolean;
}

export function AcademicStats({ orcid, scholarId, compact = false }: Props) {
  const [data, setData] = useState<AcademicStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orcid && !scholarId) return;
    setLoading(true);
    fetchAcademicStats(orcid, scholarId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [orcid, scholarId]);

  if (!orcid && !scholarId) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
        <span className="h-3 w-3 rounded-full bg-muted-foreground/40 inline-block" />
        Fetching academic stats…
      </div>
    );
  }

  if (!data) return null;

  if (data.error && !data.totalCitations && !data.works?.length) {
    return (
      <p className="text-xs text-destructive">
        Could not load academic stats: {data.error}
      </p>
    );
  }

  const metrics = [
    data.totalCitations !== undefined && {
      label: "Citations",
      value: data.totalCitations.toLocaleString(),
      icon: "📚",
    },
    data.hIndex !== undefined && {
      label: "h-index",
      value: data.hIndex,
      icon: "📈",
    },
    data.i10Index !== undefined && {
      label: "i10-index",
      value: data.i10Index,
      icon: "🔟",
    },
  ].filter(Boolean) as { label: string; value: string | number; icon: string }[];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {metrics.map((m) => (
          <span
            key={m.label}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium"
          >
            {m.icon} {m.label}: <strong>{m.value}</strong>
          </span>
        ))}
        {scholarId && (
          <a
            href={`https://scholar.google.com/citations?user=${scholarId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Google Scholar ↗
          </a>
        )}
        {orcid && (
          <a
            href={`https://orcid.org/${orcid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            ORCID ↗
          </a>
        )}
      </div>
    );
  }

  // Full expanded view
  return (
    <section className="space-y-4">
      <h3 className="text-lg font-semibold tracking-tight">Academic Profile</h3>

      {/* Metric badges */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl border border-border bg-card p-3 text-center shadow-sm"
            >
              <div className="text-2xl font-bold text-primary">{m.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {m.icon} {m.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* External profile links */}
      <div className="flex gap-2 flex-wrap">
        {scholarId && (
          <a
            href={`https://scholar.google.com/citations?user=${scholarId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-3 py-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <img
              src="https://scholar.google.com/favicon.ico"
              alt=""
              className="w-4 h-4"
            />
            Google Scholar
          </a>
        )}
        {orcid && (
          <a
            href={`https://orcid.org/${orcid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-3 py-1.5 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            <span className="font-bold text-base leading-none">iD</span>
            ORCID
          </a>
        )}
      </div>

      {/* Recent publications from ORCID */}
      {data.works && data.works.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Works
          </h4>
          <ul className="space-y-2">
            {data.works.slice(0, 5).map((work, i) => (
              <li
                key={i}
                className="rounded-lg border border-border bg-card/50 p-3 text-sm"
              >
                <div className="font-medium leading-snug">
                  {work.url ? (
                    <a
                      href={work.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                    >
                      {work.title}
                    </a>
                  ) : (
                    work.title
                  )}
                </div>
                <div className="text-muted-foreground text-xs mt-0.5">
                  {[work.journal, work.year].filter(Boolean).join(" · ")}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
