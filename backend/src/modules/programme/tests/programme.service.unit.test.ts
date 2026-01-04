import { ProgrammeService } from "../domain/programme.service";
import { ProgrammeRepository } from "../domain/programme.repository";
import { Programme } from "../domain/programme.interface";

jest.mock("../../../logger");

describe("ProgrammeService", () => {
  let programmeService: ProgrammeService;
  let programmeRepository: jest.Mocked<ProgrammeRepository>;

  const mockProgramme: Programme = {
    id: "test-id",
    code: "CS1010S",
    name: "Computer Science",
    type: "programme",
    coreModules: ["CS1010S", "CS1231S"],
  };

  beforeEach(() => {
    programmeRepository = {
      getAllProgrammes: jest.fn(),
      getProgrammeByCode: jest.fn(),
    } as unknown as jest.Mocked<ProgrammeRepository>;

    programmeService = new ProgrammeService(programmeRepository);
  });

  describe("getAllProgrammes", () => {
    it("should return all programmes", async () => {
      const programmes = [
        mockProgramme,
        {
          ...mockProgramme,
          code: "IS-BComp",
          name: "Bachelor of Computing (Information Systems)",
        },
      ];

      programmeRepository.getAllProgrammes.mockResolvedValue(programmes);

      const result = await programmeService.getAllProgrammes();

      expect(result).toEqual(programmes);
      expect(programmeRepository.getAllProgrammes).toHaveBeenCalled();
    });

    it("should return empty array when no programmes exist", async () => {
      programmeRepository.getAllProgrammes.mockResolvedValue([]);

      const result = await programmeService.getAllProgrammes();

      expect(result).toEqual([]);
    });

    it("should propagate errors from repository", async () => {
      const error = new Error("Database error");
      programmeRepository.getAllProgrammes.mockRejectedValue(error);

      await expect(programmeService.getAllProgrammes()).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getProgrammeByCode", () => {
    it("should return programme by code", async () => {
      programmeRepository.getProgrammeByCode.mockResolvedValue(mockProgramme);

      const result = await programmeService.getProgrammeByCode("CS-BComp");

      expect(result).toEqual(mockProgramme);
      expect(programmeRepository.getProgrammeByCode).toHaveBeenCalledWith(
        "CS-BComp"
      );
    });

    it("should return null when programme not found", async () => {
      programmeRepository.getProgrammeByCode.mockResolvedValue(null);

      const result = await programmeService.getProgrammeByCode("INVALID");

      expect(result).toBeNull();
      expect(programmeRepository.getProgrammeByCode).toHaveBeenCalledWith(
        "INVALID"
      );
    });

    it("should propagate errors from repository", async () => {
      const error = new Error("Database error");
      programmeRepository.getProgrammeByCode.mockRejectedValue(error);

      await expect(
        programmeService.getProgrammeByCode("CS-BComp")
      ).rejects.toThrow("Database error");
    });

    it("should handle special characters in programme code", async () => {
      const specialCode = "CS-BComp(Hons)";
      programmeRepository.getProgrammeByCode.mockResolvedValue({
        ...mockProgramme,
        code: specialCode,
      });

      const result = await programmeService.getProgrammeByCode(specialCode);

      expect(result?.code).toBe(specialCode);
      expect(programmeRepository.getProgrammeByCode).toHaveBeenCalledWith(
        specialCode
      );
    });
  });
});
