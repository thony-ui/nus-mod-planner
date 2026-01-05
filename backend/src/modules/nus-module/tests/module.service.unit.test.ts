import { Module, ModuleSearchParams } from "../domain/nus-module.interface";
import { ModuleRepository } from "../domain/nus-module.repository";
import { ModuleService } from "../domain/nus-module.service";
import { NUSModsSyncService } from "../domain/nusmods-sync.service";

jest.mock("../../../logger");
jest.mock("../domain/nus-module-chunk.repository");
jest.mock("../../../services/chunking.service");
jest.mock("../../../services/query-expansion.service");

describe("ModuleService", () => {
  let moduleService: ModuleService;
  let moduleRepository: jest.Mocked<ModuleRepository>;
  let nusModsSyncService: jest.Mocked<NUSModsSyncService>;

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
    moduleRepository = {
      getModuleByCode: jest.fn(),
      upsertModule: jest.fn(),
      upsertModules: jest.fn(),
      searchModules: jest.fn(),
      getModuleStats: jest.fn(),
    } as unknown as jest.Mocked<ModuleRepository>;

    nusModsSyncService = {
      fetchModuleList: jest.fn(),
      fetchModuleDetails: jest.fn(),
      normalizeModule: jest.fn(),
      syncModuleBatch: jest.fn(),
    } as unknown as jest.Mocked<NUSModsSyncService>;

    moduleService = new ModuleService(moduleRepository, nusModsSyncService);
  });

  describe("syncAllModules", () => {
    it("should successfully sync all modules", async () => {
      const moduleList = [
        { moduleCode: "CS1101S", title: "Programming Methodology" },
        { moduleCode: "CS2030S", title: "Programming Methodology II" },
      ];

      nusModsSyncService.fetchModuleList.mockResolvedValue(moduleList as any);
      nusModsSyncService.syncModuleBatch.mockResolvedValue([
        mockModule,
        { ...mockModule, moduleCode: "CS2030S" },
      ] as any);
      moduleRepository.upsertModules.mockResolvedValue(undefined as any);

      const result = await moduleService.syncAllModules();

      expect(result).toEqual({ synced: 2, failed: 0 });
      expect(nusModsSyncService.fetchModuleList).toHaveBeenCalled();
      expect(nusModsSyncService.syncModuleBatch).toHaveBeenCalledWith(
        ["CS1101S", "CS2030S"],
        10,
        1000
      );
      expect(moduleRepository.upsertModules).toHaveBeenCalled();
    });

    it("should handle sync failures", async () => {
      const moduleList = [
        { moduleCode: "CS1101S", title: "Programming Methodology" },
        { moduleCode: "CS2030S", title: "Programming Methodology II" },
      ];

      nusModsSyncService.fetchModuleList.mockResolvedValue(moduleList as any);
      nusModsSyncService.syncModuleBatch.mockResolvedValue([mockModule] as any);
      moduleRepository.upsertModules.mockResolvedValue(undefined as any);

      const result = await moduleService.syncAllModules();

      expect(result).toEqual({ synced: 1, failed: 1 });
    });

    it("should throw error when sync fails completely", async () => {
      nusModsSyncService.fetchModuleList.mockRejectedValue(
        new Error("API Error")
      );

      await expect(moduleService.syncAllModules()).rejects.toThrow(
        "Failed to sync modules"
      );
    });
  });

  describe("syncModule", () => {
    it("should successfully sync a specific module", async () => {
      const nusModsData = { moduleCode: "CS1101S", title: "Programming" };

      nusModsSyncService.fetchModuleDetails.mockResolvedValue(
        nusModsData as any
      );
      nusModsSyncService.normalizeModule.mockReturnValue(mockModule as any);
      moduleRepository.upsertModule.mockResolvedValue(mockModule);

      const result = await moduleService.syncModule("CS1101S");

      expect(result).toEqual(mockModule);
      expect(nusModsSyncService.fetchModuleDetails).toHaveBeenCalledWith(
        "CS1101S"
      );
      expect(moduleRepository.upsertModule).toHaveBeenCalledWith(mockModule);
    });

    it("should throw error when sync fails", async () => {
      nusModsSyncService.fetchModuleDetails.mockRejectedValue(
        new Error("Not found")
      );

      await expect(moduleService.syncModule("INVALID")).rejects.toThrow(
        "Failed to sync module INVALID"
      );
    });
  });

  describe("getModule", () => {
    it("should return module from database", async () => {
      moduleRepository.getModuleByCode.mockResolvedValue(mockModule);

      const result = await moduleService.getModule("CS1101S");

      expect(result).toEqual(mockModule);
      expect(moduleRepository.getModuleByCode).toHaveBeenCalledWith("CS1101S");
    });

    it("should return null when module not found", async () => {
      moduleRepository.getModuleByCode.mockResolvedValue(null);

      const result = await moduleService.getModule("INVALID");

      expect(result).toBeNull();
    });

    it("should throw error when database fails", async () => {
      moduleRepository.getModuleByCode.mockRejectedValue(new Error("DB Error"));

      await expect(moduleService.getModule("CS1101S")).rejects.toThrow(
        "DB Error"
      );
    });
  });

  describe("getModuleOrSync", () => {
    it("should return module from database if exists", async () => {
      moduleRepository.getModuleByCode.mockResolvedValue(mockModule);

      const result = await moduleService.getModuleOrSync("CS1101S");

      expect(result).toEqual(mockModule);
      expect(moduleRepository.getModuleByCode).toHaveBeenCalledWith("CS1101S");
      expect(nusModsSyncService.fetchModuleDetails).not.toHaveBeenCalled();
    });

    it("should sync module if not in database", async () => {
      moduleRepository.getModuleByCode.mockResolvedValue(null);
      nusModsSyncService.fetchModuleDetails.mockResolvedValue({} as any);
      nusModsSyncService.normalizeModule.mockReturnValue(mockModule as any);
      moduleRepository.upsertModule.mockResolvedValue(mockModule);

      const result = await moduleService.getModuleOrSync("CS1101S");

      expect(result).toEqual(mockModule);
      expect(nusModsSyncService.fetchModuleDetails).toHaveBeenCalledWith(
        "CS1101S"
      );
    });
  });

  describe("searchModules", () => {
    it("should search modules with parameters", async () => {
      const params: ModuleSearchParams = {
        search: "programming",
        limit: 10,
        offset: 0,
      };

      const searchResult = {
        modules: [mockModule],
        total: 1,
        limit: 10,
        offset: 0,
      };

      moduleRepository.searchModules.mockResolvedValue(searchResult);

      const result = await moduleService.searchModules(params);

      expect(result).toEqual(searchResult);
      expect(moduleRepository.searchModules).toHaveBeenCalledWith(params);
    });

    it("should handle empty search results", async () => {
      const params: ModuleSearchParams = {
        search: "nonexistent",
        limit: 10,
        offset: 0,
      };

      const searchResult = {
        modules: [],
        total: 0,
        limit: 10,
        offset: 0,
      };

      moduleRepository.searchModules.mockResolvedValue(searchResult);

      const result = await moduleService.searchModules(params);

      expect(result).toEqual(searchResult);
      expect(result.modules).toHaveLength(0);
    });
  });
});
