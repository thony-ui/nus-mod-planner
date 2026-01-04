import type { Request, Response, NextFunction } from "express";
import { ModuleController } from "../domain/module.controller";
import { ModuleService } from "../domain/module.service";
import { Module } from "../domain/module.interface";

jest.mock("../../../logger");

describe("ModuleController", () => {
  let moduleController: ModuleController;
  let moduleService: jest.Mocked<ModuleService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockModule: Module = {
    code: "CS1101S",
    title: "Programming Methodology",
    description: "Introduction to programming",
    mcs: 4,
    department: "Computer Science",
    faculty: "School of Computing",
    workload: [2, 1, 1, 3, 3],
    prereqText: "None",
    preclusionText: "None",
    rawData: [],
    semestersOffered: ["1"],
  };

  beforeEach(() => {
    moduleService = {
      searchModules: jest.fn(),
      getModuleOrSync: jest.fn(),
      syncAllModules: jest.fn(),
      syncModule: jest.fn(),
      syncEmbeddings: jest.fn(),
      semanticSearchModules: jest.fn(),
      getModuleStats: jest.fn(),
    } as unknown as jest.Mocked<ModuleService>;

    moduleController = new ModuleController(moduleService);

    mockRequest = {
      query: {},
      params: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe("getModules", () => {
    it("should return modules with search results", async () => {
      const searchResult = {
        modules: [mockModule],
        total: 1,
        limit: 50,
        offset: 0,
      };

      mockRequest.query = {
        search: "programming",
        limit: "50",
        offset: "0",
      };

      moduleService.searchModules.mockResolvedValue(searchResult);

      await moduleController.getModules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(moduleService.searchModules).toHaveBeenCalledWith({
        search: "programming",
        faculty: undefined,
        semester: undefined,
        level: undefined,
        minMcs: undefined,
        maxMcs: undefined,
        limit: 50,
        offset: 0,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(searchResult);
    });

    it("should handle filters correctly", async () => {
      mockRequest.query = {
        faculty: "Computing",
        semester: "1",
        level: "1000",
        minMcs: "4",
        maxMcs: "8",
      };

      const searchResult = {
        modules: [],
        total: 0,
        limit: 50,
        offset: 0,
      };

      moduleService.searchModules.mockResolvedValue(searchResult);

      await moduleController.getModules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(moduleService.searchModules).toHaveBeenCalledWith({
        search: undefined,
        faculty: "Computing",
        semester: "1",
        level: "1000",
        minMcs: 4,
        maxMcs: 8,
        limit: 50,
        offset: 0,
      });
    });

    it("should handle errors", async () => {
      const error = new Error("Search failed");
      moduleService.searchModules.mockRejectedValue(error);

      await moduleController.getModules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getModuleByCode", () => {
    it("should return module by code", async () => {
      mockRequest.params = { code: "CS1101S" };
      moduleService.getModuleOrSync.mockResolvedValue(mockModule);

      await moduleController.getModuleByCode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(moduleService.getModuleOrSync).toHaveBeenCalledWith("CS1101S");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockModule);
    });

    it("should return 404 when module not found", async () => {
      mockRequest.params = { code: "INVALID" };
      moduleService.getModuleOrSync.mockResolvedValue(null);

      await moduleController.getModuleByCode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Module INVALID not found",
      });
    });

    it("should handle errors", async () => {
      mockRequest.params = { code: "CS1101S" };
      const error = new Error("Database error");
      moduleService.getModuleOrSync.mockRejectedValue(error);

      await moduleController.getModuleByCode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("syncAllModules", () => {
    it("should trigger sync and return accepted status", async () => {
      moduleService.syncAllModules.mockResolvedValue({
        synced: 100,
        failed: 5,
      });

      await moduleController.syncAllModules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(202);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Module sync started in background",
        status: "processing",
      });
    });

    it("should handle sync trigger errors", async () => {
      const error = new Error("Trigger failed");
      moduleService.syncAllModules.mockImplementation(() => {
        throw error;
      });

      await moduleController.syncAllModules(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("syncModule", () => {
    it("should sync specific module", async () => {
      mockRequest.params = { code: "CS1101S" };
      moduleService.syncModule.mockResolvedValue(mockModule);

      await moduleController.syncModule(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(moduleService.syncModule).toHaveBeenCalledWith("CS1101S");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Module CS1101S synced successfully",
        module: mockModule,
      });
    });
  });

  describe("getModuleStats", () => {
    it("should return module statistics", async () => {
      const stats = {
        totalModules: 1000,
        byFaculty: {
          Computing: 200,
          Engineering: 300,
        },
        byLevel: {
          1000: 150,
          2000: 250,
        },
      };

      moduleService.getModuleStats.mockResolvedValue(stats);

      await moduleController.getModuleStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(moduleService.getModuleStats).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(stats);
    });

    it("should handle errors", async () => {
      const error = new Error("Stats error");
      moduleService.getModuleStats.mockRejectedValue(error);

      await moduleController.getModuleStats(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
