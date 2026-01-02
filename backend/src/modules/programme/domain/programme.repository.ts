/**
 * Programme Repository
 * Read-only database operations for programmes
 */

import supabase from "../../../lib/supabase-client";
import logger from "../../../logger";
import { Programme } from "./programme.interface";

export class ProgrammeRepository {
  private TABLE_NAME = "programmes";

  /**
   * Get all programmes (type='programme')
   */
  async getAllProgrammes(): Promise<Programme[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select("*")
        .eq("type", "programme")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      return data.map(this.mapToProgramme);
    } catch (error) {
      logger.error("ProgrammeRepository: Error getting all programmes:", error);
      throw new Error("Failed to fetch programmes");
    }
  }

  /**
   * Get programme by code
   */
  async getProgrammeByCode(code: string): Promise<Programme | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select("*")
        .eq("code", code)
        .eq("type", "programme")
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data ? this.mapToProgramme(data) : null;
    } catch (error) {
      logger.error(
        `ProgrammeRepository: Error getting programme ${code}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get by name and type (for majors, minors, specialisations)
   */
  async getByName(name: string, type: string): Promise<Programme | null> {
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

      return data ? this.mapToProgramme(data) : null;
    } catch (error) {
      logger.error(
        `ProgrammeRepository: Error getting ${type} ${name}:`,
        error
      );
      return null;
    }
  }

  private mapToProgramme(data: any): Programme {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      type: data.type,
      coreModules: data.core_modules || [],
      totalMcRequired: data.total_mc_required,
      description: data.description,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };
  }
}
