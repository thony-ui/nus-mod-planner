/**
 * Module types matching backend API
 */

export type Workload = number[] | string;

export interface WeekRange {
  start: string;
  end: string;
  weekInterval?: number;
  weeks?: number[];
}

export type LessonWeeks = number[] | WeekRange;

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

export type PrereqTree = string | { and: PrereqTree[] } | { or: PrereqTree[] };

export interface SemesterData {
  semester: number;
  timetable: Lesson[];
  covidZones?: string[];
  examDate?: string;
  examDuration?: number;
}

export interface ModuleAttributes {
  su?: boolean;
  sfsCredit?: number;
  mpes1?: boolean;
  mpes2?: boolean;
}

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
  semestersOffered: string[];
  workload?: Workload;
  prereqTree?: PrereqTree;
  fulfillRequirements?: string[];
  attributes?: ModuleAttributes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawData?: any;
  lastSyncedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ModuleSearchParams {
  search?: string;
  faculty?: string;
  semester?: string;
  level?: string;
  minMcs?: number;
  maxMcs?: number;
  limit?: number;
  offset?: number;
}

export interface ModuleSearchResult {
  modules: Module[];
  total: number;
  limit: number;
  offset: number;
}

export interface ModuleStats {
  totalModules: number;
  lastSynced?: string;
}
