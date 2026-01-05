"use client";

import { useMemo, useState } from "react";
import { useNTUModuleSearch } from "@/hooks/use-modules";
import { useNTUSemanticSearch } from "@/hooks/use-semantic-search";
import { AnyModule, NTUModule, NTUModuleSearchParams } from "@/types/module";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModuleDetailsDialog } from "./module-details-dialog";
import { ModuleCard } from "./module-card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

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
  const [showFilters, setShowFilters] = useState(false);
  const [auRange, setAuRange] = useState<[number, number]>([0, 5]);

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

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchParams.dept ||
        searchParams.gradeType ||
        searchParams.minAus != null ||
        searchParams.maxAus != null
    );
  }, [
    searchParams.dept,
    searchParams.gradeType,
    searchParams.minAus,
    searchParams.maxAus,
  ]);

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

  const handleDeptFilter = (dept: string) => {
    setSearchParams((prev) => ({
      ...prev,
      dept: dept === "all" ? undefined : dept,
      offset: 0,
    }));
  };

  const handleGradeTypeFilter = (gradeType: string) => {
    setSearchParams((prev) => ({
      ...prev,
      gradeType: gradeType === "all" ? undefined : gradeType,
      offset: 0,
    }));
  };

  const handleAuRangeChange = (value: number[]) => {
    const next: [number, number] = [value[0], value[1]];
    setAuRange(next);

    setSearchParams((prev) => ({
      ...prev,
      minAus: next[0] === 0 ? undefined : next[0],
      maxAus: next[1] === 5 ? undefined : next[1],
      offset: 0,
    }));
  };

  const handleClearFilters = () => {
    setSearchParams((prev) => ({
      search: prev.search,
      limit: prev.limit,
      offset: 0,
    }));
    setAuRange([0, 5]);
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

      {/* Search Mode Toggle + Filters */}
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

          {/* Clear Filters */}
          {hasActiveFilters && !useSemanticMode && (
            <Button onClick={handleClearFilters} variant="ghost" size="sm">
              Clear Filters
            </Button>
          )}

          {/* Semantic badge */}
          {useSemanticMode && (
            <Badge variant="secondary" className="text-xs">
              Powered by RAG
            </Badge>
          )}
        </div>

        {/* Filters Section */}
        {!useSemanticMode && showFilters && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            {/* Department Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Department
              </label>
              <Select
                value={searchParams.dept || "all"}
                onValueChange={handleDeptFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="SCSE">
                    School of Computer Science and Engineering
                  </SelectItem>
                  <SelectItem value="EEE">
                    School of Electrical &amp; Electronic Engineering
                  </SelectItem>
                  <SelectItem value="MAE">
                    School of Mechanical &amp; Aerospace Engineering
                  </SelectItem>
                  <SelectItem value="CEE">
                    School of Civil &amp; Environmental Engineering
                  </SelectItem>
                  <SelectItem value="MSE">
                    School of Materials Science &amp; Engineering
                  </SelectItem>
                  <SelectItem value="SPMS">
                    School of Physical &amp; Mathematical Sciences
                  </SelectItem>
                  <SelectItem value="SBS">
                    School of Biological Sciences
                  </SelectItem>
                  <SelectItem value="ASE">
                    Asian School of the Environment
                  </SelectItem>
                  <SelectItem value="SSS">School of Social Sciences</SelectItem>
                  <SelectItem value="WKWSCI">
                    Wee Kim Wee School of Communication and Information
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grade Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Grading Type
              </label>
              <Select
                value={searchParams.gradeType || "all"}
                onValueChange={handleGradeTypeFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Graded">Graded</SelectItem>
                  <SelectItem value="Pass/Fail">Pass/Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* AUs Range Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Academic Units (AUs): {auRange[0]} -{" "}
                {auRange[1] === 5 ? "5+" : auRange[1]}
              </label>
              <Slider
                value={auRange}
                onValueChange={handleAuRangeChange}
                min={0}
                max={5}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}
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
