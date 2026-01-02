"use client";

/**
 * Dashboard Page - View and manage all plans
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePlans, useDeletePlan, useUpdatePlan } from "@/hooks/use-plans";
import { Plan } from "@/types/plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, Plus, Star, Search, Edit2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: plans, isLoading } = usePlans();
  const deletePlan = useDeletePlan();
  const updatePlan = useUpdatePlan();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
  const [newPlanName, setNewPlanName] = useState("");

  const handleDeleteClick = (plan: Plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (planToDelete) {
      await deletePlan.mutateAsync(planToDelete.id);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleEditClick = (plan: Plan) => {
    setPlanToEdit(plan);
    setNewPlanName(plan.name);
    setEditDialogOpen(true);
  };

  const handleRenameConfirm = async () => {
    if (planToEdit && newPlanName.trim()) {
      await updatePlan.mutateAsync({
        id: planToEdit.id,
        data: { name: newPlanName.trim() },
      });
      setEditDialogOpen(false);
      setPlanToEdit(null);
      setNewPlanName("");
    }
  };

  const handleSetActive = async (plan: Plan) => {
    await updatePlan.mutateAsync({
      id: plan.id,
      data: { isActive: true },
    });
  };

  const handleViewPlan = (planId: string) => {
    router.push(`/planner?planId=${planId}`);
  };

  const handleCreateNew = () => {
    router.push("/onboarding");
  };

  // Filter and sort plans: active first, then by search query
  const filteredAndSortedPlans = useMemo(() => {
    if (!plans) return [];

    // Filter by search query
    let filtered = plans;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = plans.filter(
        (plan) =>
          plan.name.toLowerCase().includes(query) ||
          plan.programme.toLowerCase().includes(query) ||
          plan.degreeStructure?.primaryMajor?.toLowerCase().includes(query) ||
          plan.status?.toLowerCase().includes(query)
      );
    }

    // Sort: active plans first, then by creation date (newest first)
    return filtered.sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [plans, searchQuery]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Plans</h1>
          <p className="text-muted-foreground mt-2">
            Manage your module plans and degree progress
          </p>
        </div>
        <Button onClick={handleCreateNew} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          New Plan
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search plans by name, programme, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* All Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          All Plans
          {filteredAndSortedPlans.length > 0 && (
            <span className="text-muted-foreground text-sm font-normal ml-2">
              ({filteredAndSortedPlans.length})
            </span>
          )}
        </h2>

        {!plans || plans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                No plans yet. Create your first plan to get started!
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        ) : filteredAndSortedPlans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No plans found matching &quot;{searchQuery}&quot;
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isActive={plan.isActive}
                onView={() => handleViewPlan(plan.id)}
                onDelete={() => handleDeleteClick(plan)}
                onSetActive={() => handleSetActive(plan)}
                onEdit={() => handleEditClick(plan)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{planToDelete?.name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletePlan.isPending}
            >
              {deletePlan.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Name Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Plan</DialogTitle>
            <DialogDescription>
              Enter a new name for &quot;{planToEdit?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="Plan name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRenameConfirm();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRenameConfirm}
              disabled={updatePlan.isPending || !newPlanName.trim()}
            >
              {updatePlan.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanCard({
  plan,
  isActive,
  onView,
  onDelete,
  onSetActive,
  onEdit,
}: {
  plan: Plan;
  isActive: boolean;
  onView: () => void;
  onDelete: () => void;
  onSetActive: () => void;
  onEdit: () => void;
}) {
  const totalModules = Object.values(plan.semesterPlan || {}).reduce(
    (sum, mods) => sum + mods.length,
    0
  );

  return (
    <Card className={isActive ? "border-primary shadow-md" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {plan.name}
              {isActive && (
                <Badge variant="default" className="ml-2">
                  Active
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {plan.programme}
              {plan.degreeStructure?.primaryMajor &&
                ` • ${plan.degreeStructure.primaryMajor}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Progress:</span>
            <span className="font-medium">
              Y{plan.currentYear}S{plan.currentSemester}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Planned Modules:</span>
            <span className="font-medium">{totalModules} modules</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Completed:</span>
            <span className="font-medium">
              {plan.completedModules?.length || 0} modules
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant={plan.status === "active" ? "default" : "secondary"}>
              {plan.status || "draft"}
            </Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="default" size="sm" onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        {!isActive && (
          <Button variant="outline" size="sm" onClick={onSetActive}>
            <Star className="h-4 w-4" />
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
}
