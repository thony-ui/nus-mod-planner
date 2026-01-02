/**
 * Plan types for frontend
 */

export interface SemesterPlan {
  [semester: string]: string[]; // e.g., { "Y1S1": ["CS1010", "CS1231"], "Y1S2": [...] }
}

export interface PinnedModules {
  [semester: string]: string[]; // User-locked module positions
}

export interface PlanWarning {
  type: "prereq" | "overload" | "collision" | "missing_requirement";
  severity: "low" | "medium" | "high";
  message: string;
  affectedModules?: string[];
  affectedSemester?: string;
}

export interface DegreeStructure {
  primaryMajor: string;
  secondMajor?: string;
  minors: string[];
  specialisations: string[];
}

export interface Plan {
  id: string;
  userId: string;
  name: string;
  programme: string;
  degreeStructure?: DegreeStructure;

  isActive: boolean;
  status: "draft" | "active" | "completed" | "archived";

  // Constraints
  currentYear: number;
  currentSemester: number;
  maxMcPerSemester: number;
  minMcPerSemester: number;
  pacingPreference: "safe" | "balanced" | "fast" | "easy" | "medium" | "hard";

  // Plan data
  semesterPlan: SemesterPlan;
  pinnedModules: PinnedModules;
  completedModules: string[];

  // Scores
  workloadScore?: number;
  riskScore?: number;
  warnings: PlanWarning[];

  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanDto {
  name: string;
  programme: string;
  degreeStructure?: DegreeStructure;
  completedModules?: string[];
  currentYear?: number;
  currentSemester?: number;
  maxMcPerSemester?: number;
  minMcPerSemester?: number;
  pacingPreference?: "safe" | "balanced" | "fast" | "easy" | "medium" | "hard";
}

export interface UpdatePlanDto {
  name?: string;
  isActive?: boolean;
  status?: "draft" | "active" | "completed" | "archived";
  degreeStructure?: DegreeStructure;
  currentYear?: number;
  currentSemester?: number;
  maxMcPerSemester?: number;
  minMcPerSemester?: number;
  pacingPreference?: "safe" | "balanced" | "fast" | "easy" | "medium" | "hard";
  semesterPlan?: SemesterPlan;
  pinnedModules?: PinnedModules;
  completedModules?: string[];
}

export interface GeneratePlanDto {
  programme: string;
  degreeStructure: DegreeStructure;
  completedModules: string[];
  currentYear: number;
  currentSemester: number;
  maxMcPerSemester?: number;
  minMcPerSemester?: number;
  pacingPreference?: "safe" | "balanced" | "fast" | "easy" | "medium" | "hard";
  pinnedModules?: PinnedModules;
}

export interface PlanAlternative {
  semesterPlan: SemesterPlan;
  workloadScore: number;
  riskScore: number;
  description: string;
}

export interface GeneratePlanResponse {
  plan: Plan;
  alternatives: PlanAlternative[];
  estimatedGraduation: string;
}
