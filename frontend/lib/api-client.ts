/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance } from "axios";
import {
  Module,
  ModuleSearchParams,
  ModuleSearchResult,
  ModuleStats,
} from "@/types/module";
import {
  Plan,
  CreatePlanDto,
  UpdatePlanDto,
  GeneratePlanDto,
  GeneratePlanResponse,
} from "@/types/plan";
import { supabase } from "./supabase-client";

export interface Programme {
  id: string;
  code: string;
  name: string;
  type: "programme" | "major" | "minor" | "specialisation";
  coreModules: string[];
  totalMcRequired?: number;
  description?: string;
}

/**
 * API Client for backend communication
 * Follows Single Responsibility Principle - handles HTTP communication only
 * Follows Open/Closed Principle - easy to extend with new endpoints
 */
class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 300000, // 5 minutes for planner operations
    });

    // Add request interceptor for auth token
    this.client.interceptors.request.use(async (config) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle common errors
        if (error.response?.status === 401) {
          // Redirect to login on unauthorized
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search modules
   */
  async searchModules(params: ModuleSearchParams): Promise<ModuleSearchResult> {
    const response = await this.client.get<ModuleSearchResult>("/v1/modules", {
      params,
    });
    return response.data;
  }

  /**
   * Get module by code
   */
  async getModule(code: string): Promise<Module> {
    const response = await this.client.get<Module>(`/v1/modules/${code}`);
    return response.data;
  }

  /**
   * Get module statistics
   */
  async getModuleStats(): Promise<ModuleStats> {
    const response = await this.client.get<ModuleStats>("/v1/modules/stats");
    return response.data;
  }

  /**
   * Trigger module sync (admin)
   */
  async syncModules(): Promise<{ message: string; status: string }> {
    const response = await this.client.post<{
      message: string;
      status: string;
    }>("/v1/modules/sync");
    return response.data;
  }

  /**
   * Semantic search modules using RAG
   */
  async searchModulesSemantic(
    query: string,
    limit: number = 20
  ): Promise<{
    modules: Module[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const response = await this.client.get<{
      modules: Module[];
      total: number;
      limit: number;
      offset: number;
    }>(`/v1/modules/search/semantic`, {
      params: { q: query, limit },
    });
    return response.data;
  }

  /**
   * Sync module embeddings (admin)
   */
  async syncEmbeddings(): Promise<{ message: string; status: string }> {
    const response = await this.client.post<{
      message: string;
      status: string;
    }>("/v1/modules/sync-embeddings");
    return response.data;
  }

  /**
   * Create or update user in backend database
   */
  async createUser(data: {
    email: string;
    name?: string;
  }): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>("/v1/users", {
      email: data.email,
      name: data.name || data.email.split("@")[0],
    });
    return response.data;
  }

  /**
   * Get current user from backend database
   */
  async getUser(): Promise<{ id: string; email: string; name: string }> {
    const response = await this.client.get<{
      id: string;
      email: string;
      name: string;
    }>("/v1/users");
    return response.data;
  }

  /**
   * Plan API methods
   */

  /**
   * Get all plans for the current user
   */
  async getPlans(): Promise<Plan[]> {
    const response = await this.client.get<Plan[]>("/v1/plans");
    return response.data;
  }

  /**
   * Get active plan for the current user
   */
  async getActivePlan(): Promise<Plan> {
    const response = await this.client.get<Plan>("/v1/plans/active");
    return response.data;
  }

  /**
   * Get plan by ID
   */
  async getPlanById(id: string): Promise<Plan> {
    const response = await this.client.get<Plan>(`/v1/plans/${id}`);
    return response.data;
  }

  /**
   * Create a new plan
   */
  async createPlan(data: CreatePlanDto): Promise<Plan> {
    const response = await this.client.post<Plan>("/v1/plans", data);
    return response.data;
  }

  /**
   * Update a plan
   */
  async updatePlan(id: string, data: UpdatePlanDto): Promise<Plan> {
    const response = await this.client.put<Plan>(`/v1/plans/${id}`, data);
    return response.data;
  }

  /**
   * Delete a plan
   */
  async deletePlan(id: string): Promise<void> {
    await this.client.delete(`/v1/plans/${id}`);
  }

  /**
   * Generate a new optimized plan
   */
  async generatePlan(data: GeneratePlanDto): Promise<GeneratePlanResponse> {
    const response = await this.client.post<GeneratePlanResponse>(
      "/v1/plans/generate",
      data
    );
    return response.data;
  }

  /**
   * Get all programmes
   */
  async getProgrammes(): Promise<Programme[]> {
    const response = await this.client.get<Programme[]>("/v1/programmes");
    return response.data;
  }
}

// Create singleton instance
const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001"
);

export default apiClient;
