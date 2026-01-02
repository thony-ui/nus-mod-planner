/**
 * React Query hooks for plan operations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import {
  Plan,
  CreatePlanDto,
  UpdatePlanDto,
  GeneratePlanDto,
  GeneratePlanResponse,
} from "@/types/plan";

/**
 * Get all plans for the current user
 */
export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: () => apiClient.getPlans(),
  });
}

/**
 * Get active plan for the current user
 */
export function useActivePlan() {
  return useQuery({
    queryKey: ["plans", "active"],
    queryFn: () => apiClient.getActivePlan(),
    retry: false, // Don't retry if no active plan
  });
}

/**
 * Get plan by ID
 */
export function usePlan(id: string) {
  return useQuery({
    queryKey: ["plans", id],
    queryFn: () => apiClient.getPlanById(id),
    enabled: !!id,
  });
}

/**
 * Create a new plan
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanDto) => apiClient.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

/**
 * Update a plan
 */
export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlanDto }) =>
      apiClient.updatePlan(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["plans", "active"] });
    },
  });
}

/**
 * Delete a plan
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans", "active"] });
    },
  });
}

/**
 * Generate a new optimized plan
 */
export function useGeneratePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GeneratePlanDto) => apiClient.generatePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans", "active"] });
    },
  });
}
