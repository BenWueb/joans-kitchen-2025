import { adminDb } from "./firebase-admin";
import { COLLECTIONS, DEFAULT_RECIPE_IMAGE } from "./constants";
import type { Recipe, FavoritedRecipe } from "./types";

// Re-export shared types for convenience in server-component imports
export type { Recipe, FavoritedRecipe } from "./types";

/**
 * Get a single recipe by ID (server-side)
 */
export async function getRecipeById(recipeId: string): Promise<Recipe | null> {
  try {
    const recipeDoc = await adminDb
      .collection(COLLECTIONS.RECIPES)
      .doc(recipeId)
      .get();

    if (!recipeDoc.exists) {
      return null;
    }

    return {
      id: recipeDoc.id,
      ...recipeDoc.data(),
    } as Recipe;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return null;
  }
}

/**
 * Get multiple recipes by their IDs (server-side)
 */
export async function getRecipesByIds(recipeIds: string[]): Promise<Recipe[]> {
  try {
    if (recipeIds.length === 0) {
      return [];
    }

    // Fetch documents directly by ID using getAll (more efficient)
    const allRecipes: Recipe[] = [];

    // Process in batches of 10 (Firestore limit)
    for (let i = 0; i < recipeIds.length; i += 10) {
      const batch = recipeIds.slice(i, i + 10);
      const docRefs = batch.map((id) =>
        adminDb.collection(COLLECTIONS.RECIPES).doc(id)
      );
      const docs = await adminDb.getAll(...docRefs);

      docs.forEach((doc) => {
        if (doc.exists) {
          allRecipes.push({
            id: doc.id,
            ...doc.data(),
          } as Recipe);
        }
      });
    }

    // Maintain original order
    const recipeMap = new Map(allRecipes.map((r) => [r.id, r]));
    return recipeIds
      .map((id) => recipeMap.get(id))
      .filter((r): r is Recipe => r !== undefined);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
}

/**
 * Get recipe by title (server-side)
 */
export async function getRecipeByTitle(recipeName: string) {
  try {
    const recipesSnapshot = await adminDb
      .collection(COLLECTIONS.RECIPES)
      .where("title", "==", recipeName)
      .limit(1)
      .get();

    if (recipesSnapshot.empty) {
      return null;
    }

    const doc = recipesSnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as Recipe;
  } catch (error) {
    console.error("Error fetching recipe by title:", error);
    return null;
  }
}

/**
 * Get recently favorited recipes (server-side)
 */
export async function getRecentlyFavoritedRecipes(
  limit: number = 6
): Promise<FavoritedRecipe[]> {
  try {
    const usersSnapshot = await adminDb.collection(COLLECTIONS.USERS).get();
    const favoritesMap: {
      [recipeId: string]: { userName: string; favoritedAt?: Date };
    } = {};

    // Collect all favorited recipes with user info
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const favorites = userData.favorites || [];

      favorites.forEach((recipeId: string) => {
        if (!favoritesMap[recipeId]) {
          favoritesMap[recipeId] = {
            userName: userData.name || userData.email || "Anonymous",
          };
        }
      });
    });

    // Get recipe IDs (limit to specified number)
    const recipeIds = Object.keys(favoritesMap).slice(0, limit);

    if (recipeIds.length === 0) {
      return [];
    }

    // Fetch recipe details in batches
    const recipesData: FavoritedRecipe[] = [];
    const batches = [];
    for (let i = 0; i < recipeIds.length; i += 10) {
      batches.push(recipeIds.slice(i, i + 10));
    }

    for (const batch of batches) {
      const docRefs = batch.map((id) =>
        adminDb.collection(COLLECTIONS.RECIPES).doc(id)
      );
      const docs = await adminDb.getAll(...docRefs);

      docs.forEach((doc) => {
        if (doc.exists) {
          const recipe = doc.data() || ({} as any);
          const recipeId = doc.id;

          recipesData.push({
            id: recipeId,
            title: recipe.title || "Untitled Recipe",
            imageUrl:
              recipe.photos?.[0]?.url ||
              recipe.imageUrls?.[0] ||
              DEFAULT_RECIPE_IMAGE,
            favoritedBy: favoritesMap[recipeId].userName,
            favoritedAt: favoritesMap[recipeId].favoritedAt,
          });
        }
      });
    }

    // Maintain order
    const recipeMap = new Map(recipesData.map((r) => [r.id, r]));
    return recipeIds
      .map((id) => recipeMap.get(id))
      .filter((r): r is FavoritedRecipe => r !== undefined);
  } catch (error) {
    console.error("Error fetching recently favorited:", error);
    return [];
  }
}

/**
 * Get user data by user ID (server-side)
 */
export async function getUserData(userId: string) {
  try {
    const userDoc = await adminDb
      .collection(COLLECTIONS.USERS)
      .doc(userId)
      .get();

    if (!userDoc.exists) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

/**
 * Get similar recipes by category (server-side)
 */
export async function getRecipesByCategory(opts: {
  category?: string;
  excludeId?: string;
  limit?: number;
}): Promise<Recipe[]> {
  const { category, excludeId, limit = 6 } = opts;
  try {
    const cat = (category || "").trim();
    if (!cat) return [];

    const snap = await adminDb
      .collection(COLLECTIONS.RECIPES)
      .where("category", "==", cat)
      .limit(limit + 5) // small buffer to account for excludeId filtering
      .get();

    const recipes = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Recipe))
      .filter((r) => (excludeId ? r.id !== excludeId : true))
      .slice(0, limit);

    return recipes;
  } catch (error) {
    console.error("Error fetching recipes by category:", error);
    return [];
  }
}
