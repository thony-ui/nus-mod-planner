import React from "react";
import { Badge } from "../ui/badge";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Input } from "../ui/input";

interface DegreeStructureProps {
  primaryMajor: string;
  setPrimaryMajor: (value: string) => void;
  secondMajor: string;
  setSecondMajor: (value: string) => void;
  minors: string[];
  setMinors: (value: string[]) => void;
  newMinor: string;
  setNewMinor: (value: string) => void;
  specialisations: string[];
  setSpecialisations: (value: string[]) => void;
  newSpecialisation: string;
  setNewSpecialisation: (value: string) => void;
}

function Degree({
  primaryMajor,
  setPrimaryMajor,
  secondMajor,
  setSecondMajor,
  minors,
  setMinors,
  newMinor,
  setNewMinor,
  specialisations,
  setSpecialisations,
  newSpecialisation,
  setNewSpecialisation,
}: DegreeStructureProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Step 3: Degree Structure</CardTitle>
        <CardDescription>
          Configure your major(s), minor(s), and specialisation(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Major */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Primary Major *
          </label>
          <Input
            placeholder="e.g., Computer Science"
            value={primaryMajor}
            onChange={(e) => setPrimaryMajor(e.target.value)}
          />
        </div>

        {/* Second Major */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Second Major (Optional - for Double Major)
          </label>
          <Input
            placeholder="e.g., Mathematics"
            value={secondMajor}
            onChange={(e) => setSecondMajor(e.target.value)}
          />
        </div>

        {/* Minors */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Minor(s) (Optional - up to 2)
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Enter minor"
              value={newMinor}
              onChange={(e) => setNewMinor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newMinor && minors.length < 2) {
                  setMinors([...minors, newMinor]);
                  setNewMinor("");
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!newMinor || minors.length >= 2}
              onClick={() => {
                if (newMinor && minors.length < 2) {
                  setMinors([...minors, newMinor]);
                  setNewMinor("");
                }
              }}
            >
              Add
            </Button>
          </div>
          {minors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {minors.map((minor, idx) => (
                <Badge key={idx} variant="outline">
                  {minor}
                  <button
                    onClick={() =>
                      setMinors(minors.filter((_, i) => i !== idx))
                    }
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Specialisations */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Specialisation(s) (Optional)
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="e.g., Artificial Intelligence, Computer Security"
              value={newSpecialisation}
              onChange={(e) => setNewSpecialisation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSpecialisation) {
                  setSpecialisations([...specialisations, newSpecialisation]);
                  setNewSpecialisation("");
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!newSpecialisation}
              onClick={() => {
                if (newSpecialisation) {
                  setSpecialisations([...specialisations, newSpecialisation]);
                  setNewSpecialisation("");
                }
              }}
            >
              Add
            </Button>
          </div>
          {specialisations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {specialisations.map((spec, idx) => (
                <Badge key={idx} variant="outline">
                  {spec}
                  <button
                    onClick={() =>
                      setSpecialisations(
                        specialisations.filter((_, i) => i !== idx)
                      )
                    }
                    className="ml-2"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default Degree;
