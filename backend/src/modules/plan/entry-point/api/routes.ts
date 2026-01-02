/**
 * Plan routes
 */

import { Router, Application } from "express";
import { PlanController } from "../../domain/plan.controller";
import { PlanService } from "../../domain/plan.service";
import { PlanRepository } from "../../domain/plan.repository";
import { authenticateUser } from "../../../../middleware/authorization";

export function definePlanRoutes(expressApp: Application) {
  const planRouter = Router();

  // Initialize dependencies
  const planRepository = new PlanRepository();
  const planService = new PlanService(planRepository);
  const planController = new PlanController(planService);

  // All routes require authentication
  planRouter.use(authenticateUser);

  // Get all plans for user
  planRouter.get("/", planController.getPlans);

  // Get active plan
  planRouter.get("/active", planController.getActivePlan);

  // Generate new plan
  planRouter.post("/generate", planController.generatePlan);

  // Get plan by ID
  planRouter.get("/:id", planController.getPlanById);

  // Create new plan
  planRouter.post("/", planController.createPlan);

  // Update plan
  planRouter.put("/:id", planController.updatePlan);

  // Delete plan
  planRouter.delete("/:id", planController.deletePlan);

  // Mount the router
  expressApp.use("/v1/plans", planRouter);
}
