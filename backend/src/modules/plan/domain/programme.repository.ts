/**
 * Programme Repository
 * Database operations for programme requirements
 * Needed for plan generation hence repository is here also
 */

import supabase from "../../../lib/supabase-client";
import logger from "../../../logger";

interface ProgrammeRequirement {
  id: string;
  code: string;
  name: string;
  type: "programme" | "major" | "minor" | "specialisation";
  coreModules: string[];
  totalMcRequired?: number;
  description?: string;
}

export class ProgrammeRepository {
  private TABLE_NAME = "programmes";

  async getProgrammeByCode(code: string): Promise<ProgrammeRequirement | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select("*")
        .eq("code", code)
        .eq("type", "programme")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Not found
          return null;
        }
        throw error;
      }

      return data ? this.mapToRequirement(data) : null;
    } catch (error) {
      logger.error(
        `ProgrammeRepository: Error getting programme ${code}:`,
        error
      );
      throw error;
    }
  }

  async getByName(
    name: string,
    type: string
  ): Promise<ProgrammeRequirement | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select("*")
        .ilike("name", name)
        .eq("type", type)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data ? this.mapToRequirement(data) : null;
    } catch (error) {
      logger.error(
        `ProgrammeRepository: Error getting ${type} ${name}:`,
        error
      );
      return null;
    }
  }

  private mapToRequirement(data: any): ProgrammeRequirement {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      type: data.type,
      coreModules: data.core_modules || [],
      totalMcRequired: data.total_mc_required,
      description: data.description,
    };
  }
}
