"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/firestore.config";

export const useRecipeActions = (
  recipeId: string,
  notes: any,
  notesUpdatedBy: string,
  notesUpdatedAt: string
) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [editedNoteText, setEditedNoteText] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [checkingFavorite, setCheckingFavorite] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const router = useRouter();

  // Convert old notes format to array if needed
  const notesArray = Array.isArray(notes)
    ? notes
    : notes
    ? [
        {
          text: notes,
          addedBy: notesUpdatedBy || "Joan",
          addedAt: notesUpdatedAt || new Date().toISOString(),
        },
      ]
    : [];

  const [localNotes, setLocalNotes] = useState(notesArray);

  // Update localNotes when notes prop changes
  useEffect(() => {
    const updatedNotesArray = Array.isArray(notes)
      ? notes
      : notes
      ? [
          {
            text: notes,
            addedBy: notesUpdatedBy || "Joan",
            addedAt: notesUpdatedAt || new Date().toISOString(),
          },
        ]
      : [];
    setLocalNotes(updatedNotesArray);
  }, [notes, notesUpdatedBy, notesUpdatedAt]);

  // Get current user's email and check if recipe is favorited
  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        setCurrentUserEmail(user.email || "");

        // Check if this recipe is in user's favorites
        try {
          const userDocRef = doc(db, "Users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const favorites = userData.favorites || [];
            setIsFavorited(favorites.includes(recipeId));
          }
        } catch (error) {
          console.error("Error checking favorites:", error);
        }
      }
      setCheckingFavorite(false);
    };
    fetchUserData();
  }, [recipeId]);

  // Toggle favorite - Add/remove recipe from user's favorites array
  const handleToggleFavorite = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      // Store current path and navigate to login
      if (typeof window !== "undefined") {
        localStorage.setItem("returnUrl", window.location.pathname);
      }
      router.push("/login");
      return;
    }

    try {
      const userRef = doc(db, "Users", user.uid);

      if (isFavorited) {
        // Remove from favorites
        await updateDoc(userRef, {
          favorites: arrayRemove(recipeId),
        });
        setIsFavorited(false);
      } else {
        // Add to favorites
        await updateDoc(userRef, {
          favorites: arrayUnion(recipeId),
        });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setError("Failed to update favorite. Please try again.");
    }
  };

  // Save notes to database
  const handleSaveNotes = async () => {
    if (!newNote.trim()) {
      setError("Please enter a note");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("You must be logged in to save notes");
        setSaving(false);
        return;
      }

      // Get user's name from Firestore
      const userDocRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userName = userDoc.exists() ? userDoc.data().name : "Joan";

      const recipeRef = doc(db, "recipes", recipeId);
      const timestamp = new Date().toISOString();

      const noteObject = {
        text: newNote,
        addedBy: userName,
        addedByEmail: user.email,
        addedAt: timestamp,
      };

      // Add the new note to the beginning of the array
      const updatedNotes = [noteObject, ...localNotes];

      await updateDoc(recipeRef, {
        notes: updatedNotes,
      });

      // Update local state immediately
      setLocalNotes(updatedNotes);
      setIsEditingNotes(false);
      setNewNote("");
      setSaving(false);
    } catch (error) {
      console.error("Error saving notes:", error);
      setError("Failed to save notes. Please try again.");
      setSaving(false);
    }
  };

  // Edit existing note
  const handleEditNote = async (index: number) => {
    if (!editedNoteText.trim()) {
      setError("Please enter a note");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const recipeRef = doc(db, "recipes", recipeId);
      const updatedNotes = [...localNotes];
      updatedNotes[index] = {
        ...updatedNotes[index],
        text: editedNoteText,
        editedAt: new Date().toISOString(),
      };

      await updateDoc(recipeRef, {
        notes: updatedNotes,
      });

      // Update local state immediately
      setLocalNotes(updatedNotes);
      setEditingNoteIndex(null);
      setEditedNoteText("");
      setSaving(false);
    } catch (error) {
      console.error("Error editing note:", error);
      setError("Failed to edit note. Please try again.");
      setSaving(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (index: number) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const recipeRef = doc(db, "recipes", recipeId);
      const updatedNotes = localNotes.filter((_, i) => i !== index);

      await updateDoc(recipeRef, {
        notes: updatedNotes,
      });

      // Update local state immediately
      setLocalNotes(updatedNotes);
      setSaving(false);
    } catch (error) {
      console.error("Error deleting note:", error);
      setError("Failed to delete note. Please try again.");
      setSaving(false);
    }
  };

  // Upload photo to Firebase Storage and add to recipe
  const handleUploadPhoto = async (file: File) => {
    setUploadingPhoto(true);
    setPhotoError("");

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setPhotoError("You must be logged in to upload photos");
        setUploadingPhoto(false);
        return null;
      }

      // Get user's name from Firestore
      const userDocRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userName = userDoc.exists() ? userDoc.data().name : "Unknown";

      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop();
      const fileName = `${recipeId}_${timestamp}.${fileExtension}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, `recipe-photos/${recipeId}/${fileName}`);
      await uploadBytes(storageRef, file);

      // Wait for the resize extension to process the image
      // The extension creates files like: filename_1920x1920.webp
      const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
      const resizedFileName = `${fileNameWithoutExt}_1600x1600.webp`;

      // Poll for the resized image (with timeout)
      let photoUrl = "";
      let attempts = 0;
      const maxAttempts = 15; // 15 seconds max wait

      while (attempts < maxAttempts) {
        try {
          const resizedRef = ref(
            storage,
            `recipe-photos/${recipeId}/${resizedFileName}`
          );
          photoUrl = await getDownloadURL(resizedRef);
          break; // Successfully got the resized image
        } catch (error) {
          // Image not ready yet, wait and retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
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
      const photoObject = {
        url: photoUrl,
        addedBy: userName,
        addedByEmail: user.email,
        addedByUserId: user.uid,
        addedAt: new Date().toISOString(),
        fileName: storedFileName,
        originalFileName: fileName, // Keep track of original for cleanup
        fileSize: file.size,
        fileType: photoUrl.includes(".webp") ? "image/webp" : file.type,
      };

      // Add to Firestore
      const recipeRef = doc(db, "recipes", recipeId);
      await updateDoc(recipeRef, {
        photos: arrayUnion(photoObject),
      });

      setUploadingPhoto(false);
      return photoObject;
    } catch (error) {
      console.error("Error uploading photo:", error);
      setPhotoError("Failed to upload photo. Please try again.");
      setUploadingPhoto(false);
      return null;
    }
  };

  // Delete photo from storage and Firestore
  const handleDeletePhoto = async (photo: any) => {
    setUploadingPhoto(true);
    setPhotoError("");

    try {
      // Delete resized version (the one we're using)
      if (photo.fileName) {
        const storageRef = ref(
          storage,
          `recipe-photos/${recipeId}/${photo.fileName}`
        );
        try {
          await deleteObject(storageRef);
        } catch (storageError: any) {
          // If file doesn't exist in storage, continue
          if (storageError.code !== "storage/object-not-found") {
            throw storageError;
          }
        }
      }

      // Also delete original file if it exists and is different
      if (photo.originalFileName && photo.originalFileName !== photo.fileName) {
        const originalRef = ref(
          storage,
          `recipe-photos/${recipeId}/${photo.originalFileName}`
        );
        try {
          await deleteObject(originalRef);
        } catch (storageError: any) {
          // If file doesn't exist, that's okay
          if (storageError.code !== "storage/object-not-found") {
            console.warn("Could not delete original file:", storageError);
          }
        }
      }

      // Remove from Firestore
      const recipeRef = doc(db, "recipes", recipeId);
      await updateDoc(recipeRef, {
        photos: arrayRemove(photo),
      });

      setUploadingPhoto(false);
      return true;
    } catch (error) {
      console.error("Error deleting photo:", error);
      setPhotoError("Failed to delete photo. Please try again.");
      setUploadingPhoto(false);
      return false;
    }
  };

  return {
    // State
    isEditingNotes,
    newNote,
    saving,
    error,
    editingNoteIndex,
    editedNoteText,
    currentUserEmail,
    isFavorited,
    checkingFavorite,
    localNotes,
    uploadingPhoto,
    photoError,
    // Setters
    setIsEditingNotes,
    setNewNote,
    setError,
    setEditingNoteIndex,
    setEditedNoteText,
    setPhotoError,
    // Functions
    handleToggleFavorite,
    handleSaveNotes,
    handleEditNote,
    handleDeleteNote,
    handleUploadPhoto,
    handleDeletePhoto,
  };
};
