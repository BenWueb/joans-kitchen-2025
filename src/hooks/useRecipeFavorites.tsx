"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { getUserFriendlyErrorMessage, logError } from "@/lib/errors";

interface UseRecipeFavoritesProps {
  recipeId: string;
}

export function useRecipeFavorites({ recipeId }: UseRecipeFavoritesProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const currentUserId = session?.user?.id ?? "";
  const [isFavorited, setIsFavorited] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(true);
  const [error, setError] = useState("");

  // Check if this recipe is in the user's favorites
  useEffect(() => {
    if (isPending) return;

    if (!currentUserId) {
      setIsFavorited(false);
      setCheckingFavorite(false);
      return;
    }

    let cancelled = false;
    api<{ favorited: boolean }>(`/api/recipes/${recipeId}/favorite`)
      .then((res) => {
        if (!cancelled) setIsFavorited(res.favorited);
      })
      .catch((err) => logError("useRecipeFavorites - check favorite", err))
      .finally(() => {
        if (!cancelled) setCheckingFavorite(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recipeId, currentUserId, isPending]);

  // Toggle favorite - add/remove recipe from the user's favorites
  const handleToggleFavorite = async () => {
    if (!currentUserId) {
      // Store current path and navigate to login
      if (typeof window !== "undefined") {
        localStorage.setItem("returnUrl", window.location.pathname);
      }
      router.push("/login");
      return;
    }

    try {
      const res = await api<{ favorited: boolean }>(
        `/api/recipes/${recipeId}/favorite`,
        { method: isFavorited ? "DELETE" : "PUT" }
      );
      setIsFavorited(res.favorited);
      setError("");
      // Re-sync any server-rendered data that depends on favorites
      router.refresh();
    } catch (error) {
      logError("useRecipeFavorites - toggle favorite", error);
      setError(getUserFriendlyErrorMessage(error));
    }
  };

  return {
    currentUserId,
    isFavorited,
    checkingFavorite,
    error,
    handleToggleFavorite,
    setError,
  };
}
