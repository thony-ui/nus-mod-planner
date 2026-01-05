"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SortableModuleCard } from "./sortable-module-card";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Plus, X } from "lucide-react";
import { University } from "@/types/module";

interface SemesterCardProps {
  semester: string;
  modules: string[];
  semesterMC: number;
  activeId: string | null;
  onAddModule: () => void;
  onDeleteModule: (moduleCode: string) => void;
  onDeleteSemester: () => void;

  university: University;
}

function DroppableSemesterCard({
  semester,
  children,
}: {
  semester: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: semester,
  });

  return (
    <div ref={setNodeRef} className="h-full">
      {children}
    </div>
  );
}

export function SemesterCard({
  semester,
  modules,
  semesterMC,
  activeId,
  onAddModule,
  onDeleteModule,
  onDeleteSemester,
  university,
}: SemesterCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {semester}
            <Badge variant="outline" className="ml-2">
              {semesterMC} MCs
            </Badge>
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={onDeleteSemester}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <DroppableSemesterCard semester={semester}>
        <CardContent className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 max-h-75 mb-4 overflow-y-auto">
            <SortableContext
              items={(modules || []).map((code) => `${semester}-${code}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 pr-4">
                {modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No modules added
                  </p>
                ) : (
                  modules.map((moduleCode) => (
                    <div key={moduleCode} className="relative group">
                      <SortableModuleCard
                        moduleCode={moduleCode}
                        isPinned={false}
                        semester={semester}
                        university={university}
                        isDragging={activeId === `${semester}-${moduleCode}`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-3 right-1  h-6 w-6 p-0 cursor-pointer"
                        onClick={() => onDeleteModule(moduleCode)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </SortableContext>
          </ScrollArea>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-auto"
            onClick={onAddModule}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </CardContent>
      </DroppableSemesterCard>
    </Card>
  );
}
