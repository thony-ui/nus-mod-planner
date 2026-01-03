"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Settings2, Zap } from "lucide-react";

interface PlanSettingsProps {
  maxMc: number;
  minMc: number;
  pacing: "easy" | "medium" | "hard";
  onMaxMcChange: (value: number) => void;
  onMinMcChange: (value: number) => void;
  onPacingChange: (value: "easy" | "medium" | "hard") => void;
  onUpdateSettings: () => void;
  onRegenerate: () => void;
  isUpdating: boolean;
  isRegenerating: boolean;
}

export function PlanSettings({
  maxMc,
  minMc,
  pacing,
  onMaxMcChange,
  onMinMcChange,
  onPacingChange,
  onUpdateSettings,
  onRegenerate,
  isUpdating,
  isRegenerating,
}: PlanSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Plan Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* MC Range */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Max MCs per semester: {maxMc}
          </label>
          <Slider
            value={[maxMc]}
            onValueChange={(values) => onMaxMcChange(values[0])}
            min={12}
            max={32}
            step={2}
            className="mb-4"
          />
          <label className="text-sm font-medium mb-2 block">
            Min MCs per semester: {minMc}
          </label>
          <Slider
            value={[minMc]}
            onValueChange={(values) => onMinMcChange(values[0])}
            min={8}
            max={20}
            step={2}
          />
        </div>

        {/* Pacing */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Difficulty Preference
          </label>
          <div className="flex flex-col gap-2">
            {(["easy", "medium", "hard"] as const).map((p) => (
              <Button
                key={p}
                variant={pacing === p ? "default" : "outline"}
                size="sm"
                onClick={() => onPacingChange(p)}
                className="justify-start"
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={onUpdateSettings}
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings2 className="mr-2 h-4 w-4" />
            )}
            Update Settings
          </Button>
          <Button
            onClick={onRegenerate}
            disabled={isRegenerating}
            variant="secondary"
            className="w-full"
          >
            {isRegenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Regenerate Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
