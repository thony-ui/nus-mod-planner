import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import {
  ModuleSearchParams,
  NTUModuleSearchParams,
  University,
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

export const ntuModuleKeys = {
  all: ["ntu-modules"] as const,
  lists: () => [...ntuModuleKeys.all, "list"] as const,
  list: (params: NTUModuleSearchParams) =>
    [...ntuModuleKeys.lists(), params] as const,
  details: () => [...ntuModuleKeys.all, "detail"] as const,
  detail: (code: string) => [...ntuModuleKeys.details(), code] as const,
};

/**
 * Hook to search modules
 */
export function useModuleSearch(params: ModuleSearchParams, enabled = true) {
  return useQuery({
    queryKey: moduleKeys.list(params),
    queryFn: () => apiClient.searchModules(params),
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
    enabled,
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

/**
 * NTU Module Hooks
 */

/**
 * Hook to search NTU modules
 */
export function useNTUModuleSearch(
  params: {
    search?: string;
    dept?: string;
    limit?: number;
    offset?: number;
  },
  enabled = true
) {
  return useQuery({
    queryKey: ntuModuleKeys.list(params),
    queryFn: () => apiClient.searchNTUModules(params),
    placeholderData: (previousData) => previousData,
    enabled,
  });
}

/**
 * Hook to get a specific NTU module
 */
export function useNTUModule(code: string, enabled = true) {
  return useQuery({
    queryKey: ntuModuleKeys.detail(code),
    queryFn: () => apiClient.getNTUModule(code),
    enabled: enabled && !!code,
  });
}

/**
 * Combined hook for module search that works with both universities
 */
export function useUniversalModuleSearch(
  university: University,
  params: ModuleSearchParams | NTUModuleSearchParams
) {
  const nusSearch = useModuleSearch(params as ModuleSearchParams);
  const ntuSearch = useNTUModuleSearch(params as NTUModuleSearchParams);

  if (university === "NTU") {
    return {
      data: ntuSearch.data
        ? {
            modules: ntuSearch.data.data,
            total: ntuSearch.data.count,
            limit: params.limit || 20,
            offset: params.offset || 0,
          }
        : undefined,
      isLoading: ntuSearch.isLoading,
      error: ntuSearch.error,
    };
  }

  return nusSearch;
}

/**
 * Combined hook for getting a module by code from either university
 */
export function useUniversalModule(
  university: University,
  code: string,
  enabled = true
) {
  const nusModule = useModule(code, enabled && university === "NUS");
  const ntuModule = useNTUModule(code, enabled && university === "NTU");

  return university === "NTU" ? ntuModule : nusModule;
}
