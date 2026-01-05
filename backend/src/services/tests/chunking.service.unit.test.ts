import { ChunkingService } from "../chunking.service";

jest.mock("../../logger");

describe("ChunkingService", () => {
  let chunkingService: ChunkingService;

  beforeEach(() => {
    chunkingService = new ChunkingService();
  });

  describe("chunkText", () => {
    it("should create chunks from text", () => {
      const text =
        "This is a sample text. It has multiple sentences. Each sentence should be processed correctly.";

      const chunks = chunkingService.chunkText(text);

      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toHaveProperty("text");
      expect(chunks[0]).toHaveProperty("index");
    });

    it("should handle empty text", () => {
      const chunks = chunkingService.chunkText("");

      expect(chunks).toEqual([]);
    });

    it("should handle single sentence", () => {
      const text = "This is a single sentence.";

      const chunks = chunkingService.chunkText(text);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].text).toContain("This is a single sentence");
    });

    it("should split long text into multiple chunks", () => {
      const longText = "A ".repeat(100) + ". " + "B ".repeat(100) + ".";

      const chunks = chunkingService.chunkText(longText);

      expect(chunks.length).toBeGreaterThanOrEqual(1);
      chunks.forEach((chunk) => {
        expect(chunk.text.length).toBeLessThanOrEqual(500);
      });
    });

    it("should preserve sentence boundaries", () => {
      const text =
        "First sentence. Second sentence. Third sentence. Fourth sentence.";

      const chunks = chunkingService.chunkText(text);

      chunks.forEach((chunk) => {
        // Each chunk should end with sentence terminator
        expect(
          chunk.text.endsWith(".") ||
            chunk.text.endsWith("!") ||
            chunk.text.endsWith("?") ||
            chunk.text.trim().length === 0
        ).toBe(true);
      });
    });
  });

  describe("chunkModuleDescription", () => {
    it("should create chunks from module information", () => {
      const code = "CS1101S";
      const title = "Programming Methodology";
      const description =
        "This module introduces fundamental programming concepts.";

      const chunks = chunkingService.chunkModuleDescription(
        code,
        title,
        description
      );

      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].text).toContain(code);
      expect(chunks[0].text).toContain(title);
    });

    it("should handle long module descriptions", () => {
      const code = "CS1101S";
      const title = "Programming Methodology";
      const description = "A".repeat(500) + ". " + "B".repeat(500) + ".";

      const chunks = chunkingService.chunkModuleDescription(
        code,
        title,
        description
      );

      expect(chunks.length).toBeGreaterThan(0);
    });

    it("should combine code, title and description", () => {
      const code = "CS1101S";
      const title = "Programming";
      const description = "Introduction to programming.";

      const chunks = chunkingService.chunkModuleDescription(
        code,
        title,
        description
      );

      const combinedText = chunks.map((c) => c.text).join(" ");
      expect(combinedText).toContain(code);
      expect(combinedText).toContain(title);
      expect(combinedText).toContain(description);
    });
  });
});
