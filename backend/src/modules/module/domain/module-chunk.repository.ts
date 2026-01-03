/**
 * Module Chunks Repository
 * Handles vector search and chunk management for semantic search
 */

import supabase from "../../../lib/supabase-client";
import logger from "../../../logger";

export interface ModuleChunk {
  id: string;
  moduleCode: string;
  chunkText: string;
  chunkIndex: number;
  embedding: number[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChunkSearchResult {
  chunk: ModuleChunk;
  similarity: number;
  moduleCode: string;
}

export class ModuleChunkRepository {
  private readonly TABLE_NAME = "module_chunks";

  /**
   * Insert or update module chunks
   */
  async upsertChunks(
    moduleCode: string,
    chunks: Array<{ text: string; index: number; embedding: number[] | null }>
  ): Promise<void> {
    try {
      // Delete existing chunks for this module
      await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq("module_code", moduleCode);

      // Insert new chunks
      const records = chunks.map((chunk) => ({
        module_code: moduleCode,
        chunk_text: chunk.text,
        chunk_index: chunk.index,
        embedding: chunk.embedding ? `[${chunk.embedding.join(",")}]` : null,
      }));

      const { error } = await supabase.from(this.TABLE_NAME).insert(records);

      if (error) {
        logger.error(
          `ModuleChunkRepository: Error upserting chunks for ${moduleCode}: ${error.message}`
        );
        throw new Error(`Failed to upsert chunks: ${error.message}`);
      }

      logger.info(
        `ModuleChunkRepository: Upserted ${chunks.length} chunks for ${moduleCode}`
      );
    } catch (error) {
      logger.error(`ModuleChunkRepository: Error in upsertChunks:`, error);
      throw error;
    }
  }

  /**
   * Search for similar chunks using vector similarity
   * Returns top k most similar chunks
   */
  async searchSimilarChunks(
    queryEmbedding: number[],
    topK: number = 20
  ): Promise<ChunkSearchResult[]> {
    try {
      // Use RPC function for vector similarity search
      const { data, error } = await supabase.rpc("search_module_chunks", {
        query_embedding: `[${queryEmbedding.join(",")}]`,
        match_count: topK,
      });

      if (error) {
        logger.error(
          `ModuleChunkRepository: Error searching chunks: ${error.message}`
        );
        throw new Error(`Failed to search chunks: ${error.message}`);
      }

      const results: ChunkSearchResult[] = (data || []).map((row: any) => ({
        chunk: this.mapDbToChunk(row),
        similarity: row.similarity || 0,
        moduleCode: row.module_code,
      }));

      logger.info(
        `ModuleChunkRepository: Found ${results.length} similar chunks`
      );

      return results;
    } catch (error) {
      logger.error(
        `ModuleChunkRepository: Error in searchSimilarChunks:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get all chunks for a specific module
   */
  async getChunksByModule(moduleCode: string): Promise<ModuleChunk[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select("*")
        .eq("module_code", moduleCode)
        .order("chunk_index", { ascending: true });

      if (error) {
        logger.error(
          `ModuleChunkRepository: Error fetching chunks for ${moduleCode}: ${error.message}`
        );
        throw new Error(`Failed to fetch chunks: ${error.message}`);
      }

      return (data || []).map((row) => this.mapDbToChunk(row));
    } catch (error) {
      logger.error(`ModuleChunkRepository: Error in getChunksByModule:`, error);
      throw error;
    }
  }

  /**
   * Delete all chunks for a module
   */
  async deleteChunksByModule(moduleCode: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq("module_code", moduleCode);

      if (error) {
        logger.error(
          `ModuleChunkRepository: Error deleting chunks for ${moduleCode}: ${error.message}`
        );
        throw new Error(`Failed to delete chunks: ${error.message}`);
      }

      logger.info(`ModuleChunkRepository: Deleted chunks for ${moduleCode}`);
    } catch (error) {
      logger.error(
        `ModuleChunkRepository: Error in deleteChunksByModule:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get count of chunks
   */
  async getChunkCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.TABLE_NAME)
        .select("*", { count: "exact", head: true });

      if (error) {
        logger.error(
          `ModuleChunkRepository: Error counting chunks: ${error.message}`
        );
        throw new Error(`Failed to count chunks: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      logger.error(`ModuleChunkRepository: Error in getChunkCount:`, error);
      throw error;
    }
  }

  /**
   * Map database row to ModuleChunk interface
   */
  private mapDbToChunk(data: any): ModuleChunk {
    return {
      id: data.id,
      moduleCode: data.module_code,
      chunkText: data.chunk_text,
      chunkIndex: data.chunk_index,
      embedding: data.embedding || null,
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      updatedAt: data.updated_at ? new Date(data.updated_at) : new Date(),
    };
  }
}
