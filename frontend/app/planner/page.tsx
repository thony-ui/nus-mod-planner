"use client";

import { useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  useActivePlan,
  usePlan,
  useUpdatePlan,
  useGeneratePlan,
} from "@/hooks/use-plans";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Edit2, Check, X, Download } from "lucide-react";
import { DragEndEvent } from "@dnd-kit/core";
import { useDragDropSensors, handleModuleDragEnd } from "@/hooks/use-drag-drop";
import { exportPlanToPDF } from "@/lib/pdf-export";
import { PlanSettings } from "@/components/planner/plan-settings";
import { SemesterTimeline } from "@/components/planner/semester-timeline";
import { ProtectedRoute } from "@/components/layout/protected-route";

export default function PlannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");

  // Fetch specific plan if planId is provided, otherwise fetch active plan
  const { data: activePlan, isLoading: activeLoading } = useActivePlan();
  const { data: specificPlan, isLoading: specificLoading } = usePlan(
    planId || ""
  );

  const plan = planId ? specificPlan : activePlan;
  const isLoading = planId ? specificLoading : activeLoading;

  const updatePlan = useUpdatePlan();
  const generatePlan = useGeneratePlan();

  const [maxMc, setMaxMc] = useState(24);
  const [minMc, setMinMc] = useState(18);
  const [pacing, setPacing] = useState<"easy" | "medium" | "hard">("easy");

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const handleUpdateConstraints = async () => {
    if (!plan) return;

    await updatePlan.mutateAsync({
      id: plan.id,
      data: {
        maxMcPerSemester: maxMc,
        minMcPerSemester: minMc,
        pacingPreference: pacing,
      },
    });
  };

  const handleStartEditName = () => {
    if (plan) {
      setEditedName(plan.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = async () => {
    if (!plan || !editedName.trim()) return;

    await updatePlan.mutateAsync({
      id: plan.id,
      data: { name: editedName.trim() },
    });
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  const handleRegenerate = async () => {
    if (!plan) return;

    await generatePlan.mutateAsync({
      programme: plan.programme,
      degreeStructure: plan.degreeStructure || {
        primaryMajor: plan.programme,
        minors: [],
        specialisations: [],
      },
      completedModules: plan.completedModules,
      currentYear: plan.currentYear,
      currentSemester: plan.currentSemester,
      maxMcPerSemester: maxMc,
      minMcPerSemester: minMc,
      pacingPreference: pacing,
      pinnedModules: plan.pinnedModules,
    });
  };

  const planContentRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!plan) return;
    await exportPlanToPDF(
      {
        name: plan.name,
        programme: plan.programme,
        semesterPlan: plan.semesterPlan,
        minMcPerSemester: plan.minMcPerSemester,
        maxMcPerSemester: plan.maxMcPerSemester,
      },
      `${plan.name}.pdf`
    );
  };

  const sensors = useDragDropSensors();

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!plan) return;

    await handleModuleDragEnd({
      event,
      semesterPlan: plan.semesterPlan,
      onUpdate: async (newSemesterPlan) => {
        await updatePlan.mutateAsync({
          id: plan.id,
          data: { semesterPlan: newSemesterPlan },
        });
      },
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!plan) {
    return (
      <ProtectedRoute>
        <div className="min-h-[calc(100vh-64px)] bg-background py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">No Active Plan</h1>
            <p className="text-muted-foreground mb-6">
              You don&apos;t have an active degree plan yet. Create one to get
              started!
            </p>
            <Button onClick={() => router.push("/onboarding")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100vh-64px)] bg-background py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-2xl md:text-4xl font-bold h-auto py-2 max-w-2xl"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleSaveName}
                      disabled={!editedName.trim()}
                    >
                      <Check className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl md:text-4xl font-bold truncate">
                      {plan.name}
                    </h1>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleStartEditName}
                      className="shrink-0"
                    >
                      <Edit2 className="h-5 w-5" />
                    </Button>
                  </div>
                )}
                <p className="text-base md:text-lg text-muted-foreground">
                  {plan.programme}
                </p>
                {plan.degreeStructure && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">
                      {plan.degreeStructure.primaryMajor}
                    </Badge>
                    {plan.degreeStructure.minors.map((minor) => (
                      <Badge key={minor} variant="outline">
                        Minor: {minor}
                      </Badge>
                    ))}
                    {plan.degreeStructure.specialisations.map((spec) => (
                      <Badge key={spec} variant="outline">
                        Spec: {spec}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleExportPDF}
                className="shrink-0 w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Controls */}
            <div className="lg:col-span-1 space-y-4">
              <PlanSettings
                maxMc={maxMc}
                minMc={minMc}
                pacing={pacing}
                onMaxMcChange={setMaxMc}
                onMinMcChange={setMinMc}
                onPacingChange={setPacing}
                onUpdateSettings={handleUpdateConstraints}
                onRegenerate={handleRegenerate}
                isUpdating={updatePlan.isPending}
                isRegenerating={generatePlan.isPending}
              />

              {/* Warnings */}
              {plan.warnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-semibold">Warnings</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {plan.warnings.map((warning, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2 rounded bg-destructive/10 text-destructive"
                        >
                          {warning.message}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content - Timeline */}
            <div className="lg:col-span-3">
              <SemesterTimeline
                ref={planContentRef}
                semesterPlan={plan.semesterPlan}
                pinnedModules={plan.pinnedModules}
                sensors={sensors}
                onDragEnd={handleDragEnd}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
