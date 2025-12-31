import Navbar from "@/components/Navbar";
import SingleRecipe from "@/components/SingleRecipe";
import { urlToRecipe } from "@/utils/recipeUrl";
import { getRecipeByTitle } from "@/lib/firebase-server";
import { Suspense } from "react";
import SimilarRecipes from "@/components/recipe/SimilarRecipes";

async function Recipe({ params }: { params: { recipe: string } }) {
  const slug = await params;
  const recipeName = urlToRecipe(slug.recipe);
  const recipe = await getRecipeByTitle(recipeName);

  if (!recipe) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              Recipe Not Found
            </h2>
            <p className="text-gray-600">
              The recipe you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen px-4 pt-20 pb-8">
        <div className="max-w-6xl mx-auto">
          <SingleRecipe
            recipeId={recipe.id}
            title={recipe.title}
            ingredients={recipe.ingredients}
            recipe={recipe.recipe}
            notes={recipe.notes}
            notesUpdatedBy={recipe.notesUpdatedBy}
            notesUpdatedAt={recipe.notesUpdatedAt}
            createdBy={recipe.createdBy}
            createdByUserId={recipe.createdByUserId}
            imageUrls={recipe.imageUrls}
            unsplashImageUrl={recipe.unsplashImageUrl}
            category={recipe.category}
            created={recipe.created}
            photos={recipe.photos}
          />

          <Suspense fallback={null}>
            <SimilarRecipes category={recipe.category} excludeId={recipe.id} />
          </Suspense>
        </div>
      </div>
    </>
  );
}

export default Recipe;
