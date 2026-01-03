import { Plan } from "@/types/plan";
import { Module } from "@/types/module";

export function calculateSemesterMC(
  semesterModules: string[],
  allModules: Module[] | undefined
): number {
  if (!allModules) return 0;
  return semesterModules.reduce((total, code) => {
    const modules = allModules.find((m) => m.code === code);
    return total + (modules?.mcs || 0);
  }, 0);
}

export function calculateTotalMC(
  plan: Plan,
  allModules: Module[] | undefined
): number {
  if (!allModules) return 0;
  return Object.values(plan.semesterPlan).reduce((total, semesterModules) => {
    return total + calculateSemesterMC(semesterModules, allModules);
  }, 0);
}
