import { useState, useEffect, useCallback } from "react";
import {
  getSnapshots,
  saveSnapshot,
  deleteSnapshot,
  clearAllSnapshots,
  type Snapshot,
} from "@/lib/store";
import type { PortfolioData, TemplateId } from "@/lib/types";

interface Props {
  data: PortfolioData;
  template: TemplateId;
  onRestore: (snap: Snapshot) => void;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatFull(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryPanel({ data, template, onRestore }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [restoredId, setRestoredId] = useState<string | null>(null);

  const refresh = useCallback(() => setSnapshots(getSnapshots()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleSave() {
    setSaving(true);
    saveSnapshot(data, template);
    refresh();
    const snaps = getSnapshots();
    setSavedId(snaps[0]?.id ?? null);
    setSaving(false);
    setTimeout(() => setSavedId(null), 2000);
  }

  function handleRestore(snap: Snapshot) {
    setRestoredId(snap.id);
    onRestore(snap);
    setTimeout(() => setRestoredId(null), 2000);
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    deleteSnapshot(id);
    refresh();
  }

  function handleClearAll() {
    if (!confirmClear) { setConfirmClear(true); return; }
    clearAllSnapshots();
    refresh();
    setConfirmClear(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Version History</div>
        <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">
          Save up to 10 snapshots. Restore any version instantly — stored locally in your browser.
        </p>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-foreground py-2.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50 transition"
      >
        {savedId ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Snapshot saved!
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save current version
          </>
        )}
      </button>

      {/* Snapshot count badge */}
      {snapshots.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {snapshots.length} / 10 snapshots
          </span>
          <button
            onClick={handleClearAll}
            className={`text-[10px] transition ${
              confirmClear
                ? "font-medium text-destructive"
                : "text-muted-foreground hover:text-destructive"
            }`}
          >
            {confirmClear ? "Tap again to confirm" : "Clear all"}
          </button>
        </div>
      )}

      {/* Snapshot list */}
      {snapshots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-10 gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
            <path d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          <p className="text-[11px] text-muted-foreground">No snapshots yet</p>
          <p className="text-[10px] text-muted-foreground/60">Save a version to start tracking history</p>
        </div>
      ) : (
        <div className="space-y-2">
          {snapshots.map((snap, index) => (
            <div
              key={snap.id}
              className={`group relative rounded-xl border p-3 transition ${
                restoredId === snap.id
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-border bg-background hover:border-muted-foreground"
              }`}
            >
              {/* Version badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-mono text-muted-foreground">
                    {snapshots.length - index}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium">{snap.label}</p>
                    <p className="text-[10px] text-muted-foreground" title={formatFull(snap.savedAt)}>
                      {timeAgo(snap.savedAt)} · {snap.template}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {/* Restore */}
                  <button
                    onClick={() => handleRestore(snap)}
                    className="rounded-md border border-border bg-muted px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition"
                  >
                    {restoredId === snap.id ? "✓ Restored" : "Restore"}
                  </button>
                  {/* Delete */}
                  <button
                    onClick={(e) => handleDelete(snap.id, e)}
                    aria-label="Delete snapshot"
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-muted-foreground hover:border-destructive/40 hover:text-destructive transition opacity-0 group-hover:opacity-100"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
                <span>{snap.data.projects?.filter(p => p.include !== false).length ?? 0} projects</span>
                <span>{snap.data.experience?.length ?? 0} jobs</span>
                <span>{snap.data.skills?.length ?? 0} skills</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Storage note */}
      <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
        Snapshots are saved in your browser's localStorage.<br />Clearing browser data will remove them.
      </p>
    </div>
  );
}
