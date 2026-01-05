/**
 * NTU Module Service
 * Business logic for NTU module operations including embedding sync
 */

import logger from "../../../logger";
import { NTUModule, NTUSyncResult } from "./ntu-module.interface";
import { NTUModuleRepository } from "./ntu-module.repository";
import { NTUModsSyncService } from "./ntu-sync.service";
import { NTUModuleChunkRepository } from "./ntu-module-chunk.repository";
import { ChunkingService } from "../../../services/chunking.service";
import { QueryExpansionService } from "../../../services/query-expansion.service";

export class NTUModuleService {
  private repository: NTUModuleRepository;
  private syncService: NTUModsSyncService;
  private chunkRepository: NTUModuleChunkRepository;
  private chunkingService: ChunkingService;
  private queryExpansionService: QueryExpansionService;

  constructor() {
    this.repository = new NTUModuleRepository();
    this.syncService = new NTUModsSyncService();
    this.chunkRepository = new NTUModuleChunkRepository();
    this.chunkingService = new ChunkingService();
    this.queryExpansionService = new QueryExpansionService();
  }

  /**
   * Sync all NTU modules from JSON file and generate embeddings
   */
  async syncModulesWithEmbeddings(): Promise<NTUSyncResult> {
    const result: NTUSyncResult = {
      processed: 0,
      failed: 0,
      errors: [],
    };

    try {
      logger.info("NTUModuleService: Starting module sync with embeddings");

      // Load modules from JSON
      const rawModules = await this.syncService.loadModulesFromJson();
      logger.info(
        `NTUModuleService: Loaded ${rawModules.length} modules from JSON`
      );

      // Process modules in batches to avoid rate limits
      const BATCH_SIZE = 10;
      for (let i = 0; i < rawModules.length; i += BATCH_SIZE) {
        const batch = rawModules.slice(i, i + BATCH_SIZE);
        logger.info(
          `NTUModuleService: Processing batch ${
            Math.floor(i / BATCH_SIZE) + 1
          }/${Math.ceil(rawModules.length / BATCH_SIZE)}`
        );

        await Promise.all(
          batch.map(async (rawModule) => {
            try {
              // Normalize module
              const module = this.syncService.normalizeModule(rawModule);

              // Save module to database (without embedding on module itself)
              await this.repository.upsertModule(module);

              // Generate and store chunks with embeddings
              await this.syncModuleChunks(module);

              result.processed++;
              logger.debug(`NTUModuleService: Processed module ${module.code}`);
            } catch (error) {
              result.failed++;
              result.errors.push({
                code: rawModule.code,
                error: error instanceof Error ? error.message : String(error),
              });
              logger.error(
                `NTUModuleService: Failed to process module ${rawModule.code}: ${error}`
              );
            }
          })
        );

        // Add delay between batches to respect rate limits
        if (i + BATCH_SIZE < rawModules.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      logger.info(
        `NTUModuleService: Sync completed. Processed: ${result.processed}, Failed: ${result.failed}`
      );

      return result;
    } catch (error) {
      logger.error(
        `NTUModuleService: Error in syncModulesWithEmbeddings: ${error}`
      );
      throw error;
    }
  }

  /**
   * Generate and store chunks for a single NTU module
   */
  private async syncModuleChunks(module: NTUModule): Promise<void> {
    try {
      // Generate chunks
      const chunks = this.chunkingService.chunkModuleDescription(
        module.code,
        module.title,
        module.description || ""
      );

      if (chunks.length === 0) {
        logger.warn(`No chunks generated for NTU module ${module.code}`);
        return;
      }

      // Generate embeddings for all chunks
      const chunkTexts = chunks.map((c) => c.text);
      const embeddings = await this.queryExpansionService.generateEmbeddings(
        chunkTexts
      );

      // Filter out any null embeddings
      const validEmbeddings = embeddings.filter(
        (e): e is number[] => e !== null
      );

      if (validEmbeddings.length !== embeddings.length) {
        logger.warn(
          `NTUModuleService: Some embeddings failed for module ${module.code}`
        );
      }

      if (validEmbeddings.length === 0) {
        logger.error(
          `NTUModuleService: No valid embeddings generated for module ${module.code}`
        );
        return;
      }

      // Prepare chunks with embeddings
      const chunksWithEmbeddings = chunks
        .map((chunk, i) => ({
          text: chunk.text,
          index: chunk.index,
          embedding: embeddings[i],
        }))
        .filter(
          (
            chunk
          ): chunk is { text: string; index: number; embedding: number[] } =>
            chunk.embedding !== null
        );

      // Store in database
      await this.chunkRepository.upsertChunks(
        module.code,
        chunksWithEmbeddings
      );

      logger.debug(
        `Synced ${chunks.length} chunks for NTU module ${module.code}`
      );
    } catch (error) {
      logger.error(
        `Error syncing chunks for NTU module ${module.code}: ${error}`
      );
      throw error;
    }
  }

  /**
   * Search modules by semantic similarity using chunks with query expansion
   */
  async searchModules(
    query: string,
    matchThreshold: number = 0.5,
    matchCount: number = 10
  ) {
    try {
      logger.info(`NTUModuleService: Semantic search for: "${query}"`);

      // Step 1: Expand query with related terms
      const expandedTerms = await this.queryExpansionService.expandQuery(query);
      logger.info(
        `NTUModuleService: Expanded terms: ${expandedTerms.join(", ")}`
      );

      // Step 2: Generate embedding for the combined query
      const combinedQuery = expandedTerms.join(" ");
      const queryEmbedding = await this.queryExpansionService.generateEmbedding(
        combinedQuery
      );

      if (!queryEmbedding) {
        logger.warn(
          "NTUModuleService: No embedding generated, falling back to basic search"
        );
        // Fallback to traditional search
        return await this.repository.searchModules({
          search: query,
          limit: matchCount,
          offset: 0,
        });
      }

      // Step 3: Search for similar chunks
      const chunkResults = await this.chunkRepository.searchSimilarChunks(
        queryEmbedding,
        matchCount * 3 // Get more chunks to account for multiple chunks per module
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

      // Calculate average scores and filter by threshold
      const rankedModules = Array.from(moduleScores.entries())
        .map(([code, totalScore]) => ({
          code,
          avgScore: totalScore / (moduleChunkCounts.get(code) || 1),
        }))
        .filter((m) => m.avgScore >= matchThreshold)
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, matchCount);

      // Fetch full module details
      const moduleCodes = rankedModules.map((m) => m.code);
      const modules = await this.repository.getModulesByCodes(moduleCodes);

      // Sort modules by rank
      const sortedModules = rankedModules
        .map((ranked) => modules.find((m) => m.code === ranked.code))
        .filter((m): m is NTUModule => m !== undefined);

      logger.info(
        `NTUModuleService: Found ${sortedModules.length} modules for query: "${query}"`
      );

      return { modules: sortedModules, total: sortedModules.length };
    } catch (error) {
      logger.error(`NTUModuleService: Error in searchModules: ${error}`);
      throw error;
    }
  }

  /**
   * Get module by code
   */
  async getModuleByCode(code: string): Promise<NTUModule | null> {
    try {
      return await this.repository.getByCode(code);
    } catch (error) {
      logger.error(`NTUModuleService: Error in getModuleByCode: ${error}`);
      throw error;
    }
  }

  /**
   * Search modules with pagination
   */
  async searchModulesWithPagination(params: {
    search?: string;
    dept?: string;
    gradeType?: string;
    minAus?: number;
    maxAus?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: NTUModule[]; count: number }> {
    return this.repository.searchModules(params);
  }

  /**
   * Get all modules
   */
  async getAllModules(): Promise<NTUModule[]> {
    try {
      return await this.repository.getAllModules();
    } catch (error) {
      logger.error(`NTUModuleService: Error in getAllModules: ${error}`);
      throw error;
    }
  }
}
