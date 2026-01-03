"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Check, X } from "lucide-react";
import { Plan } from "@/types/plan";

interface PlannerHeaderProps {
  plan: Plan;
  onUpdateName: (name: string) => Promise<void>;
  totalMC: number;
}

export function PlannerHeader({
  plan,
  onUpdateName,
  totalMC,
}: PlannerHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const handleStartEditName = () => {
    setEditedName(plan.name);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    await onUpdateName(editedName);
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2 mb-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-4xl font-bold h-auto py-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={handleSaveName}>
                <Check className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleCancelEdit}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-bold">{plan.name}</h1>
              <Button size="icon" variant="ghost" onClick={handleStartEditName}>
                <Edit2 className="h-5 w-5" />
              </Button>
            </div>
          )}
          <p className="text-lg text-muted-foreground">{plan.programme}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Total MCs: <span className="font-semibold">{totalMC}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
