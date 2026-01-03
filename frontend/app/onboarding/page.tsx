"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGeneratePlan } from "@/hooks/use-plans";
import { useProgrammes } from "@/hooks/use-programmes";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import ProgrammeSelection from "@/components/onboarding/programme-selection";
import { DegreeStructure } from "@/types/plan";

/**
 * Onboarding Page
 * Allows users to set up their degree plan
 */
export default function OnboardingPage() {
  const [selectedProgramme, setSelectedProgramme] = useState<string>("");

  const generatePlan = useGeneratePlan();
  const { data: programmes, isLoading: programmesLoading } = useProgrammes();
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedProgramme) return;

    const degreeStructure: DegreeStructure = {
      primaryMajor: "",
      secondMajor: undefined,
      minors: [],
      specialisations: [],
    };

    // Create moduleMCs mapping from completed modules
    const moduleMCs: Record<string, number> = {};

    try {
      await generatePlan.mutateAsync({
        programme: selectedProgramme,
        degreeStructure,
        completedModules: [],
        moduleMCs, // Pass the MC mapping
        currentYear: 1,
        currentSemester: 1,
        maxMcPerSemester: 24,
        minMcPerSemester: 12,
        pacingPreference: "medium",
      });

      // Navigate to planner
      router.push("/planner");
    } catch (error) {
      console.error("Failed to generate plan:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-lg mx-auto">
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

          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedProgramme || generatePlan.isPending}
              size="lg"
              className="w-full"
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
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
