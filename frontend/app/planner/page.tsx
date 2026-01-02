"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  useActivePlan,
  usePlan,
  useUpdatePlan,
  useGeneratePlan,
} from "@/hooks/use-plans";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { ProtectedRoute } from "@/components/protected-route";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Settings2, Zap, Edit2, Check, X } from "lucide-react";

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
  const [minMc, setMinMc] = useState(12);
  const [pacing, setPacing] = useState<
    "safe" | "balanced" | "fast" | "easy" | "medium" | "hard"
  >("balanced");

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // Update state when plan changes
  useEffect(() => {
    if (plan) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMaxMc(plan.maxMcPerSemester || 24);
      setMinMc(plan.minMcPerSemester || 12);
      setPacing(plan.pacingPreference || "balanced");
    }
  }, [plan?.id]); // Only re-run when plan ID changes

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

  const semesters = Object.keys(plan.semesterPlan).sort();

  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100vh-64px)] bg-background py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-4xl font-bold h-auto py-2 max-w-2xl"
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
                    <h1 className="text-4xl font-bold">{plan.name}</h1>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleStartEditName}
                    >
                      <Edit2 className="h-5 w-5" />
                    </Button>
                  </div>
                )}
                <p className="text-lg text-muted-foreground">
                  {plan.programme}
                </p>
                {plan.degreeStructure && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline">
                      {plan.degreeStructure.primaryMajor}
                    </Badge>
                    {plan.degreeStructure.secondMajor && (
                      <Badge variant="outline">
                        2nd Major: {plan.degreeStructure.secondMajor}
                      </Badge>
                    )}
                    {plan.degreeStructure.minors.map((minor) => (
                      <Badge key={minor} variant="outline">
                        Minor: {minor}
                      </Badge>
                    ))}
                    {plan.degreeStructure.specialisations.map((spec) => (
                      <Badge key={spec} variant="outline">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-2">
                  Current: Y{plan.currentYear}S{plan.currentSemester}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-sm">
                  {plan.status}
                </Badge>
                {plan.workloadScore && (
                  <Badge variant="secondary" className="text-sm">
                    Workload: {plan.workloadScore.toFixed(1)}/10
                  </Badge>
                )}
                {plan.riskScore && (
                  <Badge variant="secondary" className="text-sm">
                    Risk: {plan.riskScore.toFixed(1)}/10
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Controls */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Constraints
                  </CardTitle>
                  <CardDescription>
                    Adjust your plan preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* MC Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Max MCs per semester: {maxMc}
                    </label>
                    <Slider
                      value={[maxMc]}
                      onValueChange={(values) => setMaxMc(values[0])}
                      min={12}
                      max={32}
                      step={2}
                      className="mb-4"
                    />
                    <label className="text-sm font-medium mb-2 block">
                      Min MCs per semester: {minMc}
                    </label>
                    <Slider
                      value={[minMc]}
                      onValueChange={(values) => setMinMc(values[0])}
                      min={8}
                      max={20}
                      step={2}
                    />
                  </div>

                  {/* Pacing */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Difficulty Preference
                    </label>
                    <div className="flex flex-col gap-2">
                      {(["easy", "medium", "hard"] as const).map((p) => (
                        <Button
                          key={p}
                          variant={pacing === p ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPacing(p)}
                          className="justify-start"
                        >
                          {p === "easy" && "😌 Easy"}
                          {p === "medium" && "⚖️ Medium"}
                          {p === "hard" && "💪 Hard"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleUpdateConstraints}
                      disabled={updatePlan.isPending}
                      className="w-full"
                    >
                      {updatePlan.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Settings2 className="mr-2 h-4 w-4" />
                      )}
                      Update Settings
                    </Button>
                    <Button
                      onClick={handleRegenerate}
                      disabled={generatePlan.isPending}
                      variant="secondary"
                      className="w-full"
                    >
                      {generatePlan.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Regenerate Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Warnings */}
              {plan.warnings.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Warnings</CardTitle>
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
              <Card>
                <CardHeader>
                  <CardTitle>Semester Plan</CardTitle>
                  <CardDescription>
                    Your module timeline across semesters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      {semesters.map((semester) => {
                        const modules = plan.semesterPlan[semester] || [];
                        const pinnedModules =
                          plan.pinnedModules[semester] || [];

                        return (
                          <div key={semester} className="border rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-semibold">
                                {semester}
                              </h3>
                              <Badge variant="outline">
                                {modules.length} modules
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {modules.map((moduleCode) => {
                                const isPinned =
                                  pinnedModules.includes(moduleCode);
                                return (
                                  <div
                                    key={moduleCode}
                                    className={`p-3 rounded-md border ${
                                      isPinned
                                        ? "bg-primary/5 border-primary"
                                        : "bg-muted/50"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <span className="font-medium">
                                        {moduleCode}
                                      </span>
                                      {isPinned && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          Pinned
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
