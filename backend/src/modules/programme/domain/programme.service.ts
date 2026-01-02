/**
 * Programme Service
 * Business logic for programme operations
 */

import { ProgrammeRepository } from "./programme.repository";
import { Programme } from "./programme.interface";

export class ProgrammeService {
  constructor(private programmeRepository: ProgrammeRepository) {}

  async getAllProgrammes(): Promise<Programme[]> {
    return this.programmeRepository.getAllProgrammes();
  }

  async getProgrammeByCode(code: string): Promise<Programme | null> {
    return this.programmeRepository.getProgrammeByCode(code);
  }
}
