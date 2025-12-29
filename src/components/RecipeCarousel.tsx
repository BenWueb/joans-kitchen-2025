"use client";

import { useState, useEffect } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firestore.config";
import { getOrFetchRecipeImage } from "@/utils/unsplash";
import { recipeToUrl } from "@/utils/recipeUrl";

interface Recipe {
  id: string;
  title: string;
  createdBy: string;
  notes?: string;
  tags?: string[];
  imageUrls?: string[];
  photos?: { url: string; uploadedAt: any; uploadedBy: string }[];
}

interface RecipeCarouselProps {
  recipeIds: string[];
}

export default function RecipeCarousel({ recipeIds }: RecipeCarouselProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [recipeImages, setRecipeImages] = useState<{ [key: string]: string }>(
    {}
  );

  // Fetch specific recipes by IDs
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const fetchedRecipes: Recipe[] = [];

        for (const recipeId of recipeIds) {
          const recipeDoc = await getDoc(doc(db, "recipes", recipeId));
          if (recipeDoc.exists()) {
            fetchedRecipes.push({
              id: recipeDoc.id,
              title: recipeDoc.data().title,
              createdBy: recipeDoc.data().createdBy,
              notes: recipeDoc.data().notes,
              tags: recipeDoc.data().tags,
              imageUrls: recipeDoc.data().imageUrls,
              photos: recipeDoc.data().photos,
            });
          }
        }

        setRecipes(fetchedRecipes);
        setLoading(false);

        // Fetch images for all recipes
        fetchedRecipes.forEach(async (recipe) => {
          // Prioritize first photo, then fetch from Unsplash
          if (recipe.photos && recipe.photos.length > 0) {
            setRecipeImages((prev) => ({
              ...prev,
              [recipe.id]: recipe.photos![0].url,
            }));
          } else {
            const imageUrl = await getOrFetchRecipeImage(recipe.id, {
              id: recipe.id,
              title: recipe.title,
              tags: recipe.tags,
              imageUrls: recipe.imageUrls,
            });
            setRecipeImages((prev) => ({ ...prev, [recipe.id]: imageUrl }));
          }
        });
      } catch (error) {
        console.error("Error fetching recipes:", error);
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [recipeIds]);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (recipes.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % recipes.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [recipes.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + recipes.length) % recipes.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % recipes.length);
  };

  if (loading) {
    return (
      <div className="relative w-full aspect-[21/9] bg-gray-200 rounded-lg shadow-lg animate-pulse">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading recipes...</p>
        </div>
      </div>
    );
  }

  if (recipes.length === 0) {
    return null;
  }

  const currentRecipe = recipes[currentIndex];
  const currentImage =
    recipeImages[currentRecipe.id] ||
    currentRecipe.imageUrls?.[0] ||
    "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/jason-briscoe-GliaHAJ3_5A-unsplash.jpg?alt=media&token=592afcb6-578a-456b-8fa9-83d1125b3a6a";

  const searchUrl = recipeToUrl(currentRecipe.title);

  return (
    <div className="relative w-full aspect-[21/9] rounded-lg shadow-lg overflow-hidden group mb-8">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: `url(${currentImage})` }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-transparent" />

      {/* Content */}
      <Link
        href={`/${searchUrl}`}
        className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 text-white z-10"
      >
        <div className="max-w-[66.666%]">
          <h2 className="text-4xl md:text-6xl font-bold mb-2 capitalize drop-shadow-lg">
            {currentRecipe.title.toLowerCase()}
          </h2>

          {/* Notes in quotes */}
          {currentRecipe.notes && (
            <p className="text-lg md:text-xl italic opacity-90 drop-shadow-md mb-2">
              &ldquo;{currentRecipe.notes}&rdquo;
            </p>
          )}

          <p className="text-base md:text-lg opacity-90 drop-shadow-md">
            By {currentRecipe.createdBy}
          </p>
        </div>

        {/* Tags */}
        {currentRecipe.tags && currentRecipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {currentRecipe.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Navigation Arrows */}
      <button
        onClick={(e) => {
          e.preventDefault();
          goToPrevious();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
        aria-label="Previous recipe"
      >
        <MdChevronLeft className="w-8 h-8" />
      </button>

      <button
        onClick={(e) => {
          e.preventDefault();
          goToNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
        aria-label="Next recipe"
      >
        <MdChevronRight className="w-8 h-8" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {recipes.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              setCurrentIndex(index);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to recipe ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
