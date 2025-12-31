/**
 * Client-side Firebase utilities
 * For operations that require authentication or client-side state
 */

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firestore.config";
import { COLLECTIONS } from "./constants";
import type { UserData } from "./types";

/**
 * Get user data by user ID (client-side, requires auth)
 */
export async function getUserDataClient(userId: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

/**
 * Check if a user is an admin (client-side)
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      return userDoc.data().isAdmin === true;
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Get recipe document by ID (client-side)
 */
export async function getRecipeClient(recipeId: string) {
  try {
    const recipeDoc = await getDoc(doc(db, COLLECTIONS.RECIPES, recipeId));
    if (recipeDoc.exists()) {
      return {
        id: recipeDoc.id,
        ...recipeDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return null;
  }
}

