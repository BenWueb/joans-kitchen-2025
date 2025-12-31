import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { getRecipesByIds } from "@/lib/firebase-server";
import { RecipeCarouselSkeleton } from "@/components/ui/Loading";
import RecipeCarouselUI from "./RecipeCarouselUI";

interface RecipeCarouselProps {
  recipeIds: string[];
}

// Cache homepage carousel results (scoped to this component only).
// This avoids repeated Firestore Admin reads across requests while allowing periodic refresh.
const getCarouselRecipesCached = unstable_cache(
  async (recipeIds: string[]) => getRecipesByIds(recipeIds),
  ["home-recipe-carousel"],
  { revalidate: 300 }
);

// Server component for data fetching
async function RecipeCarouselData({ recipeIds }: RecipeCarouselProps) {
  const recipes = await getCarouselRecipesCached(recipeIds);

  if (recipes.length === 0) {
    return null;
  }

  return <RecipeCarouselUI recipes={recipes} />;
}

// Main export with Suspense
export default function RecipeCarousel({ recipeIds }: RecipeCarouselProps) {
  return (
    <Suspense fallback={<RecipeCarouselSkeleton />}>
      <RecipeCarouselData recipeIds={recipeIds} />
    </Suspense>
  );
}
