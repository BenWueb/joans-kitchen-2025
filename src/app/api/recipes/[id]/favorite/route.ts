import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { favorites, recipes } from "@/db/schema";
import { NOT_FOUND, UNAUTHORIZED } from "@/lib/api-server";
import { getCurrentUser } from "@/lib/session";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ favorited: false });

  const { id } = await params;
  const [row] = await db
    .select({ recipeId: favorites.recipeId })
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.recipeId, id)))
    .limit(1);

  return NextResponse.json({ favorited: !!row });
}

export async function PUT(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const [recipe] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);
  if (!recipe) return NOT_FOUND();

  await db
    .insert(favorites)
    .values({ userId: user.id, recipeId: id })
    .onConflictDoNothing();

  return NextResponse.json({ favorited: true });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.recipeId, id)));

  return NextResponse.json({ favorited: false });
}
