"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/ui/State";
import { useAuth } from "@/components/admin/AuthProvider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if ((status === "signed-out" || status === "denied") && pathname !== "/login") {
      router.replace("/login");
    }
  }, [pathname, router, status]);

  if (status === "loading" || status === "checking") {
    return <LoadingState label="Checking admin access..." />;
  }

  if (status !== "admin") {
    return <LoadingState label="Redirecting to sign in..." />;
  }

  return <>{children}</>;
}
