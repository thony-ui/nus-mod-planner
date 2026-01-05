"use client";

import { Module, AnyModule, isNTUModule, University } from "@/types/module";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ModuleDetailsDialogProps {
  module: AnyModule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  university?: University;
}

export function ModuleDetailsDialog({
  module,
  open,
  onOpenChange,
  university = "NUS",
}: ModuleDetailsDialogProps) {
  if (!module) return null;

  const isNTU = isNTUModule(module);
  const credits =
    isNTU && "aus" in module ? module.aus : "mcs" in module ? module.mcs : 0;
  const creditLabel = isNTU ? "AU" : "MC";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl pr-8">
            <div className="font-bold">{module.code}</div>
            <div className="text-base font-normal text-muted-foreground mt-1">
              {module.title}
            </div>
          </DialogTitle>
          <div className="pt-2">
            {credits !== undefined && credits !== null && (
              <Badge variant="secondary" className="w-fit">
                {credits} {creditLabel}
                {credits !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-4 -mx-6 px-6">
          <div className="space-y-6">
            {/* Description */}
            {module.description && (
              <div>
                <h3 className="font-semibold mb-2 text-base">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {module.description}
                </p>
              </div>
            )}

            {/* Faculty & Department */}
            <div className="flex flex-wrap gap-2">
              {!isNTU && "faculty" in module && module.faculty && (
                <Badge variant="outline">{module.faculty}</Badge>
              )}
              {!isNTU && "department" in module && module.department && (
                <Badge variant="outline">{module.department}</Badge>
              )}
              {isNTU && module.dept && (
                <Badge variant="outline">{module.dept}</Badge>
              )}
              {!isNTU &&
                "semestersOffered" in module &&
                module.semestersOffered &&
                module.semestersOffered.length > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 dark:bg-green-950"
                  >
                    Offered: Sem {module.semestersOffered.join(", ")}
                  </Badge>
                )}
            </div>

            {/* NUS-specific fields */}
            {!isNTU && "workload" in module && module.workload && (
              <div>
                <h3 className="font-semibold mb-2 text-base">Workload</h3>
                <div className="text-sm bg-muted/50 p-3 rounded-md">
                  {typeof module.workload === "string" ? (
                    <p>{module.workload}</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium">Hours per week:</p>
                      <p className="text-muted-foreground">
                        Lecture: {module.workload[0] || 0}h • Tutorial:{" "}
                        {module.workload[1] || 0}h • Lab:{" "}
                        {module.workload[2] || 0}h • Project:{" "}
                        {module.workload[3] || 0}h • Preparation:{" "}
                        {module.workload[4] || 0}h
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NTU-specific fields */}
            {isNTU && module.exam && (
              <div>
                <h3 className="font-semibold mb-2 text-base">Exam</h3>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md">
                  {module.exam}
                </p>
              </div>
            )}

            {isNTU && module.gradeType && (
              <div>
                <h3 className="font-semibold mb-2 text-base">Grade Type</h3>
                <Badge variant="outline">{module.gradeType}</Badge>
              </div>
            )}

            {/* Prerequisites */}
            {!isNTU && "prereqText" in module && module.prereqText && (
              <div>
                <h3 className="font-semibold mb-2 text-base">Prerequisites</h3>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md">
                  {module.prereqText}
                </p>
              </div>
            )}

            {isNTU &&
              module.prerequisites &&
              module.prerequisites.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-base">
                    Prerequisites
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {module.prerequisites.map((prereq, idx) => (
                      <Badge key={idx} variant="outline">
                        {prereq}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Corequisites (NUS only) */}
            {!isNTU && "coreqText" in module && module.coreqText && (
              <div>
                <h3 className="font-semibold mb-2 text-base">Corequisites</h3>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md">
                  {module.coreqText}
                </p>
              </div>
            )}

            {/* Preclusions */}
            {!isNTU && "preclusionText" in module && module.preclusionText && (
              <div>
                <h3 className="font-semibold mb-2 text-base">Preclusions</h3>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md">
                  {module.preclusionText}
                </p>
              </div>
            )}

            {isNTU &&
              module.mutuallyExclusive &&
              module.mutuallyExclusive.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-base">
                    Mutually Exclusive
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {module.mutuallyExclusive.map((me, idx) => (
                      <Badge key={idx} variant="outline">
                        {me}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Fulfill Requirements (NUS only) */}
            {!isNTU &&
              "fulfillRequirements" in module &&
              module.fulfillRequirements &&
              module.fulfillRequirements.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-base">
                    Fulfills Requirements
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {module.fulfillRequirements.map((req, idx) => (
                      <Badge key={idx} variant="secondary">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Attributes (NUS only) */}
            {!isNTU &&
              "attributes" in module &&
              module.attributes &&
              Object.keys(module.attributes).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 text-base">Attributes</h3>
                  <div className="flex flex-wrap gap-2">
                    {module.attributes.su && (
                      <Badge variant="outline">S/U Available</Badge>
                    )}
                    {module.attributes.sfsCredit && (
                      <Badge variant="outline">
                        SFS Credit: {module.attributes.sfsCredit}
                      </Badge>
                    )}
                    {module.attributes.mpes1 && (
                      <Badge variant="outline">MPES1</Badge>
                    )}
                    {module.attributes.mpes2 && (
                      <Badge variant="outline">MPES2</Badge>
                    )}
                  </div>
                </div>
              )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
