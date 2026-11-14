import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { apiError, readJson, UNAUTHORIZED } from "@/lib/api-server";
import { getCurrentUser } from "@/lib/session";
import { DEFAULT_USER_NAME } from "@/lib/constants";

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
  const recipe = body?.recipe?.trim();
  if (!title) return apiError("Please enter a recipe title.", 400);
  if (!ingredients) return apiError("Please enter ingredients.", 400);
  if (!recipe) return apiError("Please enter recipe instructions.", 400);

  const noteText = body?.notes?.trim();
  const notes = noteText
    ? [
        {
          text: noteText,
          addedBy: user.name || DEFAULT_USER_NAME,
          addedByUserId: user.id,
          addedAt: new Date().toISOString(),
        },
      ]
    : [];

  const [created] = await db
    .insert(recipes)
    .values({
      id: randomUUID(),
      title,
      ingredients,
      recipe,
      category: "",
      createdBy: user.email,
      createdByUserId: user.id,
      notes,
    })
    .returning({ id: recipes.id, title: recipes.title });

  return NextResponse.json(created, { status: 201 });
}
