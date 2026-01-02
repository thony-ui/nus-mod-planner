/**
 * Programme Interface
 * Type definitions for programme data
 */

export interface Programme {
  id: string;
  code: string;
  name: string;
  type: "programme" | "major" | "minor" | "specialisation";
  coreModules: string[];
  totalMcRequired?: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
