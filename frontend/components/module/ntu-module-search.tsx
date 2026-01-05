"use client";

import { useState } from "react";
import { useNTUModuleSearch } from "@/hooks/use-modules";
import { useNTUSemanticSearch } from "@/hooks/use-semantic-search";
import { AnyModule, NTUModule } from "@/types/module";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModuleDetailsDialog } from "./module-details-dialog";
import { ModuleCard } from "./module-card";
import { Badge } from "@/components/ui/badge";

interface NTUModuleSearchProps {
  onModuleSelect?: (module: NTUModule) => void;
}

export function NTUModuleSearch({ onModuleSelect }: NTUModuleSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [selectedModule, setSelectedModule] = useState<NTUModule | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [useSemanticMode, setUseSemanticMode] = useState(true);

  const limit = 20;

  // NTU-specific hooks (only one enabled at a time)
  const traditionalSearch = useNTUModuleSearch(
    {
      search: searchQuery,
      limit,
      offset,
    },
    !useSemanticMode
  );

  const semanticSearch = useNTUSemanticSearch(
    searchQuery,
    limit,
    useSemanticMode
  );

  // Normalize traditional search data to match semantic search format
  const traditionalData = traditionalSearch.data
    ? {
        modules: traditionalSearch.data.data,
        total: traditionalSearch.data.count,
        limit,
        offset,
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
    setSearchQuery(value);
    setOffset(0); // Reset to first page on new search
  };

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Search Bar */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder={
            useSemanticMode
              ? "Search NTU modules with AI (e.g., 'artificial intelligence and robotics')..."
              : "Search for NTU modules..."
          }
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Search Mode Toggle */}
      <div className="mb-6 flex gap-4 flex-wrap items-center">
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
        searchQuery.trim().length < 3 && (
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
            {data.modules.map((module) => (
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
