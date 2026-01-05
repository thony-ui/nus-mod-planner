/**
 * NTU Module types based on ntumods.com scraped data
 */

// NTU Module interface matching the JSON structure
export interface NTUModsModule {
  url: string;
  code: string;
  title: string;
  description: string;
  aus: number | null;
  exam: string | null;
  gradeType: string | null;
  dept: string | null;
  prerequisites: string[];
  mutuallyExclusive: string[];
  scrapedAt: string; // ISO date string
}

// Our normalized NTU module interface for the database
export interface NTUModule {
  id?: string;
  code: string;
  title: string;
  description?: string;
  url?: string;
  aus?: number;
  exam?: string;
  gradeType?: string;
  dept?: string;
  prerequisites: string[];
  mutuallyExclusive: string[];
  scrapedAt?: Date;
  embedding?: number[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Sync result interface
export interface NTUSyncResult {
  processed: number;
  failed: number;
  errors: Array<{
    code: string;
    error: string;
  }>;
}
