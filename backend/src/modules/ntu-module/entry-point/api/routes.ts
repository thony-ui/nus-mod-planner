/**
 * NTU Module API Routes
 */

import { Router, Application } from "express";
import { NTUModuleController } from "../../domain/ntu-module.controller";

export function defineNTUModuleRoutes(expressApp: Application) {
  const ntuModuleRouter = Router();
  const ntuModuleController = new NTUModuleController();

  /**
   * @route POST /api/ntu-modules/sync
   * @desc Sync all NTU modules from JSON file with embeddings
   * @access Public (should be protected in production)
   */
  // ntuModuleRouter.post("/sync", ntuModuleController.syncModules);

  /**
   * @route GET /api/ntu-modules/search
   * @desc Search modules by semantic similarity
   * @query query - Search query string
   * @query threshold - Similarity threshold (default: 0.5)
   * @query limit - Number of results (default: 10)
   * @access Public
   */
  ntuModuleRouter.get("/search", ntuModuleController.searchModules);

  /**
   * @route GET /api/ntu-modules/:code
   * @desc Get module by code
   * @access Public
   */
  ntuModuleRouter.get("/:code", ntuModuleController.getModuleByCode);

  /**
   * @route GET /api/ntu-modules
   * @desc Get all NTU modules
   * @access Public
   */
  ntuModuleRouter.get("/", ntuModuleController.getAllModules);

  // Mount the router
  expressApp.use("/v1/ntu-modules", ntuModuleRouter);
}
