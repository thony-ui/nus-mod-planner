import supabase from "../../../lib/supabase-client";
import logger from "../../../logger";
import {
  Module,
  ModuleSearchParams,
  ModuleSearchResult,
} from "./module.interface";

/**
 * Repository for module data access
 * Follows Repository Pattern and Single Responsibility Principle
 */
export class ModuleRepository {
  private readonly TABLE_NAME = "modules";

  /**
   * Insert or update a module in the database
   */
  async upsertModule(module: Module): Promise<Module> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .upsert(
          {
            code: module.code,
            title: module.title,
            mcs: module.mcs,
            description: module.description,
            faculty: module.faculty,
            department: module.department,
            prereq_text: module.prereqText,
            coreq_text: module.coreqText,
            preclusion_text: module.preclusionText,
            semesters_offered: module.semestersOffered,
            workload: module.workload,
            prereq_tree: module.prereqTree,
            fulfill_requirements: module.fulfillRequirements,
            attributes: module.attributes,
            raw_data: module.rawData,
            last_synced_at: module.lastSyncedAt || new Date(),
          },
          { onConflict: "code" }
        )
        .select()
        .single();

      if (error) {
        logger.error(
          `ModuleRepository: Error upserting module ${module.code}: ${error.message}`
        );
        throw new Error(`Failed to upsert module: ${error.message}`);
      }

      logger.info(
        `ModuleRepository: Successfully upserted module ${module.code}`
      );
      return this.mapDbToModule(data);
    } catch (error) {
      logger.error(`ModuleRepository: Error in upsertModule: ${error}`);
      throw error;
    }
  }

  /**
   * Bulk insert/update modules
   */
  async upsertModules(modules: Module[]): Promise<void> {
    try {
      const dbModules = modules.map((m) => ({
        code: m.code,
        title: m.title,
        mcs: m.mcs,
        description: m.description,
        faculty: m.faculty,
        department: m.department,
        prereq_text: m.prereqText,
        coreq_text: m.coreqText,
        preclusion_text: m.preclusionText,
        semesters_offered: m.semestersOffered,
        workload: m.workload,
        prereq_tree: m.prereqTree,
        fulfill_requirements: m.fulfillRequirements,
        attributes: m.attributes,
        raw_data: m.rawData,
        last_synced_at: m.lastSyncedAt || new Date(),
      }));

      const { error } = await supabase
        .from(this.TABLE_NAME)
        .upsert(dbModules, { onConflict: "code" });

      if (error) {
        logger.error(
          `ModuleRepository: Error bulk upserting modules: ${error.message}`
        );
        throw new Error(`Failed to bulk upsert modules: ${error.message}`);
      }

      logger.info(
        `ModuleRepository: Successfully upserted ${modules.length} modules`
      );
    } catch (error) {
      logger.error(`ModuleRepository: Error in upsertModules: ${error}`);
      throw error;
    }
  }

  /**
   * Get a module by its code
   */
  async getModuleByCode(code: string): Promise<Module | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select("*")
        .eq("code", code)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Not found
          return null;
        }
        logger.error(
          `ModuleRepository: Error fetching module ${code}: ${error.message}`
        );
        throw new Error(`Failed to fetch module: ${error.message}`);
      }

      return this.mapDbToModule(data);
    } catch (error) {
      logger.error(`ModuleRepository: Error in getModuleByCode: ${error}`);
      throw error;
    }
  }

  /**
   * Search modules with filters
   */
  async searchModules(params: ModuleSearchParams): Promise<ModuleSearchResult> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select("*", { count: "exact" });

      // Apply search filter (search in code and title)
      if (params.search) {
        query = query.or(
          `code.ilike.%${params.search}%,title.ilike.%${params.search}%`
        );
      }

      // Apply faculty filter
      if (params.faculty) {
        query = query.eq("faculty", params.faculty);
      }

      // Apply semester filter
      if (params.semester) {
        query = query.contains("semesters_offered", [params.semester]);
      }

      // Apply level filter (e.g., 1000, 2000)
      if (params.level) {
        const levelPrefix = params.level.charAt(0);
        query = query.like("code", `%${levelPrefix}%`);
      }

      // Apply MC range filters
      if (params.minMcs !== undefined) {
        query = query.gte("mcs", params.minMcs);
      }
      if (params.maxMcs !== undefined) {
        query = query.lte("mcs", params.maxMcs);
      }

      // Apply pagination
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      // Order by code
      query = query.order("code", { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        logger.error(
          `ModuleRepository: Error searching modules: ${error.message}`
        );
        throw new Error(`Failed to search modules: ${error.message}`);
      }

      const modules = data ? data.map((d) => this.mapDbToModule(d)) : [];

      return {
        modules,
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      logger.error(`ModuleRepository: Error in searchModules: ${error}`);
      throw error;
    }
  }

  /**
   * Get total count of modules
   */
  async getModuleCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.TABLE_NAME)
        .select("*", { count: "exact", head: true });

      if (error) {
        logger.error(
          `ModuleRepository: Error counting modules: ${error.message}`
        );
        throw new Error(`Failed to count modules: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      logger.error(`ModuleRepository: Error in getModuleCount: ${error}`);
      throw error;
    }
  }

  /**
   * Map database row to Module interface
   */
  private mapDbToModule(data: any): Module {
    return {
      code: data.code,
      title: data.title,
      mcs: parseFloat(data.mcs),
      description: data.description,
      faculty: data.faculty,
      department: data.department,
      prereqText: data.prereq_text,
      coreqText: data.coreq_text,
      preclusionText: data.preclusion_text,
      semestersOffered: data.semesters_offered || [],
      workload: data.workload,
      prereqTree: data.prereq_tree,
      fulfillRequirements: data.fulfill_requirements,
      attributes: data.attributes,
      rawData: data.raw_data,
      lastSyncedAt: data.last_synced_at
        ? new Date(data.last_synced_at)
        : undefined,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }
}
