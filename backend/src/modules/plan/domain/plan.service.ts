/**
 * Plan Service
 * Business logic for plan generation and management
 */

import { PlanRepository } from "./plan.repository";
import { ModuleRepository } from "../../module/domain/module.repository";
import { ProgrammeRepository } from "../../programme/domain/programme.repository";
import {
  Plan,
  CreatePlanDto,
  UpdatePlanDto,
  GeneratePlanDto,
  GeneratePlanResponse,
  PlanAlternative,
  SemesterPlan,
} from "./plan.interface";
import logger from "../../../logger";

export class PlanService {
  private moduleRepository: ModuleRepository;
  private programmeRepository: ProgrammeRepository;

  constructor(private planRepository: PlanRepository) {
    this.moduleRepository = new ModuleRepository();
    this.programmeRepository = new ProgrammeRepository();
  }

  async getUserPlans(userId: string): Promise<Plan[]> {
    return this.planRepository.findByUserId(userId);
  }

  async getPlanById(id: string, userId: string): Promise<Plan | null> {
    return this.planRepository.findById(id, userId);
  }

  async getActivePlan(userId: string): Promise<Plan | null> {
    return this.planRepository.findActivePlan(userId);
  }

  async createPlan(userId: string, dto: CreatePlanDto): Promise<Plan> {
    // Deactivate other plans if this is set as active
    const existingActivePlan = await this.planRepository.findActivePlan(userId);
    if (existingActivePlan) {
      await this.planRepository.update(existingActivePlan.id, userId, {
        isActive: false,
      });
    }

    return this.planRepository.create(userId, dto);
  }

  async updatePlan(
    id: string,
    userId: string,
    dto: UpdatePlanDto
  ): Promise<Plan> {
    // If setting this plan as active, deactivate others
    if (dto.isActive) {
      const existingActivePlan = await this.planRepository.findActivePlan(
        userId
      );
      if (existingActivePlan && existingActivePlan.id !== id) {
        await this.planRepository.update(existingActivePlan.id, userId, {
          isActive: false,
        });
      }
    }

    return this.planRepository.update(id, userId, dto);
  }

  async deletePlan(id: string, userId: string): Promise<void> {
    return this.planRepository.delete(id, userId);
  }

  /**
   * Generate a new semester plan
   * Calls AI service for optimization
   */
  async generatePlan(
    userId: string,
    dto: GeneratePlanDto
  ): Promise<GeneratePlanResponse> {
    logger.info("GeneratePlan called with dto:", { dto });

    // Call AI service for plan generation
    let aiResponse;
    const useAiService = process.env.AI_SERVICE_URL;

    if (useAiService) {
      try {
        aiResponse = await this.callAiService(dto);
        logger.info("AI service response received:", { aiResponse });
      } catch (error) {
        logger.warn("AI service unavailable, falling back to mock", { error });
        aiResponse = await this.generateMockPlan(dto);
      }
    } else {
      // Fallback to mock if AI service not configured
      logger.info("No AI_SERVICE_URL configured, using mock");
      aiResponse = await this.generateMockPlan(dto);
    }

    // Create the plan in database
    const plan = await this.createPlan(userId, {
      name: `${dto.programme} Plan - ${new Date().toLocaleDateString()}`,
      programme: dto.programme,
      degreeStructure: dto.degreeStructure,
      currentYear: dto.currentYear,
      currentSemester: dto.currentSemester,
      completedModules: dto.completedModules,
      maxMcPerSemester: dto.maxMcPerSemester,
      minMcPerSemester: dto.minMcPerSemester,
      pacingPreference: dto.pacingPreference,
    });

    // Update with generated semester plan
    const updatedPlan = await this.planRepository.update(plan.id, userId, {
      semesterPlan: aiResponse.semesterPlan,
      pinnedModules: dto.pinnedModules || {},
    });

    // Calculate scores
    const finalPlan = await this.planRepository.updateScores(
      updatedPlan.id,
      userId,
      aiResponse.workloadScore,
      aiResponse.riskScore,
      aiResponse.warnings
    );

    return {
      plan: finalPlan,
      alternatives: aiResponse.alternatives,
      estimatedGraduation: this.calculateGraduation(aiResponse.semesterPlan),
    };
  }

  /**
   * Call AI service for plan generation
   */
  private async callAiService(dto: GeneratePlanDto) {
    const AI_SERVICE_URL =
      process.env.AI_SERVICE_URL || "http://localhost:8001";

    // Fetch ALL modules from database for complete planning
    logger.info("Fetching all modules from database...");

    // Fetch in batches to get ALL modules
    let allModules: any[] = [];
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const batchResult = await this.moduleRepository.searchModules({
        limit: batchSize,
        offset: offset,
      });

      allModules = allModules.concat(batchResult.modules);
      offset += batchSize;

      // Stop if we got fewer than batch size (no more data)
      if (batchResult.modules.length < batchSize) {
        hasMore = false;
      }

      logger.info(
        `Fetched batch: ${batchResult.modules.length} modules (total so far: ${allModules.length})`
      );
    }

    logger.info(`Fetched ${allModules.length} total modules from database`);
    logger.info(
      `Sample module codes: ${allModules
        .slice(0, 20)
        .map((m) => m.code)
        .join(", ")}`
    );

    // Filter to get undergraduate modules (level 1000-4999) and relevant for degree planning
    const undergraduateModules = allModules.filter((m) => {
      const levelMatch = m.code.match(/[A-Z]{2,3}(\d)/);
      if (!levelMatch) return false;
      const level = parseInt(levelMatch[1]);
      return level >= 1 && level <= 4; // Only 1000-4999 level modules
    });

    logger.info(
      `Filtered to ${undergraduateModules.length} undergraduate modules (1000-4999 level)`
    );
    logger.info(
      `Sample undergrad codes: ${undergraduateModules
        .slice(0, 20)
        .map((m) => m.code)
        .join(", ")}`
    );

    const availableModules = undergraduateModules.map((module) => ({
      code: module.code,
      title: module.title,
      mcs: module.mcs,
      description: module.description || "",
      prereqText: module.prereqText || "",
      semestersOffered: module.semestersOffered || ["1", "2"],
    }));
    logger.info("Available modules for planning:", {
      availableModules: availableModules.slice(0, 20),
    });
    logger.info(`Fetched ${availableModules.length} modules for planning`);

    const programmeRequirements = this.getProgrammeRequirements(dto);
    logger.info("Programme requirements:", { programmeRequirements });

    const requestBody = {
      constraints: {
        programme: dto.programme,
        degreeStructure: dto.degreeStructure,
        completedModules: dto.completedModules,
        currentYear: dto.currentYear,
        currentSemester: dto.currentSemester,
        maxMcPerSemester: dto.maxMcPerSemester,
        minMcPerSemester: dto.minMcPerSemester,
        pacingPreference: dto.pacingPreference,
        pinnedModules: dto.pinnedModules || {},
      },
      availableModules,
      programmeRequirements,
    };

    logger.info("Sending request to AI service:", {
      url: `${AI_SERVICE_URL}/plan/generate`,
      constraintsKeys: Object.keys(requestBody.constraints),
      moduleCount: availableModules.length,
      requirementsKeys: Object.keys(programmeRequirements),
    });

    const response = await fetch(`${AI_SERVICE_URL}/plan/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("AI service error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`AI service error: ${response.statusText}`);
    }

    const data = await response.json();
    logger.info("AI service response data:", { data });

    return {
      semesterPlan: data.plan.semesterPlan,
      workloadScore: data.plan.workloadScore,
      riskScore: data.plan.riskScore,
      warnings: data.plan.warnings || [],
      alternatives: data.alternatives || [],
    };
  }

  /**
   * Mock plan generator (fallback when AI service unavailable)
   */
  private async generateMockPlan(dto: GeneratePlanDto) {
    const semesterPlan: SemesterPlan = {};
    const currentYear = dto.currentYear || 1;
    const currentSem = dto.currentSemester || 1;

    // Get requirements from database
    const requirements = await this.getProgrammeRequirements(dto);
    const mockModules = requirements.core || [];
    const filteredModules = mockModules.filter(
      (mod: string) => !dto.completedModules.includes(mod)
    );

    let semesterIndex = 0;
    for (let y = currentYear; y <= currentYear + 2; y++) {
      for (let s = y === currentYear ? currentSem : 1; s <= 2; s++) {
        const semesterKey = `Y${y}S${s}`;
        const modsForSemester = filteredModules.slice(
          semesterIndex * 5,
          (semesterIndex + 1) * 5
        );

        if (modsForSemester.length > 0) {
          semesterPlan[semesterKey] = modsForSemester;
          semesterIndex++;
        }

        if (semesterIndex * 5 >= filteredModules.length) break;
      }
      if (semesterIndex * 5 >= filteredModules.length) break;
    }

    // Apply pinned modules
    if (dto.pinnedModules) {
      Object.entries(dto.pinnedModules).forEach(([sem, mods]) => {
        if (semesterPlan[sem]) {
          semesterPlan[sem] = [...new Set([...mods, ...semesterPlan[sem]])];
        } else {
          semesterPlan[sem] = mods;
        }
      });
    }

    return {
      semesterPlan,
      workloadScore: 7.5,
      riskScore: 6.2,
      warnings: [],
      alternatives: this.generateAlternatives(semesterPlan),
    };
  }

  private generateAlternatives(basePlan: SemesterPlan): PlanAlternative[] {
    return [
      {
        semesterPlan: basePlan,
        workloadScore: 8.2,
        riskScore: 5.5,
        description: "Lighter workload, extended timeline",
      },
      {
        semesterPlan: basePlan,
        workloadScore: 6.8,
        riskScore: 7.1,
        description: "Faster pace, higher intensity",
      },
    ];
  }

  private calculateGraduation(semesterPlan: SemesterPlan): string {
    const semesters = Object.keys(semesterPlan).sort();
    return semesters[semesters.length - 1] || "Y4S2";
  }

  private async getProgrammeRequirements(dto: GeneratePlanDto) {
    const requirements: any = {
      totalMcRequired: 160,
      core: [],
    };

    // Get programme core modules from database
    const programme = await this.programmeRepository.getProgrammeByCode(
      dto.programme
    );
    if (programme) {
      requirements.core = programme.coreModules;
      requirements.totalMcRequired = programme.totalMcRequired || 160;
    } else {
      logger.warn(
        `Programme ${dto.programme} not found in database, using empty core`
      );
    }

    // Add degree structure requirements from database
    if (dto.degreeStructure) {
      // Primary major additional requirements
      if (dto.degreeStructure.primaryMajor) {
        const major = await this.programmeRepository.getByName(
          dto.degreeStructure.primaryMajor,
          "major"
        );
        if (major) {
          requirements[dto.degreeStructure.primaryMajor] = major.coreModules;
        }
      }

      // Second major
      if (dto.degreeStructure.secondMajor) {
        const secondMajor = await this.programmeRepository.getByName(
          dto.degreeStructure.secondMajor,
          "major"
        );
        if (secondMajor) {
          requirements[dto.degreeStructure.secondMajor] =
            secondMajor.coreModules;
        }
      }

      // Minors
      if (dto.degreeStructure.minors) {
        for (const minor of dto.degreeStructure.minors) {
          const minorReq = await this.programmeRepository.getByName(
            minor,
            "minor"
          );
          if (minorReq) {
            requirements[minor] = minorReq.coreModules;
          }
        }
      }

      // Specializations
      if (dto.degreeStructure.specialisations) {
        for (const spec of dto.degreeStructure.specialisations) {
          const specReq = await this.programmeRepository.getByName(
            spec,
            "specialisation"
          );
          if (specReq) {
            requirements[spec] = specReq.coreModules;
          }
        }
      }
    }

    return requirements;
  }
}
