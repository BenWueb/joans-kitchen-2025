"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firestore.config";
import {
  COLLECTIONS,
  STORAGE_PATHS,
  FILE_LIMITS,
  PHOTO_DIMENSIONS,
  DEFAULT_USER_NAME,
} from "@/lib/constants";
import { getUserFriendlyErrorMessage, logError } from "@/lib/errors";
import type { Photo } from "@/lib/types";

interface UseRecipePhotosProps {
  recipeId: string;
}

type UploadStage = "uploading" | "processing";

export function useRecipePhotos({ recipeId }: UseRecipePhotosProps) {
  const router = useRouter();
  const [activeOps, setActiveOps] = useState(0);
  const [photoError, setPhotoError] = useState("");

  const uploadingPhoto = activeOps > 0;

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
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setPhotoError("You must be logged in to upload photos");
        return null;
      }

      // Get user's name from Firestore
      const userDocRef = doc(db, COLLECTIONS.USERS, user.uid);
      const userDoc = await getDoc(userDocRef);
      const userName = userDoc.exists()
        ? userDoc.data().name
        : DEFAULT_USER_NAME;

      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop();
      const fileName = `${recipeId}_${timestamp}.${fileExtension}`;

      // Upload to Firebase Storage
      const storageRef = ref(
        storage,
        `${STORAGE_PATHS.RECIPE_PHOTOS}/${recipeId}/${fileName}`
      );
      // Upload with progress
      opts?.onStage?.("uploading");
      const uploadTask = uploadBytesResumable(storageRef, file);
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const pct =
              snapshot.totalBytes > 0
                ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                : 0;
            opts?.onProgress?.(pct);
          },
          (err) => reject(err),
          () => resolve()
        );
      });

      // Wait for the resize extension to process the image
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
      const resizedFileName = `${fileNameWithoutExt}${PHOTO_DIMENSIONS.RESIZED_SUFFIX}`;

      // Poll for the resized image (with timeout)
      opts?.onStage?.("processing");
      let photoUrl = "";
      let attempts = 0;

      while (attempts < FILE_LIMITS.PHOTO_RESIZE_TIMEOUT_SECONDS) {
        try {
          const resizedRef = ref(
            storage,
            `${STORAGE_PATHS.RECIPE_PHOTOS}/${recipeId}/${resizedFileName}`
          );
          photoUrl = await getDownloadURL(resizedRef);
          break; // Successfully got the resized image
        } catch (error) {
          // Image not ready yet, wait and retry
          await new Promise((resolve) =>
            setTimeout(resolve, FILE_LIMITS.PHOTO_RESIZE_POLL_INTERVAL_MS)
          );
          attempts++;
        }
      }

      // If resized version not available after timeout, use original
      if (!photoUrl) {
        console.warn("Resized image not ready, using original");
        photoUrl = await getDownloadURL(storageRef);
      }

      // Determine which filename to store (resized or original)
      const storedFileName = photoUrl.includes("_1920x1920.webp")
        ? resizedFileName
        : fileName;

      // Create photo object
      const photoObject: Photo = {
        url: photoUrl,
        addedBy: userName,
        addedByUserId: user.uid,
        addedAt: new Date().toISOString(),
      };

      // Add to Firestore
      const recipeRef = doc(db, COLLECTIONS.RECIPES, recipeId);
      await updateDoc(recipeRef, {
        photos: arrayUnion(photoObject),
      });

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

  // Delete photo from storage and Firestore
  const handleDeletePhoto = async (photo: Photo): Promise<boolean> => {
    setActiveOps((c) => c + 1);
    setPhotoError("");

    try {
      // Extract filename from URL if possible, or use photo metadata
      // For now, we'll just remove from Firestore since storage cleanup
      // would require tracking the exact file path

      // Remove from Firestore
      const recipeRef = doc(db, COLLECTIONS.RECIPES, recipeId);
      await updateDoc(recipeRef, {
        photos: arrayRemove(photo),
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
      const recipeRef = doc(db, COLLECTIONS.RECIPES, recipeId);
      await updateDoc(recipeRef, { photos });
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
