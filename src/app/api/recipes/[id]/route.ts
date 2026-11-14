import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { recipePhotos, recipes } from "@/db/schema";
import {
  apiError,
  DUPLICATE_TITLE,
  FORBIDDEN,
  isAdminOrOwner,
  isUniqueViolation,
  NOT_FOUND,
  readJson,
  UNAUTHORIZED,
} from "@/lib/api-server";
import { getRecipeById } from "@/lib/recipes";
import { getCurrentUser } from "@/lib/session";
import { deleteImages } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  return recipe ? NextResponse.json(recipe) : NOT_FOUND();
}

// Admin-only inline edits of recipe content
export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();
  if (!user.isAdmin) return FORBIDDEN();

  const { id } = await params;
  const body = await readJson<{
    title?: string;
    ingredients?: string;
    recipe?: string;
    category?: string;
    clearUnsplash?: boolean;
  }>(request);
  if (!body) return apiError("Invalid request", 400);

  const updates: Partial<typeof recipes.$inferInsert> = {};
  if (typeof body.title === "string") {
    if (!body.title.trim()) return apiError("Title can't be empty", 400);
    updates.title = body.title.trim();
  }
  if (typeof body.ingredients === "string") updates.ingredients = body.ingredients;
  if (typeof body.recipe === "string") updates.instructions = body.recipe;
  if (typeof body.category === "string") updates.category = body.category.trim();
  if (body.clearUnsplash) {
    updates.unsplashImageUrl = null;
    updates.unsplashPhotographer = null;
    updates.unsplashPhotographerUrl = null;
  }
  if (Object.keys(updates).length === 0) return apiError("Nothing to update", 400);

  try {
    const [updated] = await db
      .update(recipes)
      .set(updates)
      .where(eq(recipes.id, id))
      .returning({ id: recipes.id });

    return updated ? NextResponse.json({ ok: true }) : NOT_FOUND();
  } catch (error) {
    if (isUniqueViolation(error)) return DUPLICATE_TITLE();
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const [existing] = await db
    .select({ createdByUserId: recipes.createdByUserId })
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);

  if (!existing) return NOT_FOUND();
  if (!isAdminOrOwner(user, existing.createdByUserId)) return FORBIDDEN();

  const photos = await db
    .select({ url: recipePhotos.url })
    .from(recipePhotos)
    .where(eq(recipePhotos.recipeId, id));

  // Notes, photos and favorites are removed by ON DELETE CASCADE
  await db.delete(recipes).where(eq(recipes.id, id));

  // Best effort: the recipe is already gone, so don't fail on storage errors
  try {
    await deleteImages(photos.map((p) => p.url));
  } catch (error) {
    console.error("Error deleting recipe photos from storage:", error);
  }

  return NextResponse.json({ ok: true });
}
