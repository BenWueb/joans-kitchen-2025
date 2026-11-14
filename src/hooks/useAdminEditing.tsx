"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface UseAdminEditingProps {
  recipeId: string;
  title: string;
  ingredients: string;
  recipe: string;
  category?: string;
}

export function useAdminEditing({
  recipeId,
  title,
  ingredients,
  recipe,
  category,
}: UseAdminEditingProps) {
  const router = useRouter();
  const { userData } = useCurrentUser();
  const isAdmin = userData?.isAdmin === true;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingIngredients, setIsEditingIngredients] = useState(false);
  const [isEditingSteps, setIsEditingSteps] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title || "");
  const [editedIngredients, setEditedIngredients] = useState(ingredients || "");
  const [editedSteps, setEditedSteps] = useState(recipe || "");
  const [editedTags, setEditedTags] = useState(category || "");
  const [savingField, setSavingField] = useState(false);
  const [error, setError] = useState("");

  // Reset edited values when props change
  useEffect(() => {
    setEditedTitle(title || "");
    setEditedIngredients(ingredients || "");
    setEditedSteps(recipe || "");
    setEditedTags(category || "");
  }, [title, ingredients, recipe, category]);

  const handleSaveField = async (field: string, value: string): Promise<boolean> => {
    setSavingField(true);
    setError("");
    try {
      if (!["title", "ingredients", "recipe", "category"].includes(field)) {
        throw new Error(`Unknown field: ${field}`);
      }

      await api(`/api/recipes/${recipeId}`, {
        method: "PATCH",
        json: { [field]: value },
      });

      // Reset editing state
      if (field === "title") setIsEditingTitle(false);
      if (field === "ingredients") setIsEditingIngredients(false);
      if (field === "recipe") setIsEditingSteps(false);
      if (field === "category") setIsEditingTags(false);

      // Re-sync any server-rendered recipe data
      router.refresh();
      return true;
    } catch (err: any) {
      console.error("Error updating recipe:", err);
      setError(`Failed to update ${field}: ${err.message}`);
      return false;
    } finally {
      setSavingField(false);
    }
  };

  const handleDeleteUnsplashCache = async (): Promise<boolean> => {
    if (!isAdmin) return false;

    setSavingField(true);
    setError("");
    try {
      await api(`/api/recipes/${recipeId}`, {
        method: "PATCH",
        json: { clearUnsplash: true },
      });

      // Re-sync any server-rendered recipe data
      router.refresh();
      return true;
    } catch (err: any) {
      console.error("Error deleting Unsplash cache:", err);
      setError(`Failed to delete Unsplash data: ${err.message}`);
      return false;
    } finally {
      setSavingField(false);
    }
  };

  return {
    isAdmin,
    isEditingTitle,
    isEditingIngredients,
    isEditingSteps,
    isEditingTags,
    editedTitle,
    editedIngredients,
    editedSteps,
    editedTags,
    savingField,
    error,
    setIsEditingTitle,
    setIsEditingIngredients,
    setIsEditingSteps,
    setIsEditingTags,
    setEditedTitle,
    setEditedIngredients,
    setEditedSteps,
    setEditedTags,
    handleSaveField,
    handleDeleteUnsplashCache,
    setError,
  };
}

