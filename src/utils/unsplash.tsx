/**
 * Unsplash image utilities
 * Note: Unsplash API is currently disabled - only using cached/fallback images
 */

export interface RecipeImageData {
  id?: string;
  title: string;
  photos?: string[];
  imageUrls?: string[];
  unsplashImageUrl?: string;
}

import { DEFAULT_RECIPE_IMAGE as FALLBACK_IMAGE } from "@/lib/constants";

/**
 * Fetch image from Unsplash API (currently disabled/unused)
 * Kept for future use if Unsplash API is re-enabled
 */
export const fetchUnsplashImage = async (
  query: string
): Promise<{
  url: string;
  photographer: string;
  photographerUrl: string;
} | null> => {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error("Unsplash API error:", response.statusText);
      return null;
    }

    const data = await response.json();
    const result = data.results[0];

    if (!result) {
      return null;
    }

    return {
      url: result.urls.regular,
      photographer: result.user.name,
      photographerUrl: `https://unsplash.com/@${result.user.username}?utm_source=joans_kitchen&utm_medium=referral`,
    };
  } catch (error) {
    console.error("Error fetching Unsplash image:", error);
    return null;
  }
};

/**
 * Get or fetch recipe image with caching
 * Currently only uses user-uploaded photos or fallback (Unsplash API disabled)
 */
export const getOrFetchRecipeImage = async (
  recipeId: string,
  recipe: RecipeImageData
): Promise<string> => {
  try {
    // Priority: user-uploaded photos > cached unsplash > fallback
    if (recipe.photos && recipe.photos.length > 0) {
      return recipe.photos[0];
    }
    
    if (recipe.unsplashImageUrl) {
      return recipe.unsplashImageUrl;
    }
    
    return FALLBACK_IMAGE;
  } catch (error) {
    console.error("Error getting recipe image:", error);
    return FALLBACK_IMAGE;
  }
};
