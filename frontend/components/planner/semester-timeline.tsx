"use client";

import { forwardRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableModuleCard } from "./sortable-module-card";
import { SensorDescriptor, SensorOptions } from "@dnd-kit/core";

interface SemesterTimelineProps {
  semesterPlan: Record<string, string[]>;
  pinnedModules: Record<string, string[]>;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEnd: (event: DragEndEvent) => void;
}

export const SemesterTimeline = forwardRef<
  HTMLDivElement,
  SemesterTimelineProps
>(({ semesterPlan, pinnedModules, sensors, onDragEnd }, ref) => {
  const semesters = Object.keys(semesterPlan).sort();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    onDragEnd(event);
  };

  const getModuleInfo = (id: string | null) => {
    if (!id) return null;
    const [semester, moduleCode] = id.split("-");
    const isPinned = (pinnedModules[semester] || []).includes(moduleCode);
    return { semester, moduleCode, isPinned };
  };

  const activeModule = getModuleInfo(activeId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Semester Plan</CardTitle>
        <CardDescription>Your module timeline across semesters</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={ref}>
          <ScrollArea className="h-[calc(100vh-400px)] min-h-100 max-h-200 pr-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-4 md:space-y-6">
                {semesters.map((semester) => {
                  const modules = semesterPlan[semester] || [];
                  const semesterPinnedModules = pinnedModules[semester] || [];

                  return (
                    <div
                      key={semester}
                      className="border rounded-lg p-3 md:p-4"
                    >
                      <div className="flex justify-between items-center mb-3 md:mb-4">
                        <h3 className="text-base md:text-lg font-semibold">
                          {semester}
                        </h3>
                        <Badge variant="outline" className="text-xs md:text-sm">
                          {modules.length} modules
                        </Badge>
                      </div>
                      <SortableContext
                        items={modules.map((m) => `${semester}-${m}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3">
                          {modules.map((moduleCode) => {
                            const isPinned =
                              semesterPinnedModules.includes(moduleCode);
                            return (
                              <SortableModuleCard
                                key={`${semester}-${moduleCode}`}
                                moduleCode={moduleCode}
                                isPinned={isPinned}
                                semester={semester}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </div>
                  );
                })}
              </div>
              <DragOverlay>
                {activeModule ? (
                  <div
                    className={`p-3 rounded-md border cursor-move shadow-lg ${
                      activeModule.isPinned
                        ? "bg-primary/5 border-primary"
                        : "bg-muted/50"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-medium">
                        {activeModule.moduleCode}
                      </span>
                      {activeModule.isPinned && (
                        <Badge variant="secondary" className="text-xs">
                          Pinned
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
});

SemesterTimeline.displayName = "SemesterTimeline";
