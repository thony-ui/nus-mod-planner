export const queryExpansionPrompt = (query: string) => {
  return `You are improving course module search.

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
};
