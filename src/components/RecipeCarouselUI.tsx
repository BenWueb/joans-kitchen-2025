"use client";

import { useState, useEffect } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import Link from "next/link";
import { recipeToUrl } from "@/utils/recipeUrl";
import { Recipe } from "@/lib/firebase-server";

interface RecipeCarouselUIProps {
  recipes: Recipe[];
}

export default function RecipeCarouselUI({ recipes }: RecipeCarouselUIProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const currentRecipe = recipes[currentIndex];
  const currentImage =
    currentRecipe.photos?.[0]?.url ||
    currentRecipe.imageUrls?.[0] ||
    "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/jason-briscoe-GliaHAJ3_5A-unsplash.jpg?alt=media&token=592afcb6-578a-456b-8fa9-83d1125b3a6a";

  const searchUrl = recipeToUrl(currentRecipe.title);

  return (
    <div className="relative w-full aspect-video md:aspect-21/9 rounded-lg shadow-lg overflow-hidden group mb-8">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-500"
        style={{ backgroundImage: `url(${currentImage})` }}
      />

      {/* Dark gradient overlay (extend further right for better mobile readability) */}
      <div className="absolute inset-0 bg-linear-to-r from-black/85 via-black/65 to-black/25" />

      {/* Content */}
      <Link
        href={`/${searchUrl}`}
        className="absolute inset-0 flex flex-col justify-center px-4 sm:px-8 md:px-16 text-white z-10"
      >
        {/* Full-width text on mobile; constrain on larger screens */}
        <div className="w-full sm:max-w-[66.666%]">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-2 capitalize drop-shadow-lg line-clamp-2">
            {currentRecipe.title.toLowerCase()}
          </h2>

          {/* Notes in quotes */}
          {currentRecipe.notes && (
            <p className="text-sm sm:text-base md:text-lg lg:text-xl italic opacity-90 drop-shadow-md mb-2 line-clamp-2">
              &ldquo;{currentRecipe.notes}&rdquo;
            </p>
          )}

          <p className="text-xs sm:text-sm md:text-base lg:text-lg opacity-90 drop-shadow-md">
            By {currentRecipe.createdBy}
          </p>
        </div>

        {/* Category */}
        {currentRecipe.category && (
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-2 sm:px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-[10px] sm:text-xs font-semibold rounded-full border border-white/30">
              {currentRecipe.category}
            </span>
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
