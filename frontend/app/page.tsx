"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { useCreatePlan } from "@/hooks/use-plans";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const createPlan = useCreatePlan();
  const router = useRouter();

  const handleGetStarted = async () => {
    try {
      await createPlan.mutateAsync({
        name: "My Study Plan",
        programme: "", // Empty programme - user can set later
        currentYear: 1,
        currentSemester: 1,
        maxMcPerSemester: 24,
        minMcPerSemester: 12,
        pacingPreference: "medium",
      });

      // Navigate to planner
      router.push("/planner");
    } catch (error) {
      console.error("Failed to create plan:", error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100vh-64px)] flex flex-col flex-1 items-center justify-center bg-background">
        {/* Main Content */}
        <div className="flex w-full max-w-3xl flex-col items-center justify-center px-16 py-32">
          <div className="flex flex-col items-center gap-6 text-center">
            <h1 className="max-w-md text-5xl font-bold leading-tight tracking-tight">
              Discover, understand, and plan your degree.
            </h1>
            <p className="max-w-md text-lg leading-8 text-muted-foreground">
              Ask questions in natural language and get grounded answers about
              modules and requirements.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button
              onClick={handleGetStarted}
              disabled={createPlan.isPending}
              size="lg"
            >
              {createPlan.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Plan...
                </>
              ) : (
                "Get Started"
              )}
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/modules">Browse Modules</Link>
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
