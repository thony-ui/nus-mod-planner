import { Router, Application } from "express";
import { ModuleRepository } from "../../domain/module.repository";
import { ModuleService } from "../../domain/module.service";
import { ModuleController } from "../../domain/module.controller";
import { NUSModsSyncService } from "../../domain/nusmods-sync.service";

/**
 * Define module routes
 * Follows Dependency Injection pattern
 */
export function defineModuleRoutes(expressApp: Application) {
  const moduleRouter = Router();

  // Initialize dependencies
  const moduleRepository = new ModuleRepository();
  const nusModsSyncService = new NUSModsSyncService();
  const moduleService = new ModuleService(moduleRepository, nusModsSyncService);
  const moduleController = new ModuleController(moduleService);

  // Public routes (no authentication required for MVP)
  moduleRouter.get("/", moduleController.getModules);
  moduleRouter.get("/stats", moduleController.getModuleStats);
  moduleRouter.get("/search/semantic", moduleController.semanticSearchModules);
  moduleRouter.get("/:code", moduleController.getModuleByCode);

  // Admin routes (add authentication middleware later)
  moduleRouter.post("/sync", moduleController.syncAllModules);
  moduleRouter.post("/sync-embeddings", moduleController.syncEmbeddings);
  moduleRouter.post("/:code/sync", moduleController.syncModule);

  // Mount the router
  expressApp.use("/v1/modules", moduleRouter);
}
