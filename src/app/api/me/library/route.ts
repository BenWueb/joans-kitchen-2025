import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { favorites, recipes, user as users } from "@/db/schema";
import { UNAUTHORIZED } from "@/lib/api-server";
import { toSummaries } from "@/lib/recipes";
import { getCurrentUser } from "@/lib/session";

const summaryColumns = {
  id: recipes.id,
  title: recipes.title,
  authorName: recipes.authorName,
  liveName: users.name,
};

const toRow = (r: { id: string; title: string; authorName: string; liveName: string | null }) => ({
  id: r.id,
  title: r.title,
  createdBy: r.liveName || r.authorName,
});

// The signed-in user's favorited recipes and the recipes they created
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const [favoriteRecipes, ownRecipes] = await Promise.all([
    db
      .select(summaryColumns)
      .from(favorites)
      .innerJoin(recipes, eq(recipes.id, favorites.recipeId))
      .leftJoin(users, eq(users.id, recipes.createdByUserId))
      .where(eq(favorites.userId, user.id))
      .orderBy(desc(favorites.createdAt)),
    db
      .select(summaryColumns)
      .from(recipes)
      .leftJoin(users, eq(users.id, recipes.createdByUserId))
      .where(eq(recipes.createdByUserId, user.id))
      .orderBy(desc(recipes.createdAt)),
  ]);

  const [favs, own] = await Promise.all([
    toSummaries(favoriteRecipes.map(toRow)),
    toSummaries(ownRecipes.map(toRow)),
  ]);
  return NextResponse.json({ favorites: favs, recipes: own });
}
