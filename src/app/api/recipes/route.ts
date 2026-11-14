import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { recipeNotes, recipes } from "@/db/schema";
import {
  apiError,
  DUPLICATE_TITLE,
  isUniqueViolation,
  readJson,
  UNAUTHORIZED,
} from "@/lib/api-server";
import { getCurrentUser } from "@/lib/session";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const body = await readJson<{
    title?: string;
    ingredients?: string;
    recipe?: string;
    notes?: string;
  }>(request);

  const title = body?.title?.trim();
  const ingredients = body?.ingredients?.trim();
  const instructions = body?.recipe?.trim();
  if (!title) return apiError("Please enter a recipe title.", 400);
  if (!ingredients) return apiError("Please enter ingredients.", 400);
  if (!instructions) return apiError("Please enter recipe instructions.", 400);

  const noteText = body?.notes?.trim();

  try {
    const created = await db.transaction(async (tx) => {
      const [recipe] = await tx
        .insert(recipes)
        .values({
          id: randomUUID(),
          title,
          ingredients,
          instructions,
          authorName: user.name,
          createdByUserId: user.id,
        })
        .returning({ id: recipes.id, title: recipes.title });

      if (noteText) {
        await tx.insert(recipeNotes).values({
          id: randomUUID(),
          recipeId: recipe.id,
          userId: user.id,
          authorName: user.name,
          text: noteText,
        });
      }
      return recipe;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return DUPLICATE_TITLE();
    throw error;
  }
}
