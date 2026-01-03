"use client";

import { ProtectedRoute } from "@/components/layout/protected-route";
import { ModuleSearch } from "@/components/module/module-search";

/**
 * Modules Browse Page
 */
export default function ModulesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Browse Modules</h1>
            <p className="text-lg text-muted-foreground">
              Search and explore NUS modules
            </p>
          </div>

          <ModuleSearch />
        </div>
      </div>
    </ProtectedRoute>
  );
}
