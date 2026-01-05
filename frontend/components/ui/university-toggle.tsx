"use client";

import { University } from "@/types/module";
import { Button } from "@/components/ui/button";

interface UniversityToggleProps {
  university: University;
  onUniversityChange: (university: University) => void;
  className?: string;
}

export function UniversityToggle({
  university,
  onUniversityChange,
  className = "",
}: UniversityToggleProps) {
  return (
    <div className={`flex gap-2 items-center ${className}`}>
      <span className="text-sm font-medium text-muted-foreground">
        University:
      </span>
      <Button
        onClick={() => onUniversityChange("NUS")}
        variant={university === "NUS" ? "default" : "outline"}
        size="sm"
      >
        NUS
      </Button>
      <Button
        onClick={() => onUniversityChange("NTU")}
        variant={university === "NTU" ? "default" : "outline"}
        size="sm"
      >
        NTU
      </Button>
    </div>
  );
}
