import axios from "axios";
import logger from "../../../logger";
import {
  NUSModsModule,
  NUSModsModuleCondensed,
  Module,
} from "./nus-module.interface";

/**
 * Service responsible for fetching and normalizing NUSMods data
 * Follows Single Responsibility Principle - only handles NUSMods API integration
 */
export class NUSModsSyncService {
  private readonly BASE_URL = "https://api.nusmods.com/v2";
  private readonly CURRENT_ACAD_YEAR = "2025-2026"; // Update this annually

  /**
   * Fetch the list of all modules (condensed) for the current academic year
   */
  async fetchModuleList(): Promise<NUSModsModuleCondensed[]> {
    try {
      const url = `${this.BASE_URL}/${this.CURRENT_ACAD_YEAR}/moduleList.json`;
      logger.info(`NUSModsSyncService: Fetching module list from ${url}`);

      const response = await axios.get<NUSModsModuleCondensed[]>(url, {
        timeout: 30000,
        headers: {
          "User-Agent": "NUS-Mod-Planner/1.0",
        },
      });

      logger.info(
        `NUSModsSyncService: Successfully fetched ${response.data.length} modules`
      );
      return response.data;
    } catch (error) {
      logger.error(`NUSModsSyncService: Error fetching module list: ${error}`);
      throw new Error(`Failed to fetch module list from NUSMods API: ${error}`);
    }
  }

  /**
   * Fetch detailed information for a specific module
   */
  async fetchModuleDetails(moduleCode: string): Promise<NUSModsModule> {
    try {
      const url = `${this.BASE_URL}/${this.CURRENT_ACAD_YEAR}/modules/${moduleCode}.json`;
      logger.info(
        `NUSModsSyncService: Fetching details for module ${moduleCode}`
      );

      const response = await axios.get<NUSModsModule>(url, {
        timeout: 10000,
        headers: {
          "User-Agent": "NUS-Mod-Planner/1.0",
        },
      });

      logger.info(
        `NUSModsSyncService: Successfully fetched details for ${moduleCode}`
      );
      return response.data;
    } catch (error) {
      logger.error(
        `NUSModsSyncService: Error fetching module ${moduleCode}: ${error}`
      );
      throw new Error(
        `Failed to fetch module ${moduleCode} from NUSMods API: ${error}`
      );
    }
  }

  /**
   * Normalize NUSMods module data to our database schema
   */
  normalizeModule(nusModsModule: NUSModsModule): Module {
    const semestersOffered = nusModsModule.semesterData
      ? nusModsModule.semesterData.map((sem) => sem.semester.toString())
      : [];

    return {
      code: nusModsModule.moduleCode,
      title: nusModsModule.title,
      mcs: parseFloat(nusModsModule.moduleCredit),
      description: nusModsModule.description,
      faculty: nusModsModule.faculty,
      department: nusModsModule.department,
      prereqText: nusModsModule.prerequisite,
      coreqText: nusModsModule.corequisite,
      preclusionText: nusModsModule.preclusion,
      semestersOffered,
      workload: nusModsModule.workload,
      prereqTree: nusModsModule.prereqTree,
      fulfillRequirements: nusModsModule.fulfillRequirements,
      attributes: nusModsModule.attributes,
      rawData: nusModsModule,
      lastSyncedAt: new Date(),
    };
  }

  /**
   * Fetch and normalize a batch of modules
   * Implements rate limiting to be polite to NUSMods API
   */
  async syncModuleBatch(
    moduleCodes: string[],
    batchSize: number = 10,
    delayMs: number = 1000
  ): Promise<Module[]> {
    const modules: Module[] = [];

    for (let i = 0; i < moduleCodes.length; i += batchSize) {
      const batch = moduleCodes.slice(i, i + batchSize);

      logger.info(
        `NUSModsSyncService: Processing batch ${
          Math.floor(i / batchSize) + 1
        } (${batch.length} modules)`
      );

      const batchPromises = batch.map((code) =>
        this.fetchModuleDetails(code)
          .then((data) => this.normalizeModule(data))
          .catch((error) => {
            logger.error(
              `NUSModsSyncService: Failed to sync module ${code}: ${error}`
            );
            return null;
          })
      );

      const batchResults = await Promise.all(batchPromises);
      modules.push(...batchResults.filter((m): m is Module => m !== null));

      // Rate limiting: wait before next batch
      if (i + batchSize < moduleCodes.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    logger.info(
      `NUSModsSyncService: Successfully synced ${modules.length} out of ${moduleCodes.length} modules`
    );
    return modules;
  }
}
