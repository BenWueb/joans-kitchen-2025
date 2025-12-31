import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firestore.config";

interface Recipe {
  id?: string;
  title: string;
  tags?: string[];
  photos?: string[];
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
    if (recipe.photos && recipe.photos.length > 0) {
      return recipe.photos[0];
    }

    // 2. Check if recipe already has cached Unsplash URL in Firestore (priority)
    if (recipe.unsplashImageUrl) {
      return recipe.unsplashImageUrl;
    }

    // 3. Fetch from Unsplash
    const query = `${recipe.title}`;
    const imageData = await fetchUnsplashImage(query);

    if (imageData) {
      // Save to Firestore for future use
      try {
        const recipeRef = doc(db, "recipes", recipeId);
        await updateDoc(recipeRef, {
          unsplashImageUrl: imageData.url,
          unsplashPhotographer: imageData.photographer,
          unsplashPhotographerUrl: imageData.photographerUrl,
        });
        console.log(`Saved Unsplash image to Firestore for recipe ${recipeId}`);
      } catch (error) {
        console.error("Failed to save to Firestore:", error);
        // Continue anyway, we have the image
      }

      return imageData.url;
    }

    // 4. Fallback to default image
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
