"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ModuleSearch } from "@/components/module/module-search";
import { UniversityToggle } from "@/components/ui/university-toggle";
import { University } from "@/types/module";

/**
 * Modules Browse Page
 */
export default function ModulesPage() {
  const [university, setUniversity] = useState<University>("NUS");

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Browse Modules</h1>
            <p className="text-lg text-muted-foreground mb-4">
              Search and explore {university} modules
            </p>
            <div className="flex justify-center">
              <UniversityToggle
                university={university}
                onUniversityChange={setUniversity}
              />
            </div>
          </div>

          <ModuleSearch university={university} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
