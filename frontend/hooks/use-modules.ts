import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import {
  Module,
  ModuleSearchParams,
  ModuleSearchResult,
  ModuleStats,
} from "@/types/module";

/**
 * Query keys for module-related queries
 * Follows naming convention for easy cache invalidation
 */
export const moduleKeys = {
  all: ["modules"] as const,
  lists: () => [...moduleKeys.all, "list"] as const,
  list: (params: ModuleSearchParams) =>
    [...moduleKeys.lists(), params] as const,
  details: () => [...moduleKeys.all, "detail"] as const,
  detail: (code: string) => [...moduleKeys.details(), code] as const,
  stats: () => [...moduleKeys.all, "stats"] as const,
};

/**
 * Hook to search modules
 */
export function useModuleSearch(params: ModuleSearchParams) {
  return useQuery({
    queryKey: moduleKeys.list(params),
    queryFn: () => apiClient.searchModules(params),
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to get a specific module
 */
export function useModule(code: string, enabled = true) {
  return useQuery({
    queryKey: moduleKeys.detail(code),
    queryFn: () => apiClient.getModule(code),
    enabled: enabled && !!code,
  });
}

/**
 * Hook to get module statistics
 */
export function useModuleStats() {
  return useQuery({
    queryKey: moduleKeys.stats(),
    queryFn: () => apiClient.getModuleStats(),
  });
}

/**
 * Hook to trigger module sync (admin)
 */
export function useSyncModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.syncModules(),
    onSuccess: () => {
      // Invalidate all module queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: moduleKeys.all });
    },
  });
}
