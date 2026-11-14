"use client";

import { useState } from "react";
import { api } from "@/lib/api";

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
      // The API deletes the recipe along with its photos in storage
      await api(`/api/recipes/${recipeToDelete.id}`, { method: "DELETE" });

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
