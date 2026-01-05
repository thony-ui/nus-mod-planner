import { ExternalLink } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { AnyModule, isNTUModule, University } from "@/types/module";

/**
 * Individual Module Card Component
 * Follows Single Responsibility Principle
 */
export function ModuleCard({
  module,
  onSelect,
  university = "NUS",
}: {
  module: AnyModule;
  onSelect?: (module: AnyModule) => void;
  university?: University;
}) {
  const isNTU = isNTUModule(module);

  const external_url = isNTU
    ? module.url || `https://ntumods.com/mods/${module.code}`
    : `https://nusmods.com/courses/${module.code}`;

  const credits =
    isNTU && "aus" in module ? module.aus : "mcs" in module ? module.mcs : 0;
  const creditLabel = isNTU ? "AU" : "MC";

  return (
    <Card
      onClick={() => onSelect?.(module)}
      className={
        onSelect ? "cursor-pointer hover:bg-accent transition-colors" : ""
      }
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{module.code}</CardTitle>
              <a
                href={external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <CardDescription>{module.title}</CardDescription>
          </div>
          {credits !== undefined && credits !== null && (
            <Badge variant="secondary">
              {credits} {creditLabel}
              {credits !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      {(module.description ||
        (!isNTU && "faculty" in module && module.faculty) ||
        (isNTU && module.dept) ||
        (!isNTU &&
          "semestersOffered" in module &&
          module.semestersOffered?.length > 0)) && (
        <CardContent>
          {module.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {module.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            {!isNTU && "faculty" in module && module.faculty && (
              <Badge variant="outline">{module.faculty}</Badge>
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
                  Sem {module.semestersOffered.join(", ")}
                </Badge>
              )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
