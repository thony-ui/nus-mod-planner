"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import Link from "next/link";

function Header() {
  const { user, signOut } = useAuth();
  return (
    <div>
      <nav className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Mod Planner
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <Link href="/dashboard" className="text-sm hover:underline">
                  Dashboard
                </Link>
                <Link href="/modules" className="text-sm hover:underline">
                  Browse Modules
                </Link>
                <Button variant="outline" onClick={() => signOut()}>
                  Sign out
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Header;
