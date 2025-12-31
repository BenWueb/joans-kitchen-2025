"use client";

import { useState, useEffect } from "react";
import { getOrFetchRecipeImage } from "@/utils/unsplash";
import { DEFAULT_RECIPE_IMAGE } from "@/lib/constants";

interface UseRecipeImageProps {
  recipeId: string;
  title: string;
  photos?: { url: string; uploadedAt: any; uploadedBy: string }[];
  unsplashImageUrl?: string;
}

export function useRecipeImage({
  recipeId,
  title,
  photos,
  unsplashImageUrl,
}: UseRecipeImageProps) {
  const [recipeImage, setRecipeImage] = useState<string>(
    (photos && photos.length > 0 ? photos[0].url : null) ||
      unsplashImageUrl ||
      DEFAULT_RECIPE_IMAGE
  );
  const [unsplashPhotographer, setUnsplashPhotographer] = useState<string | null>(null);
  const [unsplashPhotographerUrl, setUnsplashPhotographerUrl] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadImage = async () => {
      const normalizedPhotos = Array.isArray(photos)
        ? photos.filter((p) => p && p.url)
        : [];

      // Fetch image and also update Unsplash info if available
      const url = await getOrFetchRecipeImage(recipeId, {
        id: recipeId,
        title,
        photos: normalizedPhotos.map((p) => p.url),
        unsplashImageUrl,
      });

      setRecipeImage(
        url ||
          (normalizedPhotos.length > 0
            ? normalizedPhotos[0].url
            : unsplashImageUrl || DEFAULT_RECIPE_IMAGE)
      );

      // Only fetch Unsplash attribution if the recipe actually has a stored Unsplash URL.
      // (Avoid treating fallback/header images as Unsplash.)
      if (!normalizedPhotos.length && !!unsplashImageUrl) {
        try {
          const { getRecipeClient } = await import("@/lib/firebase-client");
          const recipeData = await getRecipeClient(recipeId);
          if (recipeData) {
            setUnsplashPhotographer(recipeData.unsplashPhotographer || null);
            setUnsplashPhotographerUrl(recipeData.unsplashPhotographerUrl || null);
          }
        } catch (err) {
          // Ignore error, just don't update info
        }
      }
    };
    loadImage();
  }, [recipeId, title, photos, unsplashImageUrl]);

  return {
    recipeImage,
    setRecipeImage,
    unsplashPhotographer,
    unsplashPhotographerUrl,
  };
}

