"use client";
import { Suspense } from "react";
import PlannerClient from "./_components/planner-client";

export default function PlannerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <PlannerClient />
    </Suspense>
  );
}
