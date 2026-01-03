"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { Module } from "@/types/module";

interface AddModuleDialogProps {
  open: boolean;
  semester: string | null;
  onClose: () => void;
  onAddModule: (moduleCode: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  useSemanticMode: boolean;
  setUseSemanticMode: (mode: boolean) => void;
  searchResults: { modules: Module[] } | undefined;
  searchLoading: boolean;
}

export function AddModuleDialog({
  open,
  semester,
  onClose,
  onAddModule,
  searchQuery,
  setSearchQuery,
  useSemanticMode,
  setUseSemanticMode,
  searchResults,
  searchLoading,
}: AddModuleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Module to {semester}</DialogTitle>

          {/* Search Mode Toggle */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant={useSemanticMode ? "default" : "outline"}
              onClick={() => setUseSemanticMode(true)}
              className="flex-1"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Search
            </Button>
            <Button
              size="sm"
              variant={!useSemanticMode ? "default" : "outline"}
              onClick={() => setUseSemanticMode(false)}
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Traditional
            </Button>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                useSemanticMode
                  ? "AI search (e.g., 'machine learning with practical applications')..."
                  : "Search by code or title..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-4 -mx-6 px-6">
          {searchLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {searchResults && searchResults.modules.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No modules found
            </p>
          )}
          <div className="space-y-2 pb-4">
            {searchResults?.modules.map((module: Module) => (
              <div
                key={module.code}
                className="p-3 border rounded hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onAddModule(module.code)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{module.code}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {module.title}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {module.mcs} MCs
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
