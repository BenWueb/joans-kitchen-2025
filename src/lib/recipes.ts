import "server-only";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  favorites,
  recipeNotes,
  recipePhotos,
  recipes,
  user,
} from "@/db/schema";
import { DEFAULT_RECIPE_IMAGE } from "./constants";
import type { FavoritedRecipe, Note, Photo, Recipe, RecipeSummary } from "./types";

// Re-export shared types for convenience in server-component imports
export type { Recipe, FavoritedRecipe } from "./types";

type RecipeRow = typeof recipes.$inferSelect;
type RecipeRowWithAuthor = { recipe: RecipeRow; authorUserName: string | null };

export const toNote = (
  n: typeof recipeNotes.$inferSelect,
  liveName?: string | null
): Note => ({
  id: n.id,
  text: n.text,
  addedBy: liveName || n.authorName,
  addedByUserId: n.userId ?? undefined,
  addedAt: n.createdAt.toISOString(),
  editedAt: n.editedAt?.toISOString(),
});

export const toPhoto = (
  p: typeof recipePhotos.$inferSelect,
  liveName?: string | null
): Photo => ({
  id: p.id,
  url: p.url,
  addedBy: liveName || p.uploaderName,
  addedByUserId: p.userId ?? undefined,
  addedAt: p.createdAt.toISOString(),
});

/** Photos for many recipes in one query, in display order. */
export async function getPhotosByRecipeIds(ids: string[]) {
  const byRecipe = new Map<string, Photo[]>();
  if (ids.length === 0) return byRecipe;

  const rows = await db
    .select({ photo: recipePhotos, name: user.name })
    .from(recipePhotos)
    .leftJoin(user, eq(user.id, recipePhotos.userId))
    .where(inArray(recipePhotos.recipeId, ids))
    .orderBy(asc(recipePhotos.position), asc(recipePhotos.createdAt));

  for (const { photo, name } of rows) {
    const list = byRecipe.get(photo.recipeId) ?? [];
    list.push(toPhoto(photo, name));
    byRecipe.set(photo.recipeId, list);
  }
  return byRecipe;
}

async function getNotesByRecipeIds(ids: string[]) {
  const byRecipe = new Map<string, Note[]>();
  if (ids.length === 0) return byRecipe;

  const rows = await db
    .select({ note: recipeNotes, name: user.name })
    .from(recipeNotes)
    .leftJoin(user, eq(user.id, recipeNotes.userId))
    .where(inArray(recipeNotes.recipeId, ids))
    .orderBy(desc(recipeNotes.createdAt));

  for (const { note, name } of rows) {
    const list = byRecipe.get(note.recipeId) ?? [];
    list.push(toNote(note, name));
    byRecipe.set(note.recipeId, list);
  }
  return byRecipe;
}

/** Selects recipes together with their author's current display name. */
const selectRecipes = () =>
  db
    .select({ recipe: recipes, authorUserName: user.name })
    .from(recipes)
    .leftJoin(user, eq(user.id, recipes.createdByUserId));

/**
 * Convert database rows to the plain, serializable Recipe shape used by
 * components. Notes and photos are loaded in batch for all rows.
 * (`created` keeps the {seconds, nanoseconds} form the UI expects, and the
 * instructions column is exposed as `recipe`.)
 */
async function hydrate(rows: RecipeRowWithAuthor[]): Promise<Recipe[]> {
  const ids = rows.map((r) => r.recipe.id);
  const [notes, photos] = await Promise.all([
    getNotesByRecipeIds(ids),
    getPhotosByRecipeIds(ids),
  ]);

  return rows.map(({ recipe: row, authorUserName }) => ({
    id: row.id,
    title: row.title,
    ingredients: row.ingredients,
    recipe: row.instructions,
    category: row.category,
    createdBy: authorUserName || row.authorName,
    createdByUserId: row.createdByUserId ?? undefined,
    created: {
      seconds: Math.floor(row.createdAt.getTime() / 1000),
      nanoseconds: 0,
    },
    notes: notes.get(row.id) ?? [],
    photos: photos.get(row.id) ?? [],
    unsplashImageUrl: row.unsplashImageUrl ?? undefined,
    unsplashPhotographer: row.unsplashPhotographer ?? undefined,
    unsplashPhotographerUrl: row.unsplashPhotographerUrl ?? undefined,
  }));
}

/**
 * Get a single recipe by ID (server-side)
 */
export async function getRecipeById(recipeId: string): Promise<Recipe | null> {
  try {
    const rows = await selectRecipes().where(eq(recipes.id, recipeId)).limit(1);
    return (await hydrate(rows))[0] ?? null;
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

    const rows = await selectRecipes().where(inArray(recipes.id, recipeIds));
    const byId = new Map((await hydrate(rows)).map((r) => [r.id, r]));

    return recipeIds
      .map((id) => byId.get(id))
      .filter((r): r is Recipe => r !== undefined);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return [];
  }
}

/**
 * Get recipe by title (server-side). Matching ignores case.
 */
export async function getRecipeByTitle(recipeName: string) {
  try {
    const rows = await selectRecipes()
      .where(sql`lower(${recipes.title}) = lower(${recipeName})`)
      .limit(1);
    return (await hydrate(rows))[0] ?? null;
  } catch (error) {
    console.error("Error fetching recipe by title:", error);
    return null;
  }
}

/** Compact recipe info (id, title, author, photos) for the given recipe rows. */
export async function toSummaries(
  rows: { id: string; title: string; createdBy: string }[]
): Promise<RecipeSummary[]> {
  const photos = await getPhotosByRecipeIds(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, photos: photos.get(r.id) ?? [] }));
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
    const [recipeRows, favoriteRows, photos] = await Promise.all([
      db
        .select({ id: recipes.id, title: recipes.title })
        .from(recipes)
        .where(inArray(recipes.id, ids)),
      db
        .select({
          recipeId: favorites.recipeId,
          name: user.name,
          email: user.email,
        })
        .from(favorites)
        .innerJoin(user, eq(user.id, favorites.userId))
        .where(inArray(favorites.recipeId, ids))
        .orderBy(desc(favorites.createdAt)),
      getPhotosByRecipeIds(ids),
    ]);

    const recipeMap = new Map(recipeRows.map((r) => [r.id, r]));
    const favoriterMap = new Map<string, string>();
    for (const f of favoriteRows) {
      if (!favoriterMap.has(f.recipeId)) {
        favoriterMap.set(f.recipeId, f.name || "Anonymous");
      }
    }

    return latest
      .map((l): FavoritedRecipe | null => {
        const recipe = recipeMap.get(l.recipeId);
        if (!recipe) return null;
        return {
          id: recipe.id,
          title: recipe.title,
          imageUrl: photos.get(recipe.id)?.[0]?.url || DEFAULT_RECIPE_IMAGE,
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

    const rows = await selectRecipes()
      .where(
        excludeId
          ? and(eq(recipes.category, cat), ne(recipes.id, excludeId))
          : eq(recipes.category, cat)
      )
      .limit(limit);

    return hydrate(rows);
  } catch (error) {
    console.error("Error fetching recipes by category:", error);
    return [];
  }
}
