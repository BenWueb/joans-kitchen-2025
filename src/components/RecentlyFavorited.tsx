"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firestore.config";
import { recipeToUrl } from "@/utils/recipeUrl";

interface FavoritedRecipe {
  id: string;
  title: string;
  imageUrl: string;
  favoritedBy: string;
  favoritedAt?: Date;
}

export default function RecentlyFavorited() {
  const [favoritedRecipes, setFavoritedRecipes] = useState<FavoritedRecipe[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyFavorited = async () => {
      try {
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, "Users"));
        const favoritesMap: {
          [recipeId: string]: { userName: string; favoritedAt?: Date };
        } = {};

        // Collect all favorited recipes with user info
        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          const favorites = userData.favorites || [];

          favorites.forEach((recipeId: string) => {
            // Only keep the first user who favorited (or most recent if we had timestamps)
            if (!favoritesMap[recipeId]) {
              favoritesMap[recipeId] = {
                userName: userData.name || userData.email || "Anonymous",
              };
            }
          });
        });

        // Get recipe IDs (limit to 6)
        const recipeIds = Object.keys(favoritesMap).slice(0, 6);

        // Fetch recipe details
        const recipesData: FavoritedRecipe[] = [];
        for (const recipeId of recipeIds) {
          const recipeDoc = await getDoc(doc(db, "recipes", recipeId));
          if (recipeDoc.exists()) {
            const recipe = recipeDoc.data();
            recipesData.push({
              id: recipeId,
              title: recipe.title || "Untitled Recipe",
              imageUrl:
                recipe.photos?.[0]?.url ||
                recipe.imageUrls?.[0] ||
                "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/jason-briscoe-GliaHAJ3_5A-unsplash.jpg?alt=media&token=592afcb6-578a-456b-8fa9-83d1125b3a6a",
              favoritedBy: favoritesMap[recipeId].userName,
              favoritedAt: favoritesMap[recipeId].favoritedAt,
            });
          }
        }

        setFavoritedRecipes(recipesData);
      } catch (error) {
        console.error("Error fetching recently favorited:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyFavorited();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-6xl mt-8 mb-10">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Recently Favorited
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl shadow-lg h-32 bg-gray-700 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (favoritedRecipes.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mt-8 mb-10">
      <h2 className="text-3xl font-bold text-white text-center mb-6">
        Recently Favorited
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {favoritedRecipes.map((recipe) => {
          const recipeUrl = recipeToUrl(recipe.title);
          const timeAgo = recipe.favoritedAt
            ? getTimeAgo(recipe.favoritedAt)
            : "";

          return (
            <Link key={recipe.id} href={`/${recipeUrl}`} className="group">
              <div className="relative overflow-hidden rounded-xl shadow-lg h-32 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                {/* Background Image */}
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30" />

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center text-white z-10 px-2">
                  <h3 className="text-sm font-bold text-center mb-1 line-clamp-2">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-gray-300 text-center">
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

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}
