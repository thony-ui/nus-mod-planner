import { ExternalLink } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Module } from "@/types/module";

/**
 * Individual Module Card Component
 * Follows Single Responsibility Principle
 */
export function ModuleCard({
  module,
  onSelect,
}: {
  module: Module;
  onSelect?: (module: Module) => void;
}) {
  const nusmods_url = `https://nusmods.com/courses/${module.code}`;

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
                href={nusmods_url}
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
          <Badge variant="secondary">
            {module.mcs} MC{module.mcs !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      {(module.description ||
        module.faculty ||
        module.semestersOffered?.length > 0) && (
        <CardContent>
          {module.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {module.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            {module.faculty && (
              <Badge variant="outline">{module.faculty}</Badge>
            )}
            {module.semestersOffered && module.semestersOffered.length > 0 && (
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
