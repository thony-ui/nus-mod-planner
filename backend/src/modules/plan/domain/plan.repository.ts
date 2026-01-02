/**
 * Plan Repository
 * Handles database operations for plans
 */

import supabase from "../../../lib/supabase-client";
import logger from "../../../logger";
import { Plan, CreatePlanDto, UpdatePlanDto } from "./plan.interface";

export class PlanRepository {
  async findByUserId(userId: string): Promise<Plan[]> {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error(`PlanRepository: findByUserId error: ${error.message}`);
      throw new Error(`Error fetching plans: ${error.message}`);
    }

    logger.info(`PlanRepository: findByUserId success for user ${userId}`);
    return data.map(this.mapToPlan);
  }

  async findById(id: string, userId: string): Promise<Plan | null> {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      logger.error(`PlanRepository: findById error: ${error.message}`);
      throw new Error(`Error fetching plan: ${error.message}`);
    }

    logger.info(`PlanRepository: findById success for id ${id}`);
    return this.mapToPlan(data);
  }

  async findActivePlan(userId: string): Promise<Plan | null> {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      logger.error(`PlanRepository: findActivePlan error: ${error.message}`);
      throw new Error(`Error fetching active plan: ${error.message}`);
    }

    logger.info(`PlanRepository: findActivePlan success for user ${userId}`);
    return this.mapToPlan(data);
  }

  async create(userId: string, dto: CreatePlanDto): Promise<Plan> {
    const { data, error } = await supabase
      .from("plans")
      .insert({
        user_id: userId,
        name: dto.name,
        programme: dto.programme,
        degree_structure: dto.degreeStructure || null,
        current_year: dto.currentYear || 1,
        current_semester: dto.currentSemester || 1,
        completed_modules: dto.completedModules || [],
        max_mc_per_semester: dto.maxMcPerSemester || 24,
        min_mc_per_semester: dto.minMcPerSemester || 12,
        pacing_preference: dto.pacingPreference || "medium",
        semester_plan: {},
        pinned_modules: {},
        warnings: [],
      })
      .select()
      .single();

    if (error) {
      logger.error(`PlanRepository: create error: ${error.message}`);
      throw new Error(`Error creating plan: ${error.message}`);
    }

    logger.info(`PlanRepository: create success: ${JSON.stringify(data)}`);
    return this.mapToPlan(data);
  }

  async update(id: string, userId: string, dto: UpdatePlanDto): Promise<Plan> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.degreeStructure !== undefined)
      updateData.degree_structure = dto.degreeStructure;
    if (dto.currentYear !== undefined)
      updateData.current_year = dto.currentYear;
    if (dto.currentSemester !== undefined)
      updateData.current_semester = dto.currentSemester;
    if (dto.maxMcPerSemester !== undefined)
      updateData.max_mc_per_semester = dto.maxMcPerSemester;
    if (dto.minMcPerSemester !== undefined)
      updateData.min_mc_per_semester = dto.minMcPerSemester;
    if (dto.pacingPreference !== undefined)
      updateData.pacing_preference = dto.pacingPreference;
    if (dto.semesterPlan !== undefined)
      updateData.semester_plan = dto.semesterPlan;
    if (dto.pinnedModules !== undefined)
      updateData.pinned_modules = dto.pinnedModules;
    if (dto.completedModules !== undefined)
      updateData.completed_modules = dto.completedModules;

    const { data, error } = await supabase
      .from("plans")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      logger.error(`PlanRepository: update error: ${error.message}`);
      throw new Error(`Error updating plan: ${error.message}`);
    }

    logger.info(`PlanRepository: update success for id ${id}`);
    return this.mapToPlan(data);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("plans")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      logger.error(`PlanRepository: delete error: ${error.message}`);
      throw new Error(`Error deleting plan: ${error.message}`);
    }

    logger.info(`PlanRepository: delete success for id ${id}`);
  }

  async updateScores(
    id: string,
    userId: string,
    workloadScore: number,
    riskScore: number,
    warnings: any[]
  ): Promise<Plan> {
    const { data, error } = await supabase
      .from("plans")
      .update({
        workload_score: workloadScore,
        risk_score: riskScore,
        warnings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      logger.error(`PlanRepository: updateScores error: ${error.message}`);
      throw new Error(`Error updating plan scores: ${error.message}`);
    }

    logger.info(`PlanRepository: updateScores success for id ${id}`);
    return this.mapToPlan(data);
  }

  private mapToPlan(data: any): Plan {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      programme: data.programme,
      degreeStructure: data.degree_structure,
      isActive: data.is_active,
      status: data.status,
      currentYear: data.current_year || 1,
      currentSemester: data.current_semester || 1,
      maxMcPerSemester: data.max_mc_per_semester,
      minMcPerSemester: data.min_mc_per_semester,
      pacingPreference: data.pacing_preference,
      semesterPlan: data.semester_plan,
      pinnedModules: data.pinned_modules,
      completedModules: data.completed_modules,
      workloadScore: data.workload_score,
      riskScore: data.risk_score,
      warnings: data.warnings,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
