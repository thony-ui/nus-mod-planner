/**
 * Query Expansion Service
 * Uses LLM to expand search queries with related terms
 */

import OpenAI from "openai";
import logger from "../../../logger";

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

      const prompt = `You are improving course module search.

First, extract the core academic or technical topic from the user's input by removing:
- Filler phrases (e.g. "I want to know", "tell me about", "can you explain")
- Politeness words, pronouns, and conversational language
- Irrelevant context or intent

Normalize the extracted topic:
- Keep only the main subject
- Convert to lowercase
- Remove trailing words like "field", "subject", "area", "topic"

Then, using ONLY the extracted topic, generate 5–8 related search terms.

Rules:
- Include synonyms and alternative phrasings
- Include common abbreviations or acronyms
- Include related technical concepts (broader or narrower)
- Return ONLY a comma-separated list
- No explanations, no labels, no extra text

Example:
User input: "I want to know more about computational biology"
Output: computational biology, bioinformatics, systems biology, genomics, proteomics, biological data analysis, sequence alignment

Now process this input:
User input: "${query}"`;

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
