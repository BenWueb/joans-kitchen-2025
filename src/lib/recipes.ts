import "server-only";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { favorites, recipes, user } from "@/db/schema";
import { DEFAULT_RECIPE_IMAGE } from "./constants";
import type { FavoritedRecipe, Recipe } from "./types";

// Re-export shared types for convenience in server-component imports
export type { Recipe, FavoritedRecipe } from "./types";

type RecipeRow = typeof recipes.$inferSelect;

/**
 * Convert a database row to the plain, serializable Recipe shape used by
 * components (`created` keeps the {seconds, nanoseconds} form the UI expects).
 */
export function toRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    ingredients: row.ingredients,
    recipe: row.recipe,
    category: row.category,
    createdBy: row.createdBy,
    createdByUserId: row.createdByUserId ?? undefined,
    created: {
      seconds: Math.floor(row.created.getTime() / 1000),
      nanoseconds: 0,
    },
    notes: row.notes,
    photos: row.photos,
    imageUrls: row.imageUrls,
    unsplashImageUrl: row.unsplashImageUrl ?? undefined,
    unsplashPhotographer: row.unsplashPhotographer ?? undefined,
    unsplashPhotographerUrl: row.unsplashPhotographerUrl ?? undefined,
  };
}

/**
 * Get a single recipe by ID (server-side)
 */
export async function getRecipeById(recipeId: string): Promise<Recipe | null> {
  try {
    const [row] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);
    return row ? toRecipe(row) : null;
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return null;
  }
}

/**
 * Get multiple recipes by their IDs, preserving the order requested
 */
export async function getRecipesByIds(recipeIds: string[]): Promise<Recipe[]> {
  try {
    if (recipeIds.length === 0) return [];

    const rows = await db
      .select()
      .from(recipes)
      .where(inArray(recipes.id, recipeIds));
    const byId = new Map(rows.map((r) => [r.id, toRecipe(r)]));

    return recipeIds
      .map((id) => byId.get(id))
      .filter((r): r is Recipe => r !== undefined);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
}

/**
 * Get recipe by title (server-side). Title must match exactly.
 */
export async function getRecipeByTitle(recipeName: string) {
  try {
    const [row] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.title, recipeName))
      .limit(1);
    return row ? toRecipe(row) : null;
  } catch (error) {
    console.error("Error fetching recipe by title:", error);
    return null;
  }
}

/**
 * Get recently favorited recipes (server-side): the most recent favorite for
 * each distinct recipe, newest first.
 */
export async function getRecentlyFavoritedRecipes(
  limit: number = 6
): Promise<FavoritedRecipe[]> {
  try {
    const latest = await db
      .select({
        recipeId: favorites.recipeId,
        favoritedAt: sql`max(${favorites.createdAt})`
          .mapWith(favorites.createdAt)
          .as("favorited_at"),
      })
      .from(favorites)
      .groupBy(favorites.recipeId)
      .orderBy(desc(sql`max(${favorites.createdAt})`))
      .limit(limit);

    if (latest.length === 0) return [];

    const ids = latest.map((l) => l.recipeId);
    const [recipeRows, favoriteRows] = await Promise.all([
      db.select().from(recipes).where(inArray(recipes.id, ids)),
      db
        .select({
          recipeId: favorites.recipeId,
          createdAt: favorites.createdAt,
          name: user.name,
          email: user.email,
        })
        .from(favorites)
        .innerJoin(user, eq(user.id, favorites.userId))
        .where(inArray(favorites.recipeId, ids))
        .orderBy(desc(favorites.createdAt)),
    ]);

    const recipeMap = new Map(recipeRows.map((r) => [r.id, r]));
    const favoriterMap = new Map<string, string>();
    for (const f of favoriteRows) {
      if (!favoriterMap.has(f.recipeId)) {
        favoriterMap.set(f.recipeId, f.name || f.email || "Anonymous");
      }
    }

    return latest
      .map((l): FavoritedRecipe | null => {
        const recipe = recipeMap.get(l.recipeId);
        if (!recipe) return null;
        return {
          id: recipe.id,
          title: recipe.title || "Untitled Recipe",
          imageUrl:
            recipe.photos?.[0]?.url ||
            recipe.imageUrls?.[0] ||
            DEFAULT_RECIPE_IMAGE,
          favoritedBy: favoriterMap.get(recipe.id) ?? "Anonymous",
          favoritedAt: l.favoritedAt,
        };
      })
      .filter((r): r is FavoritedRecipe => r !== null);
  } catch (error) {
    console.error("Error fetching recently favorited:", error);
    return [];
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

    const rows = await db
      .select()
      .from(recipes)
      .where(
        excludeId
          ? and(eq(recipes.category, cat), ne(recipes.id, excludeId))
          : eq(recipes.category, cat)
      )
      .limit(limit);

    return rows.map(toRecipe);
  } catch (error) {
    console.error("Error fetching recipes by category:", error);
    return [];
  }
}
