import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Programme } from "@/lib/api-client";

interface ProgrammeSelectionProps {
  selectedProgramme: string;
  setSelectedProgramme: (code: string) => void;
  programmes: Programme[] | undefined;
  programmesLoading: boolean;
}

function ProgrammeSelection({
  selectedProgramme,
  setSelectedProgramme,
  programmes,
  programmesLoading,
}: ProgrammeSelectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Step 1: Select Your Programme</CardTitle>
        <CardDescription>Choose your primary degree programme</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedProgramme} onValueChange={setSelectedProgramme}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose your programme..." />
          </SelectTrigger>
          <SelectContent>
            {programmesLoading ? (
              <SelectItem value="loading" disabled>
                Loading programmes...
              </SelectItem>
            ) : programmes && programmes.length > 0 ? (
              programmes.map((prog) => (
                <SelectItem key={prog.code} value={prog.code}>
                  {prog.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-programmes" disabled>
                No programmes available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

export default ProgrammeSelection;
