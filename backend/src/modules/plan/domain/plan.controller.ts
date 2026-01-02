/**
 * Plan Controller
 * HTTP handlers for plan endpoints
 */

import type { Request, Response, NextFunction } from "express";
import { PlanService } from "./plan.service";
import {
  CreatePlanDto,
  UpdatePlanDto,
  GeneratePlanDto,
} from "./plan.interface";
import logger from "../../../logger";

export class PlanController {
  constructor(private planService: PlanService) {}

  /**
   * GET /v1/plans
   * Get all plans for authenticated user
   */
  getPlans = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      logger.info(`PlanController: getPlans called for user ${userId}`);
      const plans = await this.planService.getUserPlans(userId);
      res.status(200).json(plans);
    } catch (error) {
      logger.error(`PlanController: getPlans error: ${error}`);
      next(error);
    }
  };

  /**
   * GET /v1/plans/active
   * Get active plan for authenticated user
   */
  getActivePlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      logger.info(`PlanController: getActivePlan called for user ${userId}`);
      const plan = await this.planService.getActivePlan(userId);

      if (!plan) {
        res.status(404).json({ error: "No active plan found" });
        return;
      }

      res.status(200).json(plan);
    } catch (error) {
      logger.error(`PlanController: getActivePlan error: ${error}`);
      next(error);
    }
  };

  /**
   * GET /v1/plans/:id
   * Get specific plan by ID
   */
  getPlanById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      logger.info(`PlanController: getPlanById called for id ${id}`);

      const plan = await this.planService.getPlanById(id, userId);

      if (!plan) {
        res.status(404).json({ error: "Plan not found" });
        return;
      }

      res.status(200).json(plan);
    } catch (error) {
      logger.error(`PlanController: getPlanById error: ${error}`);
      next(error);
    }
  };

  /**
   * POST /v1/plans
   * Create a new plan
   */
  createPlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const dto: CreatePlanDto = req.body;
      logger.info(
        `PlanController: createPlan called with data: ${JSON.stringify(dto)}`
      );

      const plan = await this.planService.createPlan(userId, dto);
      res.status(201).json(plan);
    } catch (error) {
      logger.error(`PlanController: createPlan error: ${error}`);
      next(error);
    }
  };

  /**
   * PUT /v1/plans/:id
   * Update an existing plan
   */
  updatePlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const dto: UpdatePlanDto = req.body;
      logger.info(`PlanController: updatePlan called for id ${id}`);

      const plan = await this.planService.updatePlan(id, userId, dto);
      res.status(200).json(plan);
    } catch (error) {
      logger.error(`PlanController: updatePlan error: ${error}`);
      next(error);
    }
  };

  /**
   * DELETE /v1/plans/:id
   * Delete a plan
   */
  deletePlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      logger.info(`PlanController: deletePlan called for id ${id}`);

      await this.planService.deletePlan(id, userId);
      res.status(204).send();
    } catch (error) {
      logger.error(`PlanController: deletePlan error: ${error}`);
      next(error);
    }
  };

  /**
   * POST /v1/plans/generate
   * Generate a new optimized plan
   */
  generatePlan = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const dto: GeneratePlanDto = req.body;
      logger.info(
        `PlanController: generatePlan called with data: ${JSON.stringify(dto)}`
      );

      const result = await this.planService.generatePlan(userId, dto);
      res.status(201).json(result);
    } catch (error) {
      logger.error(`PlanController: generatePlan error: ${error}`);
      next(error);
    }
  };
}
