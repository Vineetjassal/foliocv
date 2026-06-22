import { useState, useRef } from "react";
import { GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Section {
  id: string;
  label: string;
  content?: React.ReactNode;
}

interface SortableSectionListProps {
  sections: Section[];
  onReorder: (reordered: Section[]) => void;
  className?: string;
}

export function SortableSectionList({
  sections,
  onReorder,
  className,
}: SortableSectionListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragIndex === null || overIndex === null || dragIndex === overIndex) {
      resetDrag();
      return;
    }
    const reordered = [...sections];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(overIndex, 0, moved);
    onReorder(reordered);
    resetDrag();
  };

  const resetDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
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
          ref={dragIndex === index ? dragNodeRef : undefined}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          onDragEnd={resetDrag}
          className={cn(
            "flex items-center gap-3 rounded-lg border bg-card px-4 py-3 cursor-grab active:cursor-grabbing transition-all",
            dragIndex === index && "opacity-50 scale-95",
            overIndex === index && dragIndex !== index && "border-primary border-2 bg-primary/5"
          )}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="flex-1 font-medium text-sm">{section.label}</span>
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
        </div>
      ))}
    </div>
  );
}
