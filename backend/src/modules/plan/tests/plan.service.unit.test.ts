import { PlanService } from "../domain/plan.service";
import { PlanRepository } from "../domain/plan.repository";
import { Plan, CreatePlanDto, UpdatePlanDto } from "../domain/plan.interface";

jest.mock("../../../logger");
jest.mock("../../module/domain/module.repository");
jest.mock("../../programme/domain/programme.repository");

describe("PlanService", () => {
  let planService: PlanService;
  let planRepository: jest.Mocked<PlanRepository>;

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
    planRepository = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findActivePlan: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<PlanRepository>;

    planService = new PlanService(planRepository);
  });

  describe("getUserPlans", () => {
    it("should return all plans for a user", async () => {
      const plans = [mockPlan, { ...mockPlan, id: "plan-456" }];
      planRepository.findByUserId.mockResolvedValue(plans);

      const result = await planService.getUserPlans("user-123");

      expect(result).toEqual(plans);
      expect(planRepository.findByUserId).toHaveBeenCalledWith("user-123");
    });

    it("should return empty array when user has no plans", async () => {
      planRepository.findByUserId.mockResolvedValue([]);

      const result = await planService.getUserPlans("user-123");

      expect(result).toEqual([]);
    });
  });

  describe("getPlanById", () => {
    it("should return plan by id", async () => {
      planRepository.findById.mockResolvedValue(mockPlan);

      const result = await planService.getPlanById("plan-123", "user-123");

      expect(result).toEqual(mockPlan);
      expect(planRepository.findById).toHaveBeenCalledWith(
        "plan-123",
        "user-123"
      );
    });

    it("should return null when plan not found", async () => {
      planRepository.findById.mockResolvedValue(null);

      const result = await planService.getPlanById("invalid", "user-123");

      expect(result).toBeNull();
    });
  });

  describe("getActivePlan", () => {
    it("should return active plan for user", async () => {
      planRepository.findActivePlan.mockResolvedValue(mockPlan);

      const result = await planService.getActivePlan("user-123");

      expect(result).toEqual(mockPlan);
      expect(planRepository.findActivePlan).toHaveBeenCalledWith("user-123");
    });

    it("should return null when no active plan", async () => {
      planRepository.findActivePlan.mockResolvedValue(null);

      const result = await planService.getActivePlan("user-123");

      expect(result).toBeNull();
    });
  });

  describe("createPlan", () => {
    it("should create a new plan", async () => {
      const createDto: CreatePlanDto = {
        name: "New Plan",
        programme: "CS-BComp",
      };

      planRepository.findActivePlan.mockResolvedValue(null);
      planRepository.create.mockResolvedValue(mockPlan);

      const result = await planService.createPlan("user-123", createDto);

      expect(result).toEqual(mockPlan);
      expect(planRepository.create).toHaveBeenCalledWith("user-123", createDto);
    });

    it("should deactivate existing active plan when creating new active plan", async () => {
      const existingPlan = { ...mockPlan, id: "old-plan" };
      const createDto: CreatePlanDto = {
        name: "New Plan",
        programme: "CS-BComp",
      };

      planRepository.findActivePlan.mockResolvedValue(existingPlan);
      planRepository.update.mockResolvedValue({
        ...existingPlan,
        isActive: false,
      });
      planRepository.create.mockResolvedValue(mockPlan);

      const result = await planService.createPlan("user-123", createDto);

      expect(planRepository.update).toHaveBeenCalledWith(
        "old-plan",
        "user-123",
        { isActive: false }
      );
      expect(result).toEqual(mockPlan);
    });
  });

  describe("updatePlan", () => {
    it("should update a plan", async () => {
      const updateDto: UpdatePlanDto = {
        name: "Updated Plan",
      };

      const updatedPlan = { ...mockPlan, name: "Updated Plan" };
      planRepository.update.mockResolvedValue(updatedPlan);

      const result = await planService.updatePlan(
        "plan-123",
        "user-123",
        updateDto
      );

      expect(result).toEqual(updatedPlan);
      expect(planRepository.update).toHaveBeenCalledWith(
        "plan-123",
        "user-123",
        updateDto
      );
    });

    it("should deactivate other plans when setting one as active", async () => {
      const existingActivePlan = { ...mockPlan, id: "other-plan" };
      const updateDto: UpdatePlanDto = {
        isActive: true,
      };

      planRepository.findActivePlan.mockResolvedValue(existingActivePlan);
      planRepository.update
        .mockResolvedValueOnce({ ...existingActivePlan, isActive: false })
        .mockResolvedValueOnce({ ...mockPlan, isActive: true });

      const result = await planService.updatePlan(
        "plan-123",
        "user-123",
        updateDto
      );

      expect(planRepository.update).toHaveBeenCalledWith(
        "other-plan",
        "user-123",
        { isActive: false }
      );
      expect(planRepository.update).toHaveBeenCalledWith(
        "plan-123",
        "user-123",
        updateDto
      );
    });

    it("should not deactivate self when updating active plan", async () => {
      const updateDto: UpdatePlanDto = {
        isActive: true,
        name: "Updated",
      };

      planRepository.findActivePlan.mockResolvedValue(mockPlan);
      planRepository.update.mockResolvedValue(mockPlan);

      await planService.updatePlan("plan-123", "user-123", updateDto);

      // Update should only be called once for the plan itself
      expect(planRepository.update).toHaveBeenCalledTimes(1);
      expect(planRepository.update).toHaveBeenCalledWith(
        "plan-123",
        "user-123",
        updateDto
      );
    });
  });

  describe("deletePlan", () => {
    it("should delete a plan", async () => {
      planRepository.delete.mockResolvedValue(undefined);

      await planService.deletePlan("plan-123", "user-123");

      expect(planRepository.delete).toHaveBeenCalledWith(
        "plan-123",
        "user-123"
      );
    });
  });
});
