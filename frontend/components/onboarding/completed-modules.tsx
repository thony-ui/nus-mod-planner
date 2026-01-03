import React from "react";
import { Button } from "../ui/button";
import { ModuleSearch } from "../module/module-search";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Module } from "@/types/module";
import { Badge } from "../ui/badge";

interface CompletedModulesProps {
  completedModules: Module[];
  showModuleSearch: boolean;
  setShowModuleSearch: (value: boolean) => void;
  handleModuleSelect: (module: Module) => void;
  handleRemoveModule: (moduleCode: string) => void;
}
function CompletedModules({
  completedModules,
  showModuleSearch,
  setShowModuleSearch,
  handleModuleSelect,
  handleRemoveModule,
}: CompletedModulesProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Step 4: Add Completed Modules</CardTitle>
        <CardDescription>
          Add modules you&apos;ve already completed or have credits for
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Completed Modules List */}
        {completedModules.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {completedModules.map((module) => (
              <Badge
                key={module.code}
                variant="secondary"
                className="px-3 py-2 text-sm"
              >
                <span className="font-medium">{module.code}</span>
                <span className="mx-1">({module.mcs} MCs)</span>
                <button
                  onClick={() => handleRemoveModule(module.code)}
                  className="ml-2 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add Module Button */}
        {!showModuleSearch && (
          <Button onClick={() => setShowModuleSearch(true)}>
            + Add Module
          </Button>
        )}

        {/* Module Search */}
        {showModuleSearch && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Search for modules</h3>
              <Button
                variant="ghost"
                onClick={() => setShowModuleSearch(false)}
              >
                Cancel
              </Button>
            </div>
            <ModuleSearch onModuleSelect={handleModuleSelect} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CompletedModules;
