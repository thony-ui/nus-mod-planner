/**
 * Query Expansion Service
 * Uses LLM to expand search queries with related terms
 */

import OpenAI from "openai";
import logger from "../logger";
import { queryExpansionPrompt } from "../prompts/llm-query-expansion-prompt";

export class QueryExpansionService {
  private openai: OpenAI | null = null;
  private enabled: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    this.enabled = !!apiKey;

    if (this.enabled) {
      this.openai = new OpenAI({ apiKey });
      logger.info("QueryExpansionService: Initialized with OpenAI");
    } else {
      logger.warn(
        "QueryExpansionService: OPENAI_API_KEY not set, query expansion disabled"
      );
    }
  }

  /**
   * Expand a search query with related terms using LLM
   * Returns original query + expanded terms
   */
  async expandQuery(query: string): Promise<string[]> {
    if (!this.enabled || !this.openai) {
      // Fallback: return just the original query
      return [query];
    }

    try {
      logger.info(`QueryExpansionService: Expanding query: "${query}"`);

      const prompt = queryExpansionPrompt(query);

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const content = response.choices[0]?.message?.content?.trim();

      if (!content) {
        logger.warn("QueryExpansionService: Empty response from LLM");
        return [query];
      }

      // Parse comma-separated terms
      const expandedTerms = content
        .split(",")
        .map((term: string) => term.trim())
        .filter((term: string) => term.length > 0);

      // Ensure original query is included
      if (!expandedTerms.includes(query)) {
        expandedTerms.unshift(query);
      }

      logger.info(
        `QueryExpansionService: Expanded to ${
          expandedTerms.length
        } terms: ${expandedTerms.join(", ")}`
      );

      return expandedTerms;
    } catch (error) {
      logger.error(`QueryExpansionService: Error expanding query:`, error);
      // Fallback to original query
      return [query];
    }
  }

  /**
   * Generate embedding for search terms
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    if (!this.enabled || !this.openai) {
      return null;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      logger.error(`QueryExpansionService: Error generating embedding:`, error);
      return null;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    if (!this.enabled || !this.openai) {
      return texts.map(() => null);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: texts,
      });

      return response.data.map(
        (item: { embedding: number[] }) => item.embedding
      );
    } catch (error) {
      logger.error(
        `QueryExpansionService: Error generating batch embeddings:`,
        error
      );
      return texts.map(() => null);
    }
  }
}
