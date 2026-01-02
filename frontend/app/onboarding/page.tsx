"use client";

import { useState } from "react";
import { ModuleSearch } from "@/components/module-search";
import { Module } from "@/types/module";
import { DegreeStructure } from "@/types/plan";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/protected-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGeneratePlan } from "@/hooks/use-plans";
import { useProgrammes } from "@/hooks/use-programmes";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";

/**
 * Onboarding Page
 * Allows users to select their programme and completed modules
 */
export default function OnboardingPage() {
  const [selectedProgramme, setSelectedProgramme] = useState<string>("");
  const [completedModules, setCompletedModules] = useState<Module[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(1);
  const [currentSemester, setCurrentSemester] = useState<number>(1);

  // Degree structure
  const [primaryMajor, setPrimaryMajor] = useState<string>("");
  const [secondMajor, setSecondMajor] = useState<string>("");
  const [minors, setMinors] = useState<string[]>([]);
  const [specialisations, setSpecialisations] = useState<string[]>([]);
  const [newMinor, setNewMinor] = useState<string>("");
  const [newSpecialisation, setNewSpecialisation] = useState<string>("");

  const generatePlan = useGeneratePlan();
  const { data: programmes, isLoading: programmesLoading } = useProgrammes();
  const router = useRouter();
  const [showModuleSearch, setShowModuleSearch] = useState(false);

  const handleModuleSelect = (module: Module) => {
    // Avoid duplicates
    if (!completedModules.find((m) => m.code === module.code)) {
      setCompletedModules([...completedModules, module]);
    }
    setShowModuleSearch(false);
  };

  const handleRemoveModule = (moduleCode: string) => {
    setCompletedModules(completedModules.filter((m) => m.code !== moduleCode));
  };

  const handleContinue = async () => {
    if (!selectedProgramme || !primaryMajor) return;

    const degreeStructure: DegreeStructure = {
      primaryMajor,
      secondMajor: secondMajor || undefined,
      minors,
      specialisations,
    };

    try {
      await generatePlan.mutateAsync({
        programme: selectedProgramme,
        degreeStructure,
        completedModules: completedModules.map((m) => m.code),
        currentYear,
        currentSemester,
        maxMcPerSemester: 24,
        minMcPerSemester: 12,
        pacingPreference: "medium",
      });

      // Navigate to planner after successful generation
      router.push("/planner");
    } catch (error) {
      console.error("Failed to generate plan:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Welcome to NUS Mod Planner
            </h1>
            <p className="text-lg text-muted-foreground">
              Let&apos;s set up your degree plan
            </p>
          </div>

          {/* Step 1: Programme Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 1: Select Your Programme</CardTitle>
              <CardDescription>
                Choose your primary degree programme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedProgramme}
                onValueChange={setSelectedProgramme}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose your programme..." />
                </SelectTrigger>
                <SelectContent>
                  {programmesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading programmes...
                    </SelectItem>
                  ) : programmes && programmes.length > 0 ? (
                    programmes.map((prog) => (
                      <SelectItem key={prog.code} value={prog.code}>
                        {prog.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-programmes" disabled>
                      No programmes available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Step 2: Current Year & Semester */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 2: Current Academic Period</CardTitle>
              <CardDescription>
                Indicate your current year and semester (e.g., Y2S1 = Year 2,
                Semester 1)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Year</label>
                  <Select
                    value={currentYear.toString()}
                    onValueChange={(val) => setCurrentYear(parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Year 1</SelectItem>
                      <SelectItem value="2">Year 2</SelectItem>
                      <SelectItem value="3">Year 3</SelectItem>
                      <SelectItem value="4">Year 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Semester
                  </label>
                  <Select
                    value={currentSemester.toString()}
                    onValueChange={(val) => setCurrentSemester(parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Degree Structure */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 3: Degree Structure</CardTitle>
              <CardDescription>
                Configure your major(s), minor(s), and specialisation(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Major */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Primary Major *
                </label>
                <Input
                  placeholder="e.g., Computer Science"
                  value={primaryMajor}
                  onChange={(e) => setPrimaryMajor(e.target.value)}
                />
              </div>

              {/* Second Major */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Second Major (Optional - for Double Major)
                </label>
                <Input
                  placeholder="e.g., Mathematics"
                  value={secondMajor}
                  onChange={(e) => setSecondMajor(e.target.value)}
                />
              </div>

              {/* Minors */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Minor(s) (Optional - up to 2)
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Enter minor"
                    value={newMinor}
                    onChange={(e) => setNewMinor(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newMinor && minors.length < 2) {
                        setMinors([...minors, newMinor]);
                        setNewMinor("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!newMinor || minors.length >= 2}
                    onClick={() => {
                      if (newMinor && minors.length < 2) {
                        setMinors([...minors, newMinor]);
                        setNewMinor("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {minors.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {minors.map((minor, idx) => (
                      <Badge key={idx} variant="outline">
                        {minor}
                        <button
                          onClick={() =>
                            setMinors(minors.filter((_, i) => i !== idx))
                          }
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Specialisations */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Specialisation(s) (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="e.g., Artificial Intelligence, Computer Security"
                    value={newSpecialisation}
                    onChange={(e) => setNewSpecialisation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSpecialisation) {
                        setSpecialisations([
                          ...specialisations,
                          newSpecialisation,
                        ]);
                        setNewSpecialisation("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!newSpecialisation}
                    onClick={() => {
                      if (newSpecialisation) {
                        setSpecialisations([
                          ...specialisations,
                          newSpecialisation,
                        ]);
                        setNewSpecialisation("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {specialisations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {specialisations.map((spec, idx) => (
                      <Badge key={idx} variant="outline">
                        {spec}
                        <button
                          onClick={() =>
                            setSpecialisations(
                              specialisations.filter((_, i) => i !== idx)
                            )
                          }
                          className="ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Completed Modules */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 4: Add Completed Modules</CardTitle>
              <CardDescription>
                Add modules you&apos;ve already completed or have credits for
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Completed Modules List */}
              {completedModules.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {completedModules.map((module) => (
                    <Badge
                      key={module.code}
                      variant="secondary"
                      className="px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{module.code}</span>
                      <span className="mx-1">({module.mcs} MCs)</span>
                      <button
                        onClick={() => handleRemoveModule(module.code)}
                        className="ml-2 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add Module Button */}
              {!showModuleSearch && (
                <Button onClick={() => setShowModuleSearch(true)}>
                  + Add Module
                </Button>
              )}

              {/* Module Search */}
              {showModuleSearch && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Search for modules</h3>
                    <Button
                      variant="ghost"
                      onClick={() => setShowModuleSearch(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <ModuleSearch onModuleSelect={handleModuleSelect} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={handleContinue}
              disabled={
                !selectedProgramme || !primaryMajor || generatePlan.isPending
              }
              size="lg"
            >
              {generatePlan.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                "Generate My Degree Plan"
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              We&apos;ll generate your plan from Y{currentYear}S
              {currentSemester} to graduation
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
