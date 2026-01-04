"use client";

import { useEffect, Suspense } from "react";
import { useAuth } from "@/providers/auth-provider";
import { useRouter } from "next/navigation";
import LoginClient from "./_components/login-client";

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
