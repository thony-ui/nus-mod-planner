/**
 * NTU Module Sync Service
 * Responsible for syncing NTU modules from JSON file and generating embeddings
 */

import fs from "fs/promises";
import path from "path";
import logger from "../../../logger";
import { NTUModsModule, NTUModule } from "./ntu-module.interface";

export class NTUModsSyncService {
  private readonly JSON_FILE_PATH = path.join(
    __dirname,
    "../../../../ntumods-modules.json"
  );

  /**
   * Load NTU modules from JSON file
   */
  async loadModulesFromJson(): Promise<NTUModsModule[]> {
    try {
      logger.info(
        `NTUModsSyncService: Loading modules from ${this.JSON_FILE_PATH}`
      );

      const fileContent = await fs.readFile(this.JSON_FILE_PATH, "utf-8");
      const modules: NTUModsModule[] = JSON.parse(fileContent);

      logger.info(
        `NTUModsSyncService: Successfully loaded ${modules.length} modules from JSON`
      );

      return modules;
    } catch (error) {
      logger.error(
        `NTUModsSyncService: Error loading modules from JSON: ${error}`
      );
      throw new Error(`Failed to load modules from JSON file: ${error}`);
    }
  }

  /**
   * Normalize NTUMods module data to our database schema
   */
  normalizeModule(ntuModsModule: NTUModsModule): NTUModule {
    return {
      code: ntuModsModule.code,
      title: ntuModsModule.title,
      description: ntuModsModule.description,
      url: ntuModsModule.url,
      aus: ntuModsModule.aus !== null ? ntuModsModule.aus : undefined,
      exam: ntuModsModule.exam !== null ? ntuModsModule.exam : undefined,
      gradeType:
        ntuModsModule.gradeType !== null ? ntuModsModule.gradeType : undefined,
      dept: ntuModsModule.dept !== null ? ntuModsModule.dept : undefined,
      prerequisites: ntuModsModule.prerequisites || [],
      mutuallyExclusive: ntuModsModule.mutuallyExclusive || [],
      scrapedAt: ntuModsModule.scrapedAt
        ? new Date(ntuModsModule.scrapedAt)
        : undefined,
    };
  }

  /**
   * Prepare text for embedding generation
   * Combines code, title, and description
   */
  prepareEmbeddingText(module: NTUModule): string {
    const parts = [`Module Code: ${module.code}`, `Title: ${module.title}`];

    if (module.description) {
      parts.push(`Description: ${module.description}`);
    }

    if (module.dept) {
      parts.push(`Department: ${module.dept}`);
    }

    return parts.join("\n");
  }
}
