"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/firestore.config";
import { COLLECTIONS } from "@/lib/constants";
import { getUserFriendlyErrorMessage, logError } from "@/lib/errors";

interface UseRecipeFavoritesProps {
  recipeId: string;
}

export function useRecipeFavorites({ recipeId }: UseRecipeFavoritesProps) {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(true);
  const [error, setError] = useState("");

  // Get current user's ID and check if recipe is favorited
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);

        // Check if this recipe is in user's favorites
        try {
          const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const favorites = userData.favorites || [];
            setIsFavorited(favorites.includes(recipeId));
          }
        } catch (error) {
          logError("useRecipeFavorites - check favorite", error);
        }
      } else {
        setCurrentUserId("");
        setIsFavorited(false);
      }
      setCheckingFavorite(false);
    });

    return () => unsubscribe();
  }, [recipeId]);

  // Toggle favorite - Add/remove recipe from user's favorites array
  const handleToggleFavorite = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      // Store current path and navigate to login
      if (typeof window !== "undefined") {
        localStorage.setItem("returnUrl", window.location.pathname);
      }
      router.push("/login");
      return;
    }

    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);

      if (isFavorited) {
        // Remove from favorites
        await updateDoc(userRef, {
          favorites: arrayRemove(recipeId),
        });
        setIsFavorited(false);
      } else {
        // Add to favorites
        await updateDoc(userRef, {
          favorites: arrayUnion(recipeId),
        });
        setIsFavorited(true);
      }
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

