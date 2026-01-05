import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { Module, NTUModule } from "@/types/module";
import apiClient from "@/lib/api-client";

interface SemanticSearchResult {
  modules: Module[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Hook for semantic module search using RAG with debouncing
 * Only executes when query is non-empty and after 800ms of no typing
 */
export function useSemanticSearch(
  query: string,
  limit: number = 20,
  enabled = true
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 800); // Increased debounce to reduce API calls

    return () => clearTimeout(timer);
  }, [query]);

  return useQuery<SemanticSearchResult>({
    queryKey: ["modules", "semantic-search", debouncedQuery, limit],
    queryFn: async () => {
      const result = await apiClient.searchModulesSemantic(
        debouncedQuery,
        limit
      );
      return result;
    },
    enabled: enabled && debouncedQuery.trim().length > 2, // Require at least 3 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}

/**
 * Trigger embedding sync (admin action)
 */
export async function syncModuleEmbeddings(): Promise<{
  message: string;
  status: string;
}> {
  const result = await apiClient.syncEmbeddings();
  return result;
}

/**
 * Hook for NTU module semantic search
 */
export function useNTUSemanticSearch(
  query: string,
  limit: number = 20,
  enabled = true,
  threshold: number = 0.5
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 800); // Increased debounce to reduce API calls

    return () => clearTimeout(timer);
  }, [query]);

  return useQuery<{
    modules: NTUModule[];
    total: number;
    limit: number;
    offset: number;
  }>({
    queryKey: [
      "ntu-modules",
      "semantic-search",
      debouncedQuery,
      limit,
      threshold,
    ],
    queryFn: async () => {
      const result = await apiClient.searchNTUModulesSemantic(
        debouncedQuery,
        limit,
        threshold
      );
      return {
        modules: result.modules,
        total: result.total,
        limit,
        offset: 0,
      };
    },
    enabled: enabled && debouncedQuery.trim().length > 2, // Require at least 3 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
  });
}
