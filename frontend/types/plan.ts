/**
 * Plan types for frontend
 */
export interface SemesterModules {
  module: string;
  mcs: number;
}
export interface SemesterPlan {
  [semester: string]: SemesterModules[]; // e.g., { "Y1S1": [{ module: "CS1010", mcs: 4 }, { module: "CS1231", mcs: 4 }], "Y1S2": [...] }
}

export interface ModuleMCs {
  [moduleCode: string]: number; // e.g., { "CS1010": 4, "CS1231": 4 }
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
  pacingPreference: "easy" | "medium" | "hard";

  // Plan data
  semesterPlan: SemesterPlan;
  moduleMCs: ModuleMCs; // Store MC values for each module
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
  pacingPreference?: "easy" | "medium" | "hard";
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
  pacingPreference?: "easy" | "medium" | "hard";
  semesterPlan?: SemesterPlan;
  moduleMCs?: ModuleMCs; // MC values for modules
  pinnedModules?: PinnedModules;
  completedModules?: string[];
}

export interface GeneratePlanDto {
  programme: string;
  degreeStructure: DegreeStructure;
  completedModules: string[];
  moduleMCs?: ModuleMCs; // MC values for modules
  currentYear: number;
  currentSemester: number;
  maxMcPerSemester?: number;
  minMcPerSemester?: number;
  pacingPreference?: "easy" | "medium" | "hard";
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
