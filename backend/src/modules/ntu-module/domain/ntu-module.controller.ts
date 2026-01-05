/**
 * NTU Module Controller
 * Handles HTTP requests for NTU module operations
 */

import { Request, Response } from "express";
import logger from "../../../logger";
import { NTUModuleService } from "./ntu-module.service";

export class NTUModuleController {
  private service: NTUModuleService;

  constructor() {
    this.service = new NTUModuleService();
  }

  /**
   * POST /ntu-modules/sync - Sync all NTU modules with embeddings
   */
  syncModules = async (req: Request, res: Response) => {
    try {
      logger.info("NTUModuleController: Sync request received");

      // Run sync in background
      this.service
        .syncModulesWithEmbeddings()
        .then((result) => {
          logger.info(
            `NTUModuleController: Sync completed. Processed: ${result.processed}, Failed: ${result.failed}`
          );
          if (result.errors.length > 0) {
            logger.error(
              `NTUModuleController: Sync errors: ${JSON.stringify(
                result.errors.slice(0, 10)
              )}`
            );
          }
        })
        .catch((error) => {
          logger.error(`NTUModuleController: Sync failed: ${error}`);
        });

      res.status(202).json({
        success: true,
        message: "NTU module sync started in background",
      });
    } catch (error) {
      logger.error(`NTUModuleController: Error in syncModules: ${error}`);
      res.status(500).json({
        success: false,
        message: "Failed to start sync",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * GET /ntu-modules/search - Search modules by semantic similarity
   */
  searchModules = async (req: Request, res: Response) => {
    try {
      const { query, threshold = 0.5, limit = 10 } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({
          success: false,
          message: "Query parameter is required",
        });
      }

      logger.info(`NTUModuleController: Search request for query: "${query}"`);

      const results = await this.service.searchModules(
        query,
        Number(threshold),
        Number(limit)
      );

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      logger.error(`NTUModuleController: Error in searchModules: ${error}`);
      res.status(500).json({
        success: false,
        message: "Failed to search modules",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * GET /ntu-modules/:code - Get module by code
   */
  getModuleByCode = async (req: Request, res: Response) => {
    try {
      const { code } = req.params;

      logger.info(`NTUModuleController: Get module request for code: ${code}`);

      const module = await this.service.getModuleByCode(code);

      if (!module) {
        return res.status(404).json({
          success: false,
          message: `Module ${code} not found`,
        });
      }

      res.status(200).json({
        success: true,
        data: module,
      });
    } catch (error) {
      logger.error(`NTUModuleController: Error in getModuleByCode: ${error}`);
      res.status(500).json({
        success: false,
        message: "Failed to get module",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  /**
   * GET /ntu-modules - Search modules with pagination
   */
  getAllModules = async (req: Request, res: Response) => {
    try {
      const {
        search,
        dept,
        gradeType,
        minAus,
        maxAus,
        limit = 20,
        offset = 0,
      } = req.query;

      logger.info(
        `NTUModuleController: Search modules request - search: "${search}", dept: "${dept}", gradeType: "${gradeType}", minAus: ${minAus}, maxAus: ${maxAus}, limit: ${limit}, offset: ${offset}`
      );

      const result = await this.service.searchModulesWithPagination({
        search: search as string | undefined,
        dept: dept as string | undefined,
        gradeType: gradeType as string | undefined,
        minAus: minAus ? Number(minAus) : undefined,
        maxAus: maxAus ? Number(maxAus) : undefined,
        limit: Number(limit),
        offset: Number(offset),
      });

      res.status(200).json({
        success: true,
        data: result.data,
        count: result.count,
      });
    } catch (error) {
      logger.error(`NTUModuleController: Error in getAllModules: ${error}`);
      res.status(500).json({
        success: false,
        message: "Failed to get modules",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
