import { useState, useRef } from "react";
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Section {
  id: string;
  label: string;
  isCustom?: boolean;
  content?: React.ReactNode;
}

interface SortableSectionListProps {
  sections: Section[];
  onReorder: (reordered: Section[]) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function SortableSectionList({
  sections,
  onReorder,
  onDelete,
  className,
}: SortableSectionListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  // Use a ref so event handlers always see the latest value without stale closure issues
  const dragIndexRef = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    // Required for Firefox compatibility
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
    dragIndexRef.current = index;
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;
    setOverIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;
    setOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const srcIndex = dragIndexRef.current;
    if (srcIndex === null || srcIndex === dropIndex) {
      resetDrag();
      return;
    }
    const reordered = [...sections];
    const [moved] = reordered.splice(srcIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    onReorder(reordered);
    resetDrag();
  };

  const resetDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
    dragIndexRef.current = null;
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...sections];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    onReorder(reordered);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const reordered = [...sections];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    onReorder(reordered);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {sections.map((section, index) => (
        <div
          key={section.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={resetDrag}
          className={cn(
            "flex items-center gap-3 rounded-lg border bg-card px-4 py-3 cursor-grab active:cursor-grabbing transition-all duration-150 select-none",
            dragIndex === index && "opacity-40 scale-[0.97] ring-1 ring-primary/40",
            overIndex === index &&
              dragIndex !== index &&
              "border-primary border-2 bg-primary/5 scale-[1.01]",
            section.isCustom && "border-dashed"
          )}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm truncate block">{section.label}</span>
            {section.isCustom && (
              <span className="text-[10px] text-muted-foreground">Custom section</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                aria-label="Move up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === sections.length - 1}
                className="p-0.5 rounded hover:bg-accent disabled:opacity-30"
                aria-label="Move down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            {section.isCustom && onDelete && (
              <button
                onClick={() => onDelete(section.id)}
                className="ml-1 p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition"
                aria-label={`Delete ${section.label}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
