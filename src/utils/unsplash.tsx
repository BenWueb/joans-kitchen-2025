import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firestore.config";

interface Recipe {
  id?: string;
  title: string;
  tags?: string[];
  imageUrls?: string[];
  unsplashImageUrl?: string;
}

// Fetch image from Unsplash API
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

// Get or fetch recipe image with caching
export const getOrFetchRecipeImage = async (
  recipeId: string,
  recipe: Recipe
): Promise<string> => {
  const fallbackImage =
    "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/jason-briscoe-GliaHAJ3_5A-unsplash.jpg?alt=media&token=592afcb6-578a-456b-8fa9-83d1125b3a6a";

  try {
    // 1. Check if recipe already has user-uploaded images
    if (recipe.imageUrls && recipe.imageUrls.length > 0) {
      return recipe.imageUrls[0];
    }

    // 2. Check if recipe already has cached Unsplash URL in Firestore
    if (recipe.unsplashImageUrl) {
      return recipe.unsplashImageUrl;
    }

    // 3. Check localStorage cache (client-side only)
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(`recipe_img_${recipeId}`);
      if (cached) {
        const { url, timestamp } = JSON.parse(cached);
        // Cache valid for 30 days
        if (Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
          return url;
        }
      }
    }

    // 4. Fetch from Unsplash
    const query = `${recipe.title} food`;
    const imageData = await fetchUnsplashImage(query);

    if (imageData) {
      // Save to Firestore for future use
      const recipeRef = doc(db, "recipes", recipeId);
      await updateDoc(recipeRef, {
        unsplashImageUrl: imageData.url,
        unsplashPhotographer: imageData.photographer,
        unsplashPhotographerUrl: imageData.photographerUrl,
      });

      // Save to localStorage (client-side)
      if (typeof window !== "undefined") {
        localStorage.setItem(
          `recipe_img_${recipeId}`,
          JSON.stringify({ url: imageData.url, timestamp: Date.now() })
        );
      }

      return imageData.url;
    }

    // 5. Fallback to default image
    return fallbackImage;
  } catch (error) {
    console.error("Error in getOrFetchRecipeImage:", error);
    return fallbackImage;
  }
};

// Client-side hook for fetching images
export const useRecipeImage = (recipeId: string, recipe: Recipe) => {
  const [imageUrl, setImageUrl] = React.useState<string>(
    recipe.imageUrls?.[0] ||
      recipe.unsplashImageUrl ||
      "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/jason-briscoe-GliaHAJ3_5A-unsplash.jpg?alt=media&token=592afcb6-578a-456b-8fa9-83d1125b3a6a"
  );
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const loadImage = async () => {
      // Skip if we already have an image
      if (recipe.imageUrls?.[0] || recipe.unsplashImageUrl) {
        return;
      }

      setLoading(true);
      const url = await getOrFetchRecipeImage(recipeId, recipe);
      setImageUrl(url);
      setLoading(false);
    };

    loadImage();
  }, [recipeId, recipe]);

  return { imageUrl, loading };
};

// Add React import for the hook
import React from "react";
