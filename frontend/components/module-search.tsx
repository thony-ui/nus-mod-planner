"use client";

import { useState } from "react";
import { useModuleSearch } from "@/hooks/use-modules";
import { Module, ModuleSearchParams } from "@/types/module";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModuleDetailsDialog } from "@/components/module-details-dialog";

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

  const { data, isLoading, error } = useModuleSearch(searchParams);

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
          placeholder="Search for modules..."
          value={searchParams.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap items-center">
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

/**
 * Individual Module Card Component
 * Follows Single Responsibility Principle
 */
function ModuleCard({
  module,
  onSelect,
}: {
  module: Module;
  onSelect?: (module: Module) => void;
}) {
  return (
    <Card
      onClick={() => onSelect?.(module)}
      className={
        onSelect ? "cursor-pointer hover:bg-accent transition-colors" : ""
      }
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{module.code}</CardTitle>
            <CardDescription>{module.title}</CardDescription>
          </div>
          <Badge variant="secondary">
            {module.mcs} MC{module.mcs !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      {(module.description ||
        module.faculty ||
        module.semestersOffered?.length > 0) && (
        <CardContent>
          {module.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {module.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            {module.faculty && (
              <Badge variant="outline">{module.faculty}</Badge>
            )}
            {module.semestersOffered && module.semestersOffered.length > 0 && (
              <Badge
                variant="outline"
                className="bg-green-50 dark:bg-green-950"
              >
                Sem {module.semestersOffered.join(", ")}
              </Badge>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
