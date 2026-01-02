/**
 * Programme Controller
 * HTTP handlers for programme endpoints
 */

import type { Request, Response, NextFunction } from "express";
import { ProgrammeService } from "./programme.service";
import logger from "../../../logger";

export class ProgrammeController {
  constructor(private programmeService: ProgrammeService) {}

  /**
   * GET /v1/programmes
   * Get all programmes
   */
  getProgrammes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info("ProgrammeController: getProgrammes called");
      const programmes = await this.programmeService.getAllProgrammes();
      res.status(200).json(programmes);
    } catch (error) {
      logger.error(`ProgrammeController: getProgrammes error: ${error}`);
      next(error);
    }
  };

  /**
   * GET /v1/programmes/:code
   * Get programme by code
   */
  getProgrammeByCode = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { code } = req.params;
      logger.info(`ProgrammeController: getProgrammeByCode called for ${code}`);

      const programme = await this.programmeService.getProgrammeByCode(code);

      if (!programme) {
        res.status(404).json({ error: "Programme not found" });
        return;
      }

      res.status(200).json(programme);
    } catch (error) {
      logger.error(`ProgrammeController: getProgrammeByCode error: ${error}`);
      next(error);
    }
  };
}
