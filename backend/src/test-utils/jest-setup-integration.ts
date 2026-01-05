// Mock the logger module globally
import { resetPublicSchema } from "./reset-db";
beforeEach(async () => {
  await resetPublicSchema();
});

jest.mock("../logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Mock console.log to keep test output clean
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

// Restore all mocks after tests
afterAll(() => {
  jest.restoreAllMocks();
});
