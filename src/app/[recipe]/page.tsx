import Navbar from "@/components/Navbar";
import getRecipe from "@/hooks/getRecipe";
import SingleRecipe from "@/components/SingleRecipe";
import { urlToRecipe } from "@/utils/recipeUrl";

async function Recipe({ params }: { params: { recipe: string } }) {
  const slug = await params;
  const recipeName = urlToRecipe(slug.recipe);
  const data = await getRecipe(recipeName);

  if (!data || data.docs.length === 0) {
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

  const recipe = data.docs[0].data();
  const recipeId = data.docs[0].id;

  return (
    <>
      <Navbar />
      <div className="min-h-screen px-4 pt-20 pb-8">
        <div className="max-w-6xl mx-auto">
          <SingleRecipe
            recipeId={recipeId}
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
            tags={recipe.tags}
            created={recipe.created}
            photos={recipe.photos}
          />
        </div>
      </div>
    </>
  );
}
export default Recipe;
