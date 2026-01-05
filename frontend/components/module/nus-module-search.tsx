"use client";

import { useMemo, useState } from "react";
import { useModuleSearch } from "@/hooks/use-modules";
import { useSemanticSearch } from "@/hooks/use-semantic-search";
import { ModuleSearchParams, Module, AnyModule } from "@/types/module";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ModuleDetailsDialog } from "./module-details-dialog";
import { ModuleCard } from "./module-card";
import { Input } from "@/components/ui/input";

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
  const [showFilters, setShowFilters] = useState(false);

  const [mcRange, setMcRange] = useState<[number, number]>([0, 8]);

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

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchParams.semester ||
        searchParams.faculty ||
        searchParams.minMcs != null ||
        searchParams.maxMcs != null
    );
  }, [
    searchParams.semester,
    searchParams.faculty,
    searchParams.minMcs,
    searchParams.maxMcs,
  ]);

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

  const handleLoadMore = () => {
    setSearchParams((prev) => ({
      ...prev,
      offset: (prev.offset ?? 0) + (prev.limit ?? 20),
    }));
  };

  const handleSemesterFilter = (semester: string) => {
    setSearchParams((prev) => ({
      ...prev,
      semester: prev.semester === semester ? undefined : semester,
      offset: 0,
    }));
  };

  const handleFacultyFilter = (faculty: string) => {
    setSearchParams((prev) => ({
      ...prev,
      faculty: faculty === "all" ? undefined : faculty,
      offset: 0,
    }));
  };

  const handleMcRangeChange = (value: number[]) => {
    const next: [number, number] = [value[0], value[1]];
    setMcRange(next);

    setSearchParams((prev) => ({
      ...prev,
      minMcs: next[0] === 0 ? undefined : next[0],
      maxMcs: next[1] === 8 ? undefined : next[1],
      offset: 0,
    }));
  };

  const handleClearFilters = () => {
    setSearchParams((prev) => ({
      search: prev.search,
      limit: prev.limit,
      offset: 0,
    }));
    setMcRange([0, 8]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Search input */}
      <Input
        value={searchParams.search ?? ""}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search NUS modules..."
      />

      <div className="flex gap-4 flex-wrap items-center">
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

        {/* Filter Toggle (traditional only) */}
        {!useSemanticMode && (
          <Button
            onClick={() => setShowFilters((v) => !v)}
            variant="outline"
            size="sm"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
        )}

        {hasActiveFilters && !useSemanticMode && (
          <Button onClick={handleClearFilters} variant="ghost" size="sm">
            Clear Filters
          </Button>
        )}

        {useSemanticMode && (
          <Badge variant="secondary" className="text-xs">
            Powered by RAG
          </Badge>
        )}
      </div>

      {/* Filters Section */}
      {!useSemanticMode && showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
          {/* Semester Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Semester</label>
            <div className="flex gap-2">
              {["1", "2"].map((sem) => (
                <Button
                  key={sem}
                  onClick={() => handleSemesterFilter(sem)}
                  variant={
                    searchParams.semester === sem ? "default" : "outline"
                  }
                  size="sm"
                >
                  Sem {sem}
                </Button>
              ))}
            </div>
          </div>

          {/* Faculty Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Faculty</label>
            <Select
              value={searchParams.faculty || "all"}
              onValueChange={handleFacultyFilter}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Faculties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Faculties</SelectItem>
                <SelectItem value="Computing">Computing</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Arts and Social Science">
                  Arts and Social Science
                </SelectItem>
                <SelectItem value="College of Design and Engineering">
                  College of Design and Engineering
                </SelectItem>
                <SelectItem value="Law">Law</SelectItem>
                <SelectItem value="Medicine">Medicine</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* MCs Range Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Module Credits (MCs): {mcRange[0]} -{" "}
              {mcRange[1] === 8 ? "8+" : mcRange[1]}
            </label>
            <Slider
              value={mcRange}
              onValueChange={handleMcRangeChange}
              min={0}
              max={8}
              step={1}
              className="w-full"
            />
          </div>
        </div>
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
            {data.modules.map((module: AnyModule) => (
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
