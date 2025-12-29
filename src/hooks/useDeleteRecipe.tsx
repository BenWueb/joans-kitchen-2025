"use client";

import { useState } from "react";
import {
  doc,
  updateDoc,
  getDoc,
  deleteDoc,
  arrayRemove,
} from "firebase/firestore";
import { ref, deleteObject, listAll } from "firebase/storage";
import { db, storage } from "@/firestore.config";

interface RecipeToDelete {
  id: string;
  title: string;
}

export const useDeleteRecipe = (
  currentUserId: string | undefined,
  refetchUserData: () => Promise<void>,
  setUserRecipes: React.Dispatch<React.SetStateAction<Array<any>>>,
  setSuccess: (msg: string) => void,
  setError: (msg: string) => void
) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeToDelete | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  // Handle delete recipe click
  const handleDeleteRecipeClick = (
    recipeId: string,
    recipeTitle: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setRecipeToDelete({ id: recipeId, title: recipeTitle });
    setShowDeleteModal(true);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setRecipeToDelete(null);
  };

  // Confirm delete recipe
  const confirmDeleteRecipe = async () => {
    if (!recipeToDelete || !currentUserId) return;

    setDeleting(true);
    try {
      // Get recipe data to access photos
      const recipeDoc = await getDoc(doc(db, "recipes", recipeToDelete.id));
      const recipeData = recipeDoc.data();

      // Delete all photos from Firebase Storage
      if (recipeData?.photos && recipeData.photos.length > 0) {
        try {
          // Delete all resized photos (originals are auto-deleted by resize extension)
          const folderRef = ref(storage, `recipe-photos/${recipeToDelete.id}`);
          const fileList = await listAll(folderRef);

          const deletePromises = fileList.items.map((fileRef) =>
            deleteObject(fileRef)
          );
          await Promise.all(deletePromises);
        } catch (storageError) {
          console.error("Error deleting photos from storage:", storageError);
          // Continue with recipe deletion even if photo deletion fails
        }
      }

      // Delete recipe from Firestore
      await deleteDoc(doc(db, "recipes", recipeToDelete.id));

      // Remove recipe ID from user's recipes array
      const userDocRef = doc(db, "Users", currentUserId);
      await updateDoc(userDocRef, {
        recipes: arrayRemove(recipeToDelete.id),
      });

      // Update local state
      setUserRecipes((prev) => prev.filter((r) => r.id !== recipeToDelete.id));

      // Refetch user data to update the recipes list
      await refetchUserData();

      setSuccess(`Recipe "${recipeToDelete.title}" deleted successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error deleting recipe:", error);
      setError("Failed to delete recipe. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setRecipeToDelete(null);
    }
  };

  return {
    showDeleteModal,
    recipeToDelete,
    deleting,
    handleDeleteRecipeClick,
    cancelDelete,
    confirmDeleteRecipe,
  };
};
