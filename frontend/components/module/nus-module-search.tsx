"use client";

import { useState } from "react";
import { useModuleSearch } from "@/hooks/use-modules";
import { useSemanticSearch } from "@/hooks/use-semantic-search";
import { ModuleSearchParams, Module, AnyModule } from "@/types/module";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModuleDetailsDialog } from "./module-details-dialog";
import { ModuleCard } from "./module-card";
import { Badge } from "@/components/ui/badge";

interface NUSModuleSearchProps {
  onModuleSelect?: (module: Module) => void;
}

export function NUSModuleSearch({ onModuleSelect }: NUSModuleSearchProps) {
  const [searchParams, setSearchParams] = useState<ModuleSearchParams>({
    search: "",
    limit: 20,
    offset: 0,
  });
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [useSemanticMode, setUseSemanticMode] = useState(true);

  // NUS-specific hooks (only one enabled at a time)
  const traditionalSearch = useModuleSearch(searchParams, !useSemanticMode);
  const semanticSearch = useSemanticSearch(
    searchParams.search || "",
    searchParams.limit,
    useSemanticMode
  );

  const { data, isLoading, error } = useSemanticMode
    ? semanticSearch
    : traditionalSearch;

  const handleModuleClick = (module: AnyModule) => {
    setSelectedModule(module as Module);
    setDialogOpen(true);
    onModuleSelect?.(module as Module);
  };

  const handleSearchChange = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      search: value,
      offset: 0,
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
              ? "Search NUS modules with AI (e.g., 'machine learning with practical applications')..."
              : "Search for NUS modules..."
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
            variant={useSemanticMode ? "default" : "outline"}
            size="sm"
          >
            🤖 Semantic AI
          </Button>
          <Button
            onClick={() => setUseSemanticMode(false)}
            variant={!useSemanticMode ? "default" : "outline"}
            size="sm"
          >
            🔍 Traditional
          </Button>
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
      {useSemanticMode && (
        <Badge variant="secondary" className="text-xs mb-6">
          Powered by RAG
        </Badge>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          {useSemanticMode ? (
            <div className="space-y-2">
              <div>🤖 AI is analyzing your query...</div>
              <div className="text-xs">This may take a few seconds</div>
            </div>
          ) : (
            "Loading modules..."
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-8 text-destructive">
          Error loading modules. Please try again.
        </div>
      )}

      {/* Empty search prompt for semantic mode */}
      {useSemanticMode &&
        !isLoading &&
        !error &&
        (!searchParams.search || searchParams.search.trim().length < 3) && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-4">🔍</div>
            <p>Type at least 3 characters to start AI-powered search</p>
            <p className="text-sm mt-2">
              Try: &quot;machine learning&quot;, &quot;data structures&quot;,
              &quot;web development&quot;
            </p>
          </div>
        )}

      {/* Results */}
      {data && (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            Found {data.total} modules
          </div>

          <div className="space-y-3">
            {data.modules.map((module) => (
              <ModuleCard
                key={module.code}
                module={module}
                onSelect={handleModuleClick}
                university="NUS"
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
        university="NUS"
      />
    </div>
  );
}
