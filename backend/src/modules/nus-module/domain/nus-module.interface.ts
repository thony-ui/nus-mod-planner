/**
 * NUSMods API types based on https://api.nusmods.com/v2/
 */

// Workload can be either an array of numbers or a string
export type Workload = number[] | string;

// Week range for lessons outside normal timetable
export interface WeekRange {
  start: string; // ISO date
  end: string; // ISO date
  weekInterval?: number;
  weeks?: number[];
}

// Lesson weeks can be array of week numbers or WeekRange
export type LessonWeeks = number[] | WeekRange;

// Individual lesson in a module timetable
export interface Lesson {
  classNo: string;
  lessonType: string;
  weeks: LessonWeeks;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  size?: number;
}

// Prerequisite tree structure (recursive)
export type PrereqTree = string | { and: PrereqTree[] } | { or: PrereqTree[] };

// Semester data for a specific module
export interface SemesterData {
  semester: number;
  timetable: Lesson[];
  covidZones?: string[];
  examDate?: string;
  examDuration?: number;
}

// Module attributes
export interface ModuleAttributes {
  su?: boolean;
  sfsCredit?: number;
  mpes1?: boolean;
  mpes2?: boolean;
}

// Full module information from NUSMods API
export interface NUSModsModule {
  acadYear: string;
  preclusion?: string;
  description?: string;
  title: string;
  department: string;
  faculty: string;
  workload?: Workload;
  prerequisite?: string;
  moduleCredit: string;
  moduleCode: string;
  semesterData?: SemesterData[];
  prereqTree?: PrereqTree;
  fulfillRequirements?: string[];
  attributes?: ModuleAttributes;
  corequisite?: string;
}

// Condensed module info from module list endpoint
export interface NUSModsModuleCondensed {
  moduleCode: string;
  title: string;
  semesters: number[];
}

// Our normalized module interface for the database
export interface Module {
  code: string;
  title: string;
  mcs: number;
  description?: string;
  faculty?: string;
  department?: string;
  prereqText?: string;
  coreqText?: string;
  preclusionText?: string;
  semestersOffered: string[]; // ["1", "2", "3", "4"]
  workload?: Workload;
  prereqTree?: PrereqTree;
  fulfillRequirements?: string[];
  attributes?: ModuleAttributes;
  rawData?: any;
  lastSyncedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Module search/filter query parameters
export interface ModuleSearchParams {
  search?: string;
  faculty?: string;
  semester?: string;
  level?: string; // 1000, 2000, etc
  minMcs?: number;
  maxMcs?: number;
  limit?: number;
  offset?: number;
}

// Module search result
export interface ModuleSearchResult {
  modules: Module[];
  total: number;
  limit: number;
  offset: number;
}
