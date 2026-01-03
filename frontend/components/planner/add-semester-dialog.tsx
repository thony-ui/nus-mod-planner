"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddSemesterDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (year: string, semester: string) => Promise<void>;
}

export function AddSemesterDialog({
  open,
  onClose,
  onAdd,
}: AddSemesterDialogProps) {
  const [newSemesterYear, setNewSemesterYear] = useState("1");
  const [newSemesterNum, setNewSemesterNum] = useState("1");

  const handleAdd = async () => {
    await onAdd(newSemesterYear, newSemesterNum);
    setNewSemesterYear("1");
    setNewSemesterNum("1");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Semester</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <Select value={newSemesterYear} onValueChange={setNewSemesterYear}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Year 1</SelectItem>
                <SelectItem value="2">Year 2</SelectItem>
                <SelectItem value="3">Year 3</SelectItem>
                <SelectItem value="4">Year 4</SelectItem>
                <SelectItem value="5">Year 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Semester</label>
            <Select value={newSemesterNum} onValueChange={setNewSemesterNum}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Semester</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
