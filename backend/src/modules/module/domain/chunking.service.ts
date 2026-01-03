/**
 * Chunking Service
 * Splits module descriptions into semantic chunks for RAG
 */

import logger from "../../../logger";

export interface TextChunk {
  text: string;
  index: number;
}

export class ChunkingService {
  private readonly maxChunkSize: number;
  private readonly chunkOverlap: number;

  constructor(maxChunkSize: number = 50, chunkOverlap: number = 30) {
    this.maxChunkSize = maxChunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  /**
   * Chunk module description into semantic pieces
   * Uses sentence boundaries to avoid breaking mid-sentence
   */
  chunkText(text: string): TextChunk[] {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // Split into sentences (simple approach)
    const sentences = this.splitIntoSentences(text);
    const chunks: TextChunk[] = [];
    let currentChunk = "";
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];

      // Check if adding this sentence would exceed max chunk size
      if (
        currentChunk.length + sentence.length > this.maxChunkSize &&
        currentChunk.length > 0
      ) {
        // Save current chunk
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex,
        });
        chunkIndex++;

        // Start new chunk with overlap
        currentChunk = this.getOverlapText(currentChunk) + sentence;
      } else {
        // Add to current chunk
        currentChunk += (currentChunk.length > 0 ? " " : "") + sentence;
      }
    }

    // Add final chunk if not empty
    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        index: chunkIndex,
      });
    }

    logger.debug(
      `ChunkingService: Split text into ${chunks.length} chunks (max size: ${this.maxChunkSize})`
    );

    return chunks;
  }

  /**
   * Chunk module information including code, title, and description
   */
  chunkModuleDescription(
    code: string,
    title: string,
    description: string
  ): TextChunk[] {
    // Create rich context by combining module metadata
    const fullText = `Module ${code}: ${title}. ${description}`;

    return this.chunkText(fullText);
  }

  /**
   * Split text into sentences
   * Simple approach using common sentence terminators
   */
  private splitIntoSentences(text: string): string[] {
    // Replace newlines with spaces
    text = text.replace(/\n+/g, " ");

    // Split on sentence terminators
    const sentences = text.split(/([.!?]+\s+)/);

    const result: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i];
      const terminator = sentences[i + 1] || "";

      if (sentence && sentence.trim().length > 0) {
        result.push((sentence + terminator).trim());
      }
    }

    return result;
  }

  /**
   * Get the last N characters for chunk overlap
   */
  private getOverlapText(text: string): string {
    if (text.length <= this.chunkOverlap) {
      return text;
    }

    // Get last N characters, but try to break at word boundary
    const overlapText = text.slice(-this.chunkOverlap);
    const lastSpaceIndex = overlapText.indexOf(" ");

    if (lastSpaceIndex > 0) {
      return overlapText.slice(lastSpaceIndex + 1) + " ";
    }

    return overlapText + " ";
  }
}
