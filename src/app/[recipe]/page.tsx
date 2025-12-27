import Navbar from "@/components/Navbar";
import getRecipe from "@/hooks/getRecipe";
import SingleRecipe from "@/components/SingleRecipe";

async function Recipe({ params }: { params: { recipe: string } }) {
  const slug = await params;
  const recipeName = slug.recipe.replace(/_/g, " ");
  const data = await getRecipe(recipeName);

  if (!data || data.docs.length === 0) {
    return <div>Recipe not found</div>;
  }

  const recipe = data.docs[0].data();

  return (
    <>
      <div className="background"></div>
      <div className="navbar-container">
        <Navbar />
      </div>
      <div className="container">
        <div className="page-container">
          <h1 className="page-title single-title">
            {recipe.title.toLowerCase()}
          </h1>
          <SingleRecipe
            title={recipe.title}
            ingredients={recipe.ingredients}
            recipe={recipe.recipe}
            notes={recipe.notes}
            createdBy={recipe.createdBy}
            imageUrls={recipe.imageUrls}
            tags={recipe.tags}
            created={recipe.created}
          />
        </div>
      </div>
    </>
  );
}
export default Recipe;
