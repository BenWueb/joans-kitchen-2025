"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { getUserFriendlyErrorMessage, logError } from "@/lib/errors";
import { resizeImageForUpload } from "@/utils/resizeImage";
import type { Photo } from "@/lib/types";

interface UseRecipePhotosProps {
  recipeId?: string | null;
  ensureRecipeId?: () => Promise<string>;
}

type UploadStage = "uploading" | "processing";

// POST the file with XHR (fetch can't report upload progress)
function uploadWithProgress(
  url: string,
  file: Blob,
  opts?: {
    onProgress?: (pct: number) => void;
    onStage?: (stage: UploadStage) => void;
  }
): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file, "photo.webp");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts?.onProgress?.((e.loaded / e.total) * 100);
    };
    // Body fully sent; the server is now processing and storing the image
    xhr.upload.onload = () => opts?.onStage?.("processing");
    xhr.onerror = () => reject(new TypeError("Network error"));
    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as Photo);
      else reject(new Error(data?.error || "Upload failed. Please try again."));
    };
    xhr.send(form);
  });
}

export function useRecipePhotos({
  recipeId,
  ensureRecipeId,
}: UseRecipePhotosProps) {
  const router = useRouter();
  const [activeOps, setActiveOps] = useState(0);
  const [photoError, setPhotoError] = useState("");

  const uploadingPhoto = activeOps > 0;

  // Resolve recipeId lazily (create-recipe makes the recipe on demand)
  const resolveRecipeId = async () =>
    recipeId || (ensureRecipeId ? await ensureRecipeId() : null);

  // Upload a single photo (with optional progress + stage callbacks)
  const uploadPhoto = async (
    file: File,
    opts?: {
      onProgress?: (pct: number) => void;
      onStage?: (stage: UploadStage) => void;
    }
  ): Promise<Photo | null> => {
    setActiveOps((c) => c + 1);
    setPhotoError("");

    try {
      const { data: session } = await authClient.getSession();
      if (!session?.user) {
        setPhotoError("You must be logged in to upload photos");
        return null;
      }

      const finalRecipeId = await resolveRecipeId();
      if (!finalRecipeId) {
        setPhotoError("Recipe not ready yet. Please try again.");
        return null;
      }

      opts?.onStage?.("uploading");
      const resized = await resizeImageForUpload(file);
      const photoObject = await uploadWithProgress(
        `/api/recipes/${finalRecipeId}/photos`,
        resized,
        opts
      );

      router.refresh();
      return photoObject;
    } catch (error) {
      logError("useRecipePhotos - upload photo", error);
      setPhotoError(getUserFriendlyErrorMessage(error));
      return null;
    } finally {
      setActiveOps((c) => Math.max(0, c - 1));
    }
  };

  // Delete photo from storage and the recipe
  const handleDeletePhoto = async (photo: Photo): Promise<boolean> => {
    setActiveOps((c) => c + 1);
    setPhotoError("");

    try {
      const finalRecipeId = await resolveRecipeId();
      if (!finalRecipeId) {
        setPhotoError("Recipe not ready yet. Please try again.");
        return false;
      }

      await api(`/api/recipes/${finalRecipeId}/photos`, {
        method: "DELETE",
        json: { id: photo.id },
      });

      router.refresh();
      return true;
    } catch (error) {
      logError("useRecipePhotos - delete photo", error);
      setPhotoError(getUserFriendlyErrorMessage(error));
      return false;
    } finally {
      setActiveOps((c) => Math.max(0, c - 1));
    }
  };

  // Persist a new photo order (e.g. set cover / reorder)
  const savePhotoOrder = async (photos: Photo[]): Promise<boolean> => {
    setActiveOps((c) => c + 1);
    setPhotoError("");
    try {
      const finalRecipeId = await resolveRecipeId();
      if (!finalRecipeId) {
        setPhotoError("Recipe not ready yet. Please try again.");
        return false;
      }
      await api(`/api/recipes/${finalRecipeId}/photos`, {
        method: "PUT",
        json: { ids: photos.map((p) => p.id) },
      });
      router.refresh();
      return true;
    } catch (error) {
      logError("useRecipePhotos - save photo order", error);
      setPhotoError(getUserFriendlyErrorMessage(error));
      return false;
    } finally {
      setActiveOps((c) => Math.max(0, c - 1));
    }
  };

  return {
    uploadingPhoto,
    photoError,
    uploadPhoto,
    handleDeletePhoto,
    savePhotoOrder,
    setPhotoError,
  };
}
