import Link from "next/link";
import { getRecipesByCategory } from "@/lib/firebase-server";
import { DEFAULT_RECIPE_IMAGE } from "@/lib/constants";
import { recipeToUrl } from "@/utils/recipeUrl";

export default async function SimilarRecipes(props: {
  category?: string;
  excludeId?: string;
}) {
  const category = props.category;
  const excludeId = props.excludeId;

  const recipes = await getRecipesByCategory({ category, excludeId, limit: 6 });

  if (!recipes || recipes.length === 0) return null;

  return (
    <div className="bg-linear-to-br from-teal-100 via-cyan-50 to-teal-100 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-bold text-gray-700">Similar Recipes</h5>
        {category && (
          <span className="text-xs font-semibold text-gray-600 bg-white/80 border border-gray-200 rounded-full px-3 py-1">
            {category}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {recipes.map((r) => {
          const image =
            (r as any).photos?.[0]?.url ||
            (r as any).imageUrls?.[0] ||
            DEFAULT_RECIPE_IMAGE;

          return (
            <Link
              key={r.id}
              href={`/${recipeToUrl(r.title)}`}
              className="block relative aspect-square overflow-hidden rounded-lg shadow group hover:shadow-lg transition-shadow bg-white"
            >
              <img
                src={image}
                alt={r.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/85 via-black/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2 text-white">
                <p className="text-xs font-semibold line-clamp-2">{r.title}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
