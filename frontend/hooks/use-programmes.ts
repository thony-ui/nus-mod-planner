/**
 * React Query hooks for programme operations
 */

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

/**
 * Get all programmes
 */
export function useProgrammes() {
  return useQuery({
    queryKey: ["programmes"],
    queryFn: () => apiClient.getProgrammes(),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour since programmes don't change often
  });
}
