/**
 * Programme routes
 */

import { Router, Application } from "express";
import { ProgrammeController } from "../../domain/programme.controller";
import { ProgrammeService } from "../../domain/programme.service";
import { ProgrammeRepository } from "../../domain/programme.repository";

export function defineProgrammeRoutes(expressApp: Application) {
  const programmeRouter = Router();

  // Initialize dependencies
  const programmeRepository = new ProgrammeRepository();
  const programmeService = new ProgrammeService(programmeRepository);
  const programmeController = new ProgrammeController(programmeService);

  // Public routes - no auth required for reading programmes
  programmeRouter.get("/", programmeController.getProgrammes);
  programmeRouter.get("/:code", programmeController.getProgrammeByCode);

  // Mount the router
  expressApp.use("/v1/programmes", programmeRouter);
}
