"use client";

import { University, AnyModule } from "@/types/module";
import { NUSModuleSearch } from "./nus-module-search";
import { NTUModuleSearch } from "./ntu-module-search";

/**
 * Module Search Container
 * Routes to the appropriate university-specific search component
 */
export function ModuleSearch({
  onModuleSelect,
  university = "NUS",
}: {
  onModuleSelect?: (module: AnyModule) => void;
  university?: University;
}) {
  if (university === "NTU") {
    return <NTUModuleSearch onModuleSelect={onModuleSelect} />;
  }

  return <NUSModuleSearch onModuleSelect={onModuleSelect} />;
}
