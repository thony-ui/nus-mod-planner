"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useActivePlan, usePlan, useUpdatePlan } from "@/hooks/use-plans";
import { useModuleSearch } from "@/hooks/use-modules";
import { useSemanticSearch } from "@/hooks/use-semantic-search";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { useDragDropSensors, handleModuleDragEnd } from "@/hooks/use-drag-drop";
import { PlannerHeader } from "@/components/planner/planner-header";
import { SemesterCard } from "@/components/planner/semester-card";
import { AddModuleDialog } from "@/components/planner/add-module-dialog";
import { AddSemesterDialog } from "@/components/planner/add-semester-dialog";
import { DeleteConfirmationDialog } from "@/components/planner/delete-confirmation-dialog";
import {
  calculateSemesterMC,
  calculateTotalMC,
} from "@/components/planner/planner-utils";
import { SortableModuleCard } from "@/components/planner/sortable-module-card";

// TODO: Need to refractor calling database for module MCs prolly need to store it in plan or something
export default function PlannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("planId");

  const { data: activePlan, isLoading: activeLoading } = useActivePlan();
  const { data: specificPlan, isLoading: specificLoading } = usePlan(
    planId || ""
  );

  const plan = planId ? specificPlan : activePlan;
  const isLoading = planId ? specificLoading : activeLoading;

  const updatePlan = useUpdatePlan();

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [useSemanticMode, setUseSemanticMode] = useState(true);
  const [moduleToDelete, setModuleToDelete] = useState<{
    semester: string;
    moduleCode: string;
  } | null>(null);
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [semesterToDelete, setSemesterToDelete] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useDragDropSensors();

  // Search results
  const { data: semanticResults, isLoading: semanticLoading } =
    useSemanticSearch(searchQuery);
  const { data: traditionalResults, isLoading: traditionalLoading } =
    useModuleSearch({
      search: searchQuery,
      limit: 20,
      offset: 0,
    });

  const searchResults = useSemanticMode ? semanticResults : traditionalResults;
  const searchLoading = useSemanticMode ? semanticLoading : traditionalLoading;

  // Get all modules for MC calculations - need to fetch in batches due to backend limit
  const { data: batch1 } = useModuleSearch({
    search: "",
    limit: 1000,
    offset: 0,
  });
  const { data: batch2 } = useModuleSearch({
    search: "",
    limit: 1000,
    offset: 1000,
  });
  const { data: batch3 } = useModuleSearch({
    search: "",
    limit: 1000,
    offset: 2000,
  });
  const { data: batch4 } = useModuleSearch({
    search: "",
    limit: 1000,
    offset: 3000,
  });
  const { data: batch5 } = useModuleSearch({
    search: "",
    limit: 1000,
    offset: 4000,
  });
  const { data: batch6 } = useModuleSearch({
    search: "",
    limit: 1000,
    offset: 5000,
  });
  const { data: batch7 } = useModuleSearch({
    search: "",
    limit: 1000,
    offset: 6000,
  });
  const { data: batch8 } = useModuleSearch({
    search: "",
    limit: 1000,
    offset: 7000,
  });

  // Combine all batches
  const allModules = [
    ...(batch1?.modules || []),
    ...(batch2?.modules || []),
    ...(batch3?.modules || []),
    ...(batch4?.modules || []),
    ...(batch5?.modules || []),
    ...(batch6?.modules || []),
    ...(batch7?.modules || []),
    ...(batch8?.modules || []),
  ];

  // Handlers
  const handleUpdateName = async (name: string) => {
    if (!plan || !name.trim()) return;
    await updatePlan.mutateAsync({
      id: plan.id,
      data: { name: name.trim() },
    });
  };

  const handleAddModule = async (moduleCode: string) => {
    if (!plan || !selectedSemester) return;

    const currentModules = plan.semesterPlan[selectedSemester] || [];

    if (currentModules.includes(moduleCode)) {
      alert("Module already added to this semester!");
      return;
    }

    const newSemesterPlan = {
      ...plan.semesterPlan,
      [selectedSemester]: [...currentModules, moduleCode],
    };

    await updatePlan.mutateAsync({
      id: plan.id,
      data: { semesterPlan: newSemesterPlan },
    });

    setSearchQuery("");
    setSelectedSemester(null);
  };

  const handleRemoveModule = async () => {
    if (!plan || !moduleToDelete) return;

    const { semester, moduleCode } = moduleToDelete;
    const currentModules = plan.semesterPlan[semester] || [];
    const newModules = currentModules.filter(
      (code: string) => code !== moduleCode
    );

    const newSemesterPlan = {
      ...plan.semesterPlan,
      [semester]: newModules,
    };

    await updatePlan.mutateAsync({
      id: plan.id,
      data: { semesterPlan: newSemesterPlan },
    });

    setModuleToDelete(null);
  };

  const handleAddSemester = async (year: string, semester: string) => {
    if (!plan) return;

    const semesterKey = `Y${year}S${semester}`;

    if (plan.semesterPlan[semesterKey]) {
      alert("This semester already exists!");
      return;
    }

    const newSemesterPlan = {
      ...plan.semesterPlan,
      [semesterKey]: [],
    };

    await updatePlan.mutateAsync({
      id: plan.id,
      data: { semesterPlan: newSemesterPlan },
    });

    setShowAddSemester(false);
  };

  const handleDeleteSemester = async () => {
    if (!plan || !semesterToDelete) return;

    const newSemesterPlan = { ...plan.semesterPlan };
    delete newSemesterPlan[semesterToDelete];

    await updatePlan.mutateAsync({
      id: plan.id,
      data: { semesterPlan: newSemesterPlan },
    });

    setSemesterToDelete(null);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);

    if (!plan) return;

    await handleModuleDragEnd({
      event,
      semesterPlan: plan.semesterPlan,
      onUpdate: async (newSemesterPlan: Record<string, string[]>) => {
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
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setActiveId(active.id.toString())}
        onDragEnd={onDragEnd}
      >
        <div className="min-h-[calc(100vh-64px)] bg-background py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <PlannerHeader
              plan={plan}
              onUpdateName={handleUpdateName}
              calculateTotalMC={() => calculateTotalMC(plan, allModules)}
            />

            <div className="mb-4">
              <Button
                onClick={() => setShowAddSemester(true)}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Semester
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(plan.semesterPlan)
                .sort()
                .map((semester) => {
                  const modules = plan.semesterPlan[semester] || [];
                  const semesterMC = calculateSemesterMC(modules, allModules);

                  return (
                    <SemesterCard
                      key={semester}
                      semester={semester}
                      modules={modules}
                      semesterMC={semesterMC}
                      activeId={activeId}
                      onAddModule={() => {
                        setSelectedSemester(semester);
                        setSearchQuery("");
                      }}
                      onDeleteModule={(moduleCode: string) =>
                        setModuleToDelete({ semester, moduleCode })
                      }
                      onDeleteSemester={() => setSemesterToDelete(semester)}
                    />
                  );
                })}
            </div>

            <AddModuleDialog
              open={!!selectedSemester}
              semester={selectedSemester}
              onClose={() => {
                setSelectedSemester(null);
                setSearchQuery("");
              }}
              onAddModule={handleAddModule}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              useSemanticMode={useSemanticMode}
              setUseSemanticMode={setUseSemanticMode}
              searchResults={searchResults}
              searchLoading={searchLoading}
            />

            <AddSemesterDialog
              open={showAddSemester}
              onClose={() => setShowAddSemester(false)}
              onAdd={handleAddSemester}
            />

            <DeleteConfirmationDialog
              open={!!semesterToDelete}
              title="Delete Semester"
              message={`Are you sure you want to delete ${semesterToDelete}? This will remove all modules in this semester.`}
              onClose={() => setSemesterToDelete(null)}
              onConfirm={handleDeleteSemester}
            />

            <DeleteConfirmationDialog
              open={!!moduleToDelete}
              title="Confirm Deletion"
              message={`Are you sure you want to remove ${moduleToDelete?.moduleCode} from ${moduleToDelete?.semester}?`}
              onClose={() => setModuleToDelete(null)}
              onConfirm={handleRemoveModule}
            />
          </div>
        </div>
        <DragOverlay>
          {activeId ? (
            <SortableModuleCard
              moduleCode={activeId.split("-").slice(1).join("-")}
              isPinned={false}
              semester=""
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </ProtectedRoute>
  );
}
