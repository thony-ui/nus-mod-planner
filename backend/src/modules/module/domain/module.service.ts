import logger from "../../../logger";
import { ModuleRepository } from "./module.repository";
import { ModuleChunkRepository } from "./module-chunk.repository";
import { NUSModsSyncService } from "./nusmods-sync.service";
import { ChunkingService } from "./chunking.service";
import { QueryExpansionService } from "./query-expansion.service";
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
  private chunkRepository: ModuleChunkRepository;
  private chunkingService: ChunkingService;
  private queryExpansionService: QueryExpansionService;

  constructor(
    private moduleRepository: ModuleRepository,
    private nusModsSyncService: NUSModsSyncService
  ) {
    this.chunkRepository = new ModuleChunkRepository();
    this.chunkingService = new ChunkingService();
    this.queryExpansionService = new QueryExpansionService();
  }

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
   * Semantic search using RAG
   * 1. Expand query with LLM
   * 2. Generate embedding
   * 3. Search similar chunks
   * 4. Return unique modules ranked by relevance
   */
  async semanticSearch(
    query: string,
    limit: number = 20
  ): Promise<ModuleSearchResult> {
    try {
      logger.info(`ModuleService: Semantic search for: "${query}"`);

      // Step 1: Expand query with related terms
      const expandedTerms = await this.queryExpansionService.expandQuery(query);
      logger.info(`Expanded terms: ${expandedTerms.join(", ")}`);

      // Step 2: Generate embedding for the combined query
      const combinedQuery = expandedTerms.join(" ");
      const embedding = await this.queryExpansionService.generateEmbedding(
        combinedQuery
      );

      if (!embedding) {
        logger.warn(
          "Semantic search: No embedding generated, falling back to text search"
        );
        return await this.moduleRepository.searchModules({
          search: query,
          limit,
          offset: 0,
        });
      }

      // Step 3: Search for similar chunks
      const chunkResults = await this.chunkRepository.searchSimilarChunks(
        embedding,
        limit * 3 // Get more chunks to account for duplicates
      );

      // Step 4: Group by module and calculate average similarity
      const moduleScores = new Map<string, number>();
      const moduleChunkCounts = new Map<string, number>();

      for (const result of chunkResults) {
        const code = result.moduleCode;
        const currentScore = moduleScores.get(code) || 0;
        const currentCount = moduleChunkCounts.get(code) || 0;

        moduleScores.set(code, currentScore + result.similarity);
        moduleChunkCounts.set(code, currentCount + 1);
      }

      // Calculate average scores and sort
      const rankedModules = Array.from(moduleScores.entries())
        .map(([code, totalScore]) => ({
          code,
          avgScore: totalScore / (moduleChunkCounts.get(code) || 1),
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, limit);

      // Fetch full module details
      const moduleCodes = rankedModules.map((m) => m.code);
      const modules = await this.moduleRepository.getModulesByCodes(
        moduleCodes
      );

      // Sort modules by rank
      const sortedModules = rankedModules
        .map((ranked) => modules.find((m) => m.code === ranked.code))
        .filter((m): m is Module => m !== undefined);

      logger.info(
        `ModuleService: Semantic search returned ${sortedModules.length} modules`
      );

      return {
        modules: sortedModules,
        total: sortedModules.length,
        limit,
        offset: 0,
      };
    } catch (error) {
      logger.error(`ModuleService: Error in semantic search: ${error}`);
      // Fallback to regular search
      return await this.moduleRepository.searchModules({
        search: query,
        limit,
        offset: 0,
      });
    }
  }

  /**
   * Generate and store embeddings for all modules
   */
  async syncModuleEmbeddings(): Promise<{
    processed: number;
    failed: number;
  }> {
    try {
      logger.info("ModuleService: Starting embedding sync for all modules");

      // Get all modules
      const allModules = await this.moduleRepository.getAllModules();
      logger.info(`Found ${allModules.length} modules to process`);

      let processed = 0;
      let failed = 0;

      // Process in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < allModules.length; i += batchSize) {
        const batch = allModules.slice(i, i + batchSize);

        for (const module of batch) {
          try {
            await this.syncModuleChunks(module);
            processed++;

            if (processed % 50 === 0) {
              logger.info(
                `Processed ${processed}/${allModules.length} modules`
              );
            }
          } catch (error) {
            logger.error(`Failed to sync chunks for ${module.code}: ${error}`);
            failed++;
          }
        }

        // Small delay between batches
        if (i + batchSize < allModules.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      logger.info(
        `ModuleService: Embedding sync complete. Processed: ${processed}, Failed: ${failed}`
      );

      return { processed, failed };
    } catch (error) {
      logger.error(`ModuleService: Error syncing embeddings: ${error}`);
      throw error;
    }
  }

  /**
   * Generate and store chunks for a single module
   */
  private async syncModuleChunks(module: Module): Promise<void> {
    try {
      // Generate chunks
      const chunks = this.chunkingService.chunkModuleDescription(
        module.code,
        module.title,
        module.description || ""
      );

      if (chunks.length === 0) {
        logger.warn(`No chunks generated for module ${module.code}`);
        return;
      }

      // Generate embeddings for all chunks
      const chunkTexts = chunks.map((c) => c.text);
      const embeddings = await this.queryExpansionService.generateEmbeddings(
        chunkTexts
      );

      // Prepare chunks with embeddings
      const chunksWithEmbeddings = chunks.map((chunk, i) => ({
        text: chunk.text,
        index: chunk.index,
        embedding: embeddings[i],
      }));

      // Store in database
      await this.chunkRepository.upsertChunks(
        module.code,
        chunksWithEmbeddings
      );

      logger.debug(`Synced ${chunks.length} chunks for module ${module.code}`);
    } catch (error) {
      logger.error(`Error syncing chunks for ${module.code}: ${error}`);
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
