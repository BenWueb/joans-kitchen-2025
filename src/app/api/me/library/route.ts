import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { favorites, recipes } from "@/db/schema";
import { UNAUTHORIZED } from "@/lib/api-server";
import { getCurrentUser } from "@/lib/session";

const summaryColumns = {
  id: recipes.id,
  title: recipes.title,
  createdBy: recipes.createdBy,
  photos: recipes.photos,
};

// The signed-in user's favorited recipes and the recipes they created
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const [favoriteRecipes, ownRecipes] = await Promise.all([
    db
      .select(summaryColumns)
      .from(favorites)
      .innerJoin(recipes, eq(recipes.id, favorites.recipeId))
      .where(eq(favorites.userId, user.id))
      .orderBy(desc(favorites.createdAt)),
    db
      .select(summaryColumns)
      .from(recipes)
      .where(eq(recipes.createdByUserId, user.id))
      .orderBy(desc(recipes.created)),
  ]);

  return NextResponse.json({ favorites: favoriteRecipes, recipes: ownRecipes });
}
