"use client";

import { useState } from "react";
import { Module } from "@/types/module";
import { Button } from "@/components/ui/button";
import { useGeneratePlan } from "@/hooks/use-plans";
import { useProgrammes } from "@/hooks/use-programmes";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import ProgrammeSelection from "@/components/onboarding/programme-selection";
import YearAndSemester from "@/components/onboarding/year-and-semester";
import Degree from "@/components/onboarding/degree";
import { DegreeStructure } from "@/types/plan";
import CompletedModules from "@/components/onboarding/completed-modules";

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
          <ProgrammeSelection
            programmes={programmes || []}
            programmesLoading={programmesLoading}
            selectedProgramme={selectedProgramme}
            setSelectedProgramme={setSelectedProgramme}
          />

          {/* Step 2: Current Year & Semester */}
          <YearAndSemester
            currentYear={currentYear}
            setCurrentYear={setCurrentYear}
            currentSemester={currentSemester}
            setCurrentSemester={setCurrentSemester}
          />

          {/* Step 3: Degree Structure */}
          <Degree
            primaryMajor={primaryMajor}
            setPrimaryMajor={setPrimaryMajor}
            secondMajor={secondMajor}
            setSecondMajor={setSecondMajor}
            minors={minors}
            setMinors={setMinors}
            newMinor={newMinor}
            setNewMinor={setNewMinor}
            specialisations={specialisations}
            setSpecialisations={setSpecialisations}
            newSpecialisation={newSpecialisation}
            setNewSpecialisation={setNewSpecialisation}
          />

          {/* Step 4: Completed Modules */}
          <CompletedModules
            completedModules={completedModules}
            showModuleSearch={showModuleSearch}
            setShowModuleSearch={setShowModuleSearch}
            handleModuleSelect={handleModuleSelect}
            handleRemoveModule={handleRemoveModule}
          />

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
