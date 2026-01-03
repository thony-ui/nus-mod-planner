import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface YearAndSemesterProps {
  currentYear: number;
  setCurrentYear: (year: number) => void;
  currentSemester: number;
  setCurrentSemester: (semester: number) => void;
}

function YearAndSemester({
  currentYear,
  setCurrentYear,
  currentSemester,
  setCurrentSemester,
}: YearAndSemesterProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Step 2: Current Academic Period</CardTitle>
        <CardDescription>
          Indicate your current year and semester (e.g., Y2S1 = Year 2, Semester
          1)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Year</label>
            <Select
              value={currentYear.toString()}
              onValueChange={(val) => setCurrentYear(parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Year 1</SelectItem>
                <SelectItem value="2">Year 2</SelectItem>
                <SelectItem value="3">Year 3</SelectItem>
                <SelectItem value="4">Year 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Semester</label>
            <Select
              value={currentSemester.toString()}
              onValueChange={(val) => setCurrentSemester(parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default YearAndSemester;
