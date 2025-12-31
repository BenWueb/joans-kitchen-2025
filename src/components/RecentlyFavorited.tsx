import Link from "next/link";
import { Suspense } from "react";
import { recipeToUrl } from "@/utils/recipeUrl";
import {
  getRecentlyFavoritedRecipes,
  FavoritedRecipe,
} from "@/lib/firebase-server";
import { RecipeCardSkeleton } from "@/components/ui/Loading";

async function RecentlyFavoritedData() {
  const favoritedRecipes = await getRecentlyFavoritedRecipes(6);

  if (favoritedRecipes.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mt-6 md:mt-8 mb-6 md:mb-10 px-2 md:px-0">
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4 md:mb-6">
        Recently Favorited
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {favoritedRecipes.map((recipe) => {
          const recipeUrl = recipeToUrl(recipe.title);
          const timeAgo = recipe.favoritedAt
            ? getTimeAgo(recipe.favoritedAt)
            : "";

          return (
            <Link key={recipe.id} href={`/${recipeUrl}`} className="group">
              <div className="relative overflow-hidden rounded-xl shadow-lg h-28 sm:h-32 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                {/* Background Image */}
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/70 to-black/30" />

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center text-white z-10 px-2">
                  <h3 className="text-xs sm:text-sm font-bold text-center mb-1 line-clamp-2">
                    {recipe.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-300 text-center line-clamp-2">
                    Favorited by {recipe.favoritedBy}
                    {timeAgo && <span className="block">{timeAgo}</span>}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function RecentlyFavoritedLoading() {
  return (
    <div className="w-full max-w-6xl mt-6 md:mt-8 mb-6 md:mb-10 px-2 md:px-0">
      <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4 md:mb-6">
        Recently Favorited
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {[...Array(6)].map((_, i) => (
          <RecipeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}

export default function RecentlyFavorited() {
  return (
    <Suspense fallback={<RecentlyFavoritedLoading />}>
      <RecentlyFavoritedData />
    </Suspense>
  );
}
