"use client";

import { useState } from "react";
import { useModuleSearch } from "@/hooks/use-modules";
import { useSemanticSearch } from "@/hooks/use-semantic-search";
import { Module, ModuleSearchParams } from "@/types/module";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModuleDetailsDialog } from "./module-details-dialog";
import { ModuleCard } from "./module-card";
import { Badge } from "@/components/ui/badge";

/**
 * Module Search Component
 * Follows Single Responsibility Principle - handles module search UI only
 */
export function ModuleSearch({
  onModuleSelect,
}: {
  onModuleSelect?: (module: Module) => void;
}) {
  const [searchParams, setSearchParams] = useState<ModuleSearchParams>({
    search: "",
    limit: 20,
    offset: 0,
  });
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [useSemanticMode, setUseSemanticMode] = useState(true);

  // Use semantic search or traditional search based on mode
  const traditionalSearch = useModuleSearch(searchParams);
  const semanticSearchResult = useSemanticSearch(
    searchParams.search || "",
    searchParams.limit
  );

  // Select the appropriate data source
  const { data, isLoading, error } = useSemanticMode
    ? semanticSearchResult
    : traditionalSearch;

  const handleModuleClick = (module: Module) => {
    setSelectedModule(module);
    setDialogOpen(true);
    onModuleSelect?.(module);
  };

  const handleSearchChange = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      search: value,
      offset: 0, // Reset to first page on new search
    }));
  };

  const handleSemesterFilter = (semester: string) => {
    setSearchParams((prev) => ({
      ...prev,
      semester: prev.semester === semester ? undefined : semester,
      offset: 0,
    }));
  };

  const handleLoadMore = () => {
    setSearchParams((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 20),
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Search Bar */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder={
            useSemanticMode
              ? "Search modules with AI (e.g., 'machine learning with practical applications')..."
              : "Search for modules..."
          }
          value={searchParams.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Search Mode Toggle and Filters */}
      <div className="mb-6 flex gap-4 flex-wrap items-center">
        {/* Search Mode Toggle */}
        <div className="flex gap-2 items-center">
          <Button
            onClick={() => setUseSemanticMode(true)}
            variant={"default"}
            size="sm"
          >
            {"🤖 Semantic AI"}
          </Button>
          <Button
            onClick={() => setUseSemanticMode(false)}
            variant={"outline"}
            size="sm"
          >
            {"🔍 Traditional"}
          </Button>
          {useSemanticMode && (
            <Badge variant="secondary" className="text-xs">
              Powered by RAG
            </Badge>
          )}
        </div>

        {/* Semester Filter (only for traditional search) */}
        {!useSemanticMode && (
          <>
            <span className="text-sm text-muted-foreground">Semester:</span>
            {["1", "2"].map((sem) => (
              <Button
                key={sem}
                onClick={() => handleSemesterFilter(sem)}
                variant={searchParams.semester === sem ? "default" : "outline"}
                size="sm"
              >
                Sem {sem}
              </Button>
            ))}
          </>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          Loading modules...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-destructive">
          Error loading modules. Please try again.
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Found {data.total} modules
          </div>

          {/* Module List */}
          <div className="space-y-3">
            {data.modules.map((module) => (
              <ModuleCard
                key={module.code}
                module={module}
                onSelect={handleModuleClick}
              />
            ))}
          </div>

          {/* Load More */}
          {data.modules.length < data.total && (
            <div className="mt-6 text-center">
              <Button onClick={handleLoadMore}>Load More</Button>
            </div>
          )}
        </>
      )}

      {/* Module Details Dialog */}
      <ModuleDetailsDialog
        module={selectedModule}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
