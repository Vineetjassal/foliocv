import { useState } from "react";
import { Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { CustomSection } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CustomSectionBuilderProps {
  customSections: CustomSection[];
  onChange: (updated: CustomSection[]) => void;
}

export function CustomSectionBuilder({ customSections, onChange }: CustomSectionBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const addSection = () => {
    const label = newLabel.trim();
    if (!label) return;
    const newSection: CustomSection = {
      id: `custom_${Date.now()}`,
      label,
      content: "",
    };
    onChange([...customSections, newSection]);
    setNewLabel("");
    setAdding(false);
    setExpandedId(newSection.id);
  };

  const updateSection = (id: string, patch: Partial<CustomSection>) => {
    onChange(customSections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const deleteSection = (id: string) => {
    onChange(customSections.filter((s) => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="space-y-2">
      {customSections.map((sec) => (
        <div
          key={sec.id}
          className="rounded-lg border border-dashed border-border bg-card overflow-hidden"
        >
          {/* Header row */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <button
              className="flex-1 text-left min-w-0"
              onClick={() => setExpandedId(expandedId === sec.id ? null : sec.id)}
            >
              <span className="text-sm font-medium truncate block">{sec.label || "Untitled Section"}</span>
              {sec.content && (
                <span className="text-[10px] text-muted-foreground">
                  {sec.content.slice(0, 40)}{sec.content.length > 40 ? "\u2026" : ""}
                </span>
              )}
            </button>
            <button
              onClick={() => setExpandedId(expandedId === sec.id ? null : sec.id)}
              className="p-1 rounded hover:bg-accent text-muted-foreground flex-shrink-0"
              aria-label="Toggle expand"
            >
              {expandedId === sec.id ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => deleteSection(sec.id)}
              className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition flex-shrink-0"
              aria-label={`Delete ${sec.label}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Expanded editor */}
          {expandedId === sec.id && (
            <div className="border-t border-border px-3 py-3 space-y-3 bg-background/40">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={sec.label}
                  onChange={(e) => updateSection(sec.id, { label: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Publications, Awards, Conferences\u2026"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1">
                  Content
                </label>
                <textarea
                  value={sec.content}
                  onChange={(e) => updateSection(sec.id, { content: e.target.value })}
                  rows={6}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y font-mono"
                  placeholder={"Write your content here.\nUse blank lines to separate paragraphs.\n\n\u2022 Bullet point one\n\u2022 Bullet point two"}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Plain text. Start a line with \u2022 or - for bullets. Blank line = new paragraph.
                </p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new section form */}
      {adding ? (
        <div className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-3 space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground block">
            Section Name
          </label>
          <input
            autoFocus
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addSection();
              if (e.key === "Escape") {
                setAdding(false);
                setNewLabel("");
              }
            }}
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="e.g. Publications, Awards, Conferences\u2026"
          />
          <div className="flex gap-2">
            <button
              onClick={addSection}
              disabled={!newLabel.trim()}
              className={cn(
                "flex-1 rounded-md py-1.5 text-xs font-medium transition",
                newLabel.trim()
                  ? "bg-foreground text-background hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Add Section
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewLabel("");
              }}
              className="px-3 rounded-md border border-border text-xs hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add custom section
        </button>
      )}
    </div>
  );
}
