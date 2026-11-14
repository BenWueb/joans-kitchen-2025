"use client";
import { useMemo } from "react";
import { authClient } from "@/lib/auth-client";
import type { UserData } from "@/lib/types";

export function useCurrentUser() {
  const { data, isPending, refetch } = authClient.useSession();

  const userData = useMemo<UserData | null>(() => {
    const u = data?.user;
    if (!u) return null;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      about: u.about,
      isAdmin: u.isAdmin === true,
    };
  }, [data?.user]);

  return { userData, loading: isPending, refetch };
}
