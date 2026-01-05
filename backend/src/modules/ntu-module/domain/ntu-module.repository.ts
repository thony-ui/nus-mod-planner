/**
 * Repository for NTU module data access
 * Follows Repository Pattern and Single Responsibility Principle
 */

import supabase from "../../../lib/supabase-client";
import logger from "../../../logger";
import { NTUModule } from "./ntu-module.interface";

export interface NTUModuleSearchResult {
  module: NTUModule;
  similarity: number;
}

export class NTUModuleRepository {
  private readonly TABLE_NAME = "ntu_modules";

  /**
   * Insert or update an NTU module in the database
   */
  async upsertModule(module: NTUModule): Promise<NTUModule> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .upsert(
          {
            code: module.code,
            title: module.title,
            description: module.description,
            url: module.url,
            aus: module.aus,
            exam: module.exam,
            grade_type: module.gradeType,
            dept: module.dept,
            prerequisites: module.prerequisites,
            mutually_exclusive: module.mutuallyExclusive,
            scraped_at: module.scrapedAt,
            embedding: module.embedding
              ? `[${module.embedding.join(",")}]`
              : null,
          },
          { onConflict: "code" }
        )
        .select()
        .single();

      if (error) {
        logger.error(
          `NTUModuleRepository: Error upserting module ${module.code}: ${error.message}`
        );
        throw new Error(`Failed to upsert module: ${error.message}`);
      }

      logger.info(
        `NTUModuleRepository: Successfully upserted module ${module.code}`
      );
      return this.mapDbToModule(data);
    } catch (error) {
      logger.error(`NTUModuleRepository: Error in upsertModule: ${error}`);
      throw error;
    }
  }

  /**
   * Bulk insert/update modules
   */
  async upsertModules(modules: NTUModule[]): Promise<void> {
    try {
      const dbModules = modules.map((m) => ({
        code: m.code,
        title: m.title,
        description: m.description,
        url: m.url,
        aus: m.aus,
        exam: m.exam,
        grade_type: m.gradeType,
        dept: m.dept,
        prerequisites: m.prerequisites,
        mutually_exclusive: m.mutuallyExclusive,
        scraped_at: m.scrapedAt,
        embedding: m.embedding ? `[${m.embedding.join(",")}]` : null,
      }));

      const { error } = await supabase
        .from(this.TABLE_NAME)
        .upsert(dbModules, { onConflict: "code" });

      if (error) {
        logger.error(
          `NTUModuleRepository: Error bulk upserting modules: ${error.message}`
        );
        throw new Error(`Failed to bulk upsert modules: ${error.message}`);
      }

      logger.info(
        `NTUModuleRepository: Successfully upserted ${modules.length} modules`
      );
    } catch (error) {
      logger.error(`NTUModuleRepository: Error in upsertModules: ${error}`);
      throw error;
    }
  }

  /**
   * Get module by code
   */
  async getByCode(code: string): Promise<NTUModule | null> {
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
          `NTUModuleRepository: Error fetching module ${code}: ${error.message}`
        );
        throw new Error(`Failed to fetch module: ${error.message}`);
      }

      return this.mapDbToModule(data);
    } catch (error) {
      logger.error(`NTUModuleRepository: Error in getByCode: ${error}`);
      throw error;
    }
  }

  /**
   * Get multiple modules by their codes
   */
  async getModulesByCodes(codes: string[]): Promise<NTUModule[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select("*")
        .in("code", codes);

      if (error) {
        logger.error(
          `NTUModuleRepository: Error fetching modules by codes: ${error.message}`
        );
        throw new Error(`Failed to fetch modules: ${error.message}`);
      }

      return (data || []).map((row) => this.mapDbToModule(row));
    } catch (error) {
      logger.error(`NTUModuleRepository: Error in getModulesByCodes: ${error}`);
      throw error;
    }
  }

  /**
   * Search modules with pagination and filters
   */
  async searchModules(params: {
    search?: string;
    dept?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: NTUModule[]; count: number }> {
    try {
      let query = supabase
        .from(this.TABLE_NAME)
        .select("*", { count: "exact" });

      // Apply search filter
      if (params.search) {
        const searchTerm = `%${params.search}%`;
        query = query.or(
          `code.ilike.${searchTerm},title.ilike.${searchTerm},description.ilike.${searchTerm}`
        );
      }

      // Apply department filter
      if (params.dept) {
        query = query.eq("dept", params.dept);
      }

      // Apply pagination
      if (params.limit) {
        query = query.limit(params.limit);
      }
      if (params.offset) {
        query = query.range(
          params.offset,
          params.offset + (params.limit || 20) - 1
        );
      }

      // Order by code
      query = query.order("code", { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        logger.error(
          `NTUModuleRepository: Error searching modules: ${error.message}`
        );
        throw new Error(`Failed to search modules: ${error.message}`);
      }

      return {
        data: (data || []).map((row) => this.mapDbToModule(row)),
        count: count || 0,
      };
    } catch (error) {
      logger.error(`NTUModuleRepository: Error in searchModules: ${error}`);
      throw error;
    }
  }

  /**
   * Get all modules
   */
  async getAllModules(): Promise<NTUModule[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select("*")
        .order("code", { ascending: true });

      if (error) {
        logger.error(
          `NTUModuleRepository: Error fetching all modules: ${error.message}`
        );
        throw new Error(`Failed to fetch modules: ${error.message}`);
      }

      return (data || []).map((row) => this.mapDbToModule(row));
    } catch (error) {
      logger.error(`NTUModuleRepository: Error in getAllModules: ${error}`);
      throw error;
    }
  }

  /**
   * Get all modules without embeddings
   */
  async getModulesWithoutEmbeddings(): Promise<NTUModule[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select("*")
        .is("embedding", null)
        .order("code", { ascending: true });

      if (error) {
        logger.error(
          `NTUModuleRepository: Error fetching modules without embeddings: ${error.message}`
        );
        throw new Error(
          `Failed to fetch modules without embeddings: ${error.message}`
        );
      }

      return (data || []).map((row) => this.mapDbToModule(row));
    } catch (error) {
      logger.error(
        `NTUModuleRepository: Error in getModulesWithoutEmbeddings: ${error}`
      );
      throw error;
    }
  }

  /**
   * Search for similar modules using vector similarity
   */
  async searchSimilarModules(
    queryEmbedding: number[],
    matchThreshold: number = 0.5,
    matchCount: number = 10
  ): Promise<NTUModuleSearchResult[]> {
    try {
      const { data, error } = await supabase.rpc("search_ntu_modules", {
        query_embedding: `[${queryEmbedding.join(",")}]`,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });

      if (error) {
        logger.error(
          `NTUModuleRepository: Error searching modules: ${error.message}`
        );
        throw new Error(`Failed to search modules: ${error.message}`);
      }

      const results: NTUModuleSearchResult[] = (data || []).map((row: any) => ({
        module: {
          id: row.id,
          code: row.code,
          title: row.title,
          description: row.description,
          dept: row.dept,
          prerequisites: [],
          mutuallyExclusive: [],
        },
        similarity: row.similarity || 0,
      }));

      logger.info(
        `NTUModuleRepository: Found ${results.length} similar modules`
      );

      return results;
    } catch (error) {
      logger.error(
        `NTUModuleRepository: Error in searchSimilarModules: ${error}`
      );
      throw error;
    }
  }

  /**
   * Update module embedding
   */
  async updateEmbedding(code: string, embedding: number[]): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .update({
          embedding: `[${embedding.join(",")}]`,
        })
        .eq("code", code);

      if (error) {
        logger.error(
          `NTUModuleRepository: Error updating embedding for ${code}: ${error.message}`
        );
        throw new Error(`Failed to update embedding: ${error.message}`);
      }

      logger.debug(`NTUModuleRepository: Updated embedding for module ${code}`);
    } catch (error) {
      logger.error(`NTUModuleRepository: Error in updateEmbedding: ${error}`);
      throw error;
    }
  }

  /**
   * Map database row to NTUModule
   */
  private mapDbToModule(row: any): NTUModule {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      url: row.url,
      aus: row.aus,
      exam: row.exam,
      gradeType: row.grade_type,
      dept: row.dept,
      prerequisites: row.prerequisites || [],
      mutuallyExclusive: row.mutually_exclusive || [],
      scrapedAt: row.scraped_at ? new Date(row.scraped_at) : undefined,
      embedding: row.embedding ? this.parseEmbedding(row.embedding) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
  }

  /**
   * Parse embedding from database format
   */
  private parseEmbedding(embedding: any): number[] | undefined {
    if (!embedding) return undefined;
    if (Array.isArray(embedding)) return embedding;
    if (typeof embedding === "string") {
      try {
        return JSON.parse(embedding);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}
