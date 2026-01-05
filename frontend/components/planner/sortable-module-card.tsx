"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, GripVertical } from "lucide-react";
import { University } from "@/types/module";

interface SortableModuleCardProps {
  moduleCode: string;
  isPinned: boolean;
  semester: string;
  isDragging?: boolean;

  university: University;
}

export function SortableModuleCard({
  moduleCode,
  isPinned,
  semester,
  isDragging,
  university,
}: SortableModuleCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: `${semester}-${moduleCode}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.3 : 1,
  };

  // TODO uh shag need to save the university also
  const nusmods_url = `https://nusmods.com/courses/${moduleCode}`;
  const ntumods_url = `https://ntumods.com/mods/${moduleCode}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 md:p-3 rounded-md border flex items-start gap-2 ${
        isPinned ? "bg-primary/5 border-primary" : "bg-muted/50"
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 pt-1"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex justify-between items-start gap-2 flex-1 min-w-0">
        <div
          rel="noopener noreferrer"
          className="font-medium flex items-center gap-1 flex-1 text-sm md:text-base truncate"
        >
          <span className="truncate">{moduleCode}</span>
        </div>
        {isPinned && (
          <Badge variant="secondary" className="text-xs shrink-0">
            Pinned
          </Badge>
        )}
      </div>
    </div>
  );
}
