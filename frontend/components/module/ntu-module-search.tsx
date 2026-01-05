"use client";

import { useState } from "react";
import { useNTUModuleSearch } from "@/hooks/use-modules";
import { useNTUSemanticSearch } from "@/hooks/use-semantic-search";
import { AnyModule, NTUModule, NTUModuleSearchParams } from "@/types/module";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModuleDetailsDialog } from "./module-details-dialog";
import { ModuleCard } from "./module-card";
import { Badge } from "@/components/ui/badge";

interface NTUModuleSearchProps {
  onModuleSelect?: (module: NTUModule) => void;
}

export function NTUModuleSearch({ onModuleSelect }: NTUModuleSearchProps) {
  const [searchParams, setSearchParams] = useState<NTUModuleSearchParams>({
    search: "",
    limit: 20,
    offset: 0,
  });

  const [selectedModule, setSelectedModule] = useState<NTUModule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [useSemanticMode, setUseSemanticMode] = useState(true);

  const limit = 20;

  // NTU-specific hooks (only one enabled at a time)
  const traditionalSearch = useNTUModuleSearch(searchParams, !useSemanticMode);

  const semanticSearch = useNTUSemanticSearch(
    searchParams.search || "",
    limit,
    useSemanticMode
  );

  // Normalize traditional search data to match semantic search format
  const traditionalData = traditionalSearch.data
    ? {
        modules: traditionalSearch.data.data,
        total: traditionalSearch.data.count,
        limit,
        offset: searchParams.offset ?? 0,
      }
    : undefined;

  const { data, isLoading, error } = useSemanticMode
    ? semanticSearch
    : {
        data: traditionalData,
        isLoading: traditionalSearch.isLoading,
        error: traditionalSearch.error,
      };

  const handleModuleClick = (module: AnyModule) => {
    setSelectedModule(module as NTUModule);
    setDialogOpen(true);
    onModuleSelect?.(module as NTUModule);
  };

  const handleSearchChange = (value: string) => {
    setSearchParams((prev) => ({
      ...prev,
      search: value,
      offset: 0,
    }));
  };

  const handleLoadMore = () => {
    setSearchParams((prev) => ({
      ...prev,
      offset: (prev.offset ?? 0) + limit,
    }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Search Bar */}
      <div>
        <Input
          type="text"
          placeholder={
            useSemanticMode
              ? "Search NTU modules with AI (e.g., 'artificial intelligence and robotics')..."
              : "Search for NTU modules..."
          }
          value={searchParams.search ?? ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Search Mode Toggle */}
      <div className="space-y-4">
        <div className="flex gap-4 flex-wrap items-center">
          {/* Mode Toggle */}
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

          {/* Semantic badge */}
          {useSemanticMode && (
            <Badge variant="secondary" className="text-xs">
              Powered by RAG
            </Badge>
          )}
        </div>
      </div>

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
        (searchParams.search ?? "").trim().length < 3 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-4">🔍</div>
            <p>Type at least 3 characters to start AI-powered search</p>
            <p className="text-sm mt-2">
              Try: &quot;data science&quot;, &quot;computer networks&quot;,
              &quot;software engineering&quot;
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
            {data.modules.map((module: AnyModule) => (
              <ModuleCard
                key={module.code}
                module={module}
                onSelect={handleModuleClick}
                university="NTU"
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
        university="NTU"
      />
    </div>
  );
}
