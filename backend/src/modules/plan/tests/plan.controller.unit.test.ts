import type { Request, Response, NextFunction } from "express";
import { PlanController } from "../domain/plan.controller";
import { PlanService } from "../domain/plan.service";
import { Plan, CreatePlanDto, UpdatePlanDto } from "../domain/plan.interface";

jest.mock("../../../logger");

describe("PlanController", () => {
  let planController: PlanController;
  let planService: jest.Mocked<PlanService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockPlan: Plan = {
    id: "plan-123",
    userId: "user-123",
    name: "My Study Plan",
    programme: "CS-BComp",
    isActive: false,
    status: "draft",
    currentYear: 0,
    currentSemester: 0,
    maxMcPerSemester: 0,
    minMcPerSemester: 0,
    pacingPreference: "safe",
    completedModules: [],
    warnings: [],
    semesterPlan: {},
    pinnedModules: {},
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  beforeEach(() => {
    planService = {
      getUserPlans: jest.fn(),
      getPlanById: jest.fn(),
      getActivePlan: jest.fn(),
      createPlan: jest.fn(),
      updatePlan: jest.fn(),
      deletePlan: jest.fn(),
      generatePlan: jest.fn(),
    } as unknown as jest.Mocked<PlanService>;

    planController = new PlanController(planService);

    mockRequest = {
      user: { id: "user-123" },
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe("getPlans", () => {
    it("should return all plans for user", async () => {
      const plans = [mockPlan];
      planService.getUserPlans.mockResolvedValue(plans);

      await planController.getPlans(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(planService.getUserPlans).toHaveBeenCalledWith("user-123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(plans);
    });

    it("should handle errors", async () => {
      const error = new Error("Database error");
      planService.getUserPlans.mockRejectedValue(error);

      await planController.getPlans(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getActivePlan", () => {
    it("should return active plan", async () => {
      planService.getActivePlan.mockResolvedValue(mockPlan);

      await planController.getActivePlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(planService.getActivePlan).toHaveBeenCalledWith("user-123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockPlan);
    });

    it("should return 404 when no active plan found", async () => {
      planService.getActivePlan.mockResolvedValue(null);

      await planController.getActivePlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "No active plan found",
      });
    });

    it("should handle errors", async () => {
      const error = new Error("Database error");
      planService.getActivePlan.mockRejectedValue(error);

      await planController.getActivePlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getPlanById", () => {
    it("should return plan by id", async () => {
      mockRequest.params = { id: "plan-123" };
      planService.getPlanById.mockResolvedValue(mockPlan);

      await planController.getPlanById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(planService.getPlanById).toHaveBeenCalledWith(
        "plan-123",
        "user-123"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockPlan);
    });

    it("should return 404 when plan not found", async () => {
      mockRequest.params = { id: "invalid" };
      planService.getPlanById.mockResolvedValue(null);

      await planController.getPlanById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Plan not found",
      });
    });

    it("should handle errors", async () => {
      mockRequest.params = { id: "plan-123" };
      const error = new Error("Database error");
      planService.getPlanById.mockRejectedValue(error);

      await planController.getPlanById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("createPlan", () => {
    it("should create a new plan", async () => {
      const createDto: CreatePlanDto = {
        name: "New Plan",
        programme: "CS-BComp",
      };

      mockRequest.body = createDto;
      planService.createPlan.mockResolvedValue(mockPlan);

      await planController.createPlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(planService.createPlan).toHaveBeenCalledWith(
        "user-123",
        createDto
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockPlan);
    });

    it("should handle errors", async () => {
      const error = new Error("Creation failed");
      mockRequest.body = {};
      planService.createPlan.mockRejectedValue(error);

      await planController.createPlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updatePlan", () => {
    it("should update a plan", async () => {
      const updateDto: UpdatePlanDto = {
        name: "Updated Plan",
      };

      mockRequest.params = { id: "plan-123" };
      mockRequest.body = updateDto;
      const updatedPlan = { ...mockPlan, name: "Updated Plan" };
      planService.updatePlan.mockResolvedValue(updatedPlan);

      await planController.updatePlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(planService.updatePlan).toHaveBeenCalledWith(
        "plan-123",
        "user-123",
        updateDto
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedPlan);
    });

    it("should handle errors", async () => {
      mockRequest.params = { id: "plan-123" };
      mockRequest.body = {};
      const error = new Error("Update failed");
      planService.updatePlan.mockRejectedValue(error);

      await planController.updatePlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deletePlan", () => {
    it("should delete a plan", async () => {
      mockRequest.params = { id: "plan-123" };
      planService.deletePlan.mockResolvedValue(undefined);

      await planController.deletePlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(planService.deletePlan).toHaveBeenCalledWith(
        "plan-123",
        "user-123"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });

    it("should handle errors", async () => {
      mockRequest.params = { id: "plan-123" };
      const error = new Error("Deletion failed");
      planService.deletePlan.mockRejectedValue(error);

      await planController.deletePlan(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
