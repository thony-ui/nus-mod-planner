import logger from "../../../logger";
import { ModuleRepository } from "./module.repository";
import { NUSModsSyncService } from "./nusmods-sync.service";
import {
  Module,
  ModuleSearchParams,
  ModuleSearchResult,
} from "./module.interface";

/**
 * Service layer for module operations
 * Follows Dependency Inversion Principle - depends on abstractions (repository)
 * Follows Single Responsibility Principle - orchestrates business logic
 */
export class ModuleService {
  constructor(
    private moduleRepository: ModuleRepository,
    private nusModsSyncService: NUSModsSyncService
  ) {}

  /**
   * Sync all modules from NUSMods API
   */
  async syncAllModules(): Promise<{ synced: number; failed: number }> {
    try {
      logger.info("ModuleService: Starting full module sync");

      // Fetch module list
      const moduleList = await this.nusModsSyncService.fetchModuleList();
      const moduleCodes = moduleList.map((m) => m.moduleCode);

      logger.info(`ModuleService: Found ${moduleCodes.length} modules to sync`);

      // Sync modules in batches
      const modules = await this.nusModsSyncService.syncModuleBatch(
        moduleCodes,
        10, // batch size
        1000 // delay between batches (ms)
      );

      // Save to database
      if (modules.length > 0) {
        await this.moduleRepository.upsertModules(modules);
      }

      const failed = moduleCodes.length - modules.length;

      logger.info(
        `ModuleService: Sync complete. Synced: ${modules.length}, Failed: ${failed}`
      );

      return {
        synced: modules.length,
        failed,
      };
    } catch (error) {
      logger.error(`ModuleService: Error in syncAllModules: ${error}`);
      throw new Error(`Failed to sync modules: ${error}`);
    }
  }

  /**
   * Sync a specific module from NUSMods API
   */
  async syncModule(moduleCode: string): Promise<Module> {
    try {
      logger.info(`ModuleService: Syncing module ${moduleCode}`);

      const nusModsData = await this.nusModsSyncService.fetchModuleDetails(
        moduleCode
      );
      const module = this.nusModsSyncService.normalizeModule(nusModsData);
      const savedModule = await this.moduleRepository.upsertModule(module);

      logger.info(`ModuleService: Successfully synced module ${moduleCode}`);
      return savedModule;
    } catch (error) {
      logger.error(
        `ModuleService: Error syncing module ${moduleCode}: ${error}`
      );
      throw new Error(`Failed to sync module ${moduleCode}: ${error}`);
    }
  }

  /**
   * Get a module by code (from database)
   */
  async getModule(moduleCode: string): Promise<Module | null> {
    try {
      logger.info(`ModuleService: Fetching module ${moduleCode}`);
      const module = await this.moduleRepository.getModuleByCode(moduleCode);

      if (!module) {
        logger.info(
          `ModuleService: Module ${moduleCode} not found in database`
        );
      }

      return module;
    } catch (error) {
      logger.error(
        `ModuleService: Error fetching module ${moduleCode}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Get a module by code, sync from NUSMods if not in database
   */
  async getModuleOrSync(moduleCode: string): Promise<Module | null> {
    try {
      let module = await this.getModule(moduleCode);

      if (!module) {
        logger.info(
          `ModuleService: Module ${moduleCode} not in database, syncing from NUSMods`
        );
        module = await this.syncModule(moduleCode);
      }

      return module;
    } catch (error) {
      logger.error(
        `ModuleService: Error in getModuleOrSync for ${moduleCode}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Search modules with filters
   */
  async searchModules(params: ModuleSearchParams): Promise<ModuleSearchResult> {
    try {
      logger.info(
        `ModuleService: Searching modules with params: ${JSON.stringify(
          params
        )}`
      );
      return await this.moduleRepository.searchModules(params);
    } catch (error) {
      logger.error(`ModuleService: Error searching modules: ${error}`);
      throw error;
    }
  }

  /**
   * Get module statistics
   */
  async getModuleStats(): Promise<{ totalModules: number; lastSynced?: Date }> {
    try {
      const totalModules = await this.moduleRepository.getModuleCount();

      // Get the most recently synced module to show last sync time
      const recentModule = await this.moduleRepository.searchModules({
        limit: 1,
        offset: 0,
      });

      const lastSynced =
        recentModule.modules.length > 0
          ? recentModule.modules[0].lastSyncedAt
          : undefined;

      return {
        totalModules,
        lastSynced,
      };
    } catch (error) {
      logger.error(`ModuleService: Error getting module stats: ${error}`);
      throw error;
    }
  }
}
