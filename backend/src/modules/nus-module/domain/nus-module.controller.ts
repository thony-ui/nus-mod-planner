import type { NextFunction, Request, Response } from "express";
import logger from "../../../logger";
import { ModuleService } from "./nus-module.service";
import { ModuleSearchParams } from "./nus-module.interface";

/**
 * Controller for module endpoints
 * Follows Single Responsibility Principle - handles HTTP concerns only
 */
export class ModuleController {
  constructor(private moduleService: ModuleService) {}

  /**
   * GET /modules - Search/list modules
   */
  getModules = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const params: ModuleSearchParams = {
        search: req.query.search as string,
        faculty: req.query.faculty as string,
        semester: req.query.semester as string,
        level: req.query.level as string,
        minMcs: req.query.minMcs
          ? parseInt(req.query.minMcs as string)
          : undefined,
        maxMcs: req.query.maxMcs
          ? parseInt(req.query.maxMcs as string)
          : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      logger.info(
        `ModuleController: getModules called with params: ${JSON.stringify(
          params
        )}`
      );

      const result = await this.moduleService.searchModules(params);
      res.status(200).json(result);
    } catch (error) {
      logger.error(`ModuleController: Error in getModules: ${error}`);
      next(error);
    }
  };

  /**
   * GET /modules/:code - Get specific module details
   */
  getModuleByCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { code } = req.params;

      logger.info(`ModuleController: getModuleByCode called for ${code}`);

      const module = await this.moduleService.getModuleOrSync(code);

      if (!module) {
        res.status(404).json({
          error: `Module ${code} not found`,
        });
        return;
      }

      res.status(200).json(module);
    } catch (error) {
      logger.error(`ModuleController: Error in getModuleByCode: ${error}`);
      next(error);
    }
  };

  /**
   * POST /admin/modules/sync - Trigger full module sync (admin only)
   */
  syncAllModules = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info("ModuleController: syncAllModules triggered");

      // Start sync in background (don't wait for completion)
      this.moduleService
        .syncAllModules()
        .then((result) => {
          logger.info(
            `ModuleController: Background sync completed. Synced: ${result.synced}, Failed: ${result.failed}`
          );
        })
        .catch((error) => {
          logger.error(`ModuleController: Background sync failed: ${error}`);
        });

      res.status(202).json({
        message: "Module sync started in background",
        status: "processing",
      });
    } catch (error) {
      logger.error(`ModuleController: Error in syncAllModules: ${error}`);
      next(error);
    }
  };

  /**
   * POST /admin/modules/:code/sync - Sync specific module (admin only)
   */
  syncModule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { code } = req.params;

      logger.info(`ModuleController: syncModule triggered for ${code}`);

      const module = await this.moduleService.syncModule(code);

      res.status(200).json({
        message: `Module ${code} synced successfully`,
        module,
      });
    } catch (error) {
      logger.error(`ModuleController: Error in syncModule: ${error}`);
      next(error);
    }
  };

  /**
   * GET /modules/stats - Get module statistics
   */
  getModuleStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info("ModuleController: getModuleStats called");

      const stats = await this.moduleService.getModuleStats();

      res.status(200).json(stats);
    } catch (error) {
      logger.error(`ModuleController: Error in getModuleStats: ${error}`);
      next(error);
    }
  };

  /**
   * GET /modules/search/semantic - Semantic search with RAG
   */
  semanticSearchModules = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      if (!query || query.trim().length === 0) {
        res.status(400).json({
          error: "Query parameter 'q' is required",
        });
        return;
      }

      logger.info(
        `ModuleController: semanticSearchModules called with query: "${query}"`
      );

      const result = await this.moduleService.semanticSearch(query, limit);
      res.status(200).json(result);
    } catch (error) {
      logger.error(
        `ModuleController: Error in semanticSearchModules: ${error}`
      );
      next(error);
    }
  };

  /**
   * POST /modules/sync-embeddings - Generate embeddings for all modules (admin only)
   */
  syncEmbeddings = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info("ModuleController: syncEmbeddings triggered");

      // Start sync in background (don't wait for completion)
      this.moduleService
        .syncModuleEmbeddings()
        .then((result) => {
          logger.info(
            `ModuleController: Embedding sync completed. Processed: ${result.processed}, Failed: ${result.failed}`
          );
        })
        .catch((error) => {
          logger.error(`ModuleController: Embedding sync failed: ${error}`);
        });

      res.status(202).json({
        message: "Embedding sync started in background",
        status: "processing",
      });
    } catch (error) {
      logger.error(`ModuleController: Error in syncEmbeddings: ${error}`);
      next(error);
    }
  };
}
