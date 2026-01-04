import type { Request, Response, NextFunction } from "express";
import { ProgrammeController } from "../domain/programme.controller";
import { ProgrammeService } from "../domain/programme.service";
import { Programme } from "../domain/programme.interface";

jest.mock("../../../logger");

describe("ProgrammeController", () => {
  let programmeController: ProgrammeController;
  let programmeService: jest.Mocked<ProgrammeService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  const mockProgramme: Programme = {
    id: "test-id",
    code: "CS1010S",
    name: "Computer Science",
    type: "programme",
    coreModules: ["CS1010S", "CS1231S"],
  };

  beforeEach(() => {
    programmeService = {
      getAllProgrammes: jest.fn(),
      getProgrammeByCode: jest.fn(),
    } as unknown as jest.Mocked<ProgrammeService>;

    programmeController = new ProgrammeController(programmeService);

    mockRequest = {
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe("getProgrammes", () => {
    it("should return all programmes", async () => {
      const programmes = [
        mockProgramme,
        {
          ...mockProgramme,
          code: "IS-BComp",
          name: "Bachelor of Computing (Information Systems)",
        },
      ];

      programmeService.getAllProgrammes.mockResolvedValue(programmes);

      await programmeController.getProgrammes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(programmeService.getAllProgrammes).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(programmes);
    });

    it("should return empty array when no programmes exist", async () => {
      programmeService.getAllProgrammes.mockResolvedValue([]);

      await programmeController.getProgrammes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });

    it("should handle errors", async () => {
      const error = new Error("Database error");
      programmeService.getAllProgrammes.mockRejectedValue(error);

      await programmeController.getProgrammes(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getProgrammeByCode", () => {
    it("should return programme by code", async () => {
      mockRequest.params = { code: "CS-BComp" };
      programmeService.getProgrammeByCode.mockResolvedValue(mockProgramme);

      await programmeController.getProgrammeByCode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(programmeService.getProgrammeByCode).toHaveBeenCalledWith(
        "CS-BComp"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockProgramme);
    });

    it("should return 404 when programme not found", async () => {
      mockRequest.params = { code: "INVALID" };
      programmeService.getProgrammeByCode.mockResolvedValue(null);

      await programmeController.getProgrammeByCode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Programme not found",
      });
    });

    it("should handle errors", async () => {
      mockRequest.params = { code: "CS-BComp" };
      const error = new Error("Database error");
      programmeService.getProgrammeByCode.mockRejectedValue(error);

      await programmeController.getProgrammeByCode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it("should handle URL-encoded programme codes", async () => {
      mockRequest.params = { code: "CS-BComp%28Hons%29" };
      const specialProgramme = {
        ...mockProgramme,
        code: "CS-BComp(Hons)",
      };

      programmeService.getProgrammeByCode.mockResolvedValue(specialProgramme);

      await programmeController.getProgrammeByCode(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(programmeService.getProgrammeByCode).toHaveBeenCalledWith(
        "CS-BComp%28Hons%29"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(specialProgramme);
    });
  });
});
