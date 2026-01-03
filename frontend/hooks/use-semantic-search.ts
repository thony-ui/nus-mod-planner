import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { Module } from "@/types/module";
import apiClient from "@/lib/api-client";

interface SemanticSearchResult {
  modules: Module[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Hook for semantic module search using RAG with debouncing
 * Only executes when query is non-empty and after 500ms of no typing
 */
export function useSemanticSearch(query: string, limit: number = 20) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

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
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
