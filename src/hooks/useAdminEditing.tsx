"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "@/firestore.config";
import { COLLECTIONS } from "@/lib/constants";

interface UseAdminEditingProps {
  recipeId: string;
  currentUserId: string | null;
  title: string;
  ingredients: string;
  recipe: string;
  category?: string;
}

export function useAdminEditing({
  recipeId,
  currentUserId,
  title,
  ingredients,
  recipe,
  category,
}: UseAdminEditingProps) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
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

  // Check if current user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (currentUserId) {
        try {
          const { checkIsAdmin } = await import("@/lib/firebase-client");
          const isAdminUser = await checkIsAdmin(currentUserId);
          setIsAdmin(isAdminUser);
        } catch (err) {
          console.error("Error checking admin status:", err);
        }
      }
    };
    checkAdmin();
  }, [currentUserId]);

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
      const recipeRef = doc(db, COLLECTIONS.RECIPES, recipeId);
      const updateData: any = {};

      if (field === "title") {
        updateData.title = value;
      } else if (field === "ingredients") {
        updateData.ingredients = value;
      } else if (field === "recipe") {
        updateData.recipe = value;
      } else if (field === "category") {
        updateData.category = value.trim();
      }

      await updateDoc(recipeRef, updateData);

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
      const recipeRef = doc(db, COLLECTIONS.RECIPES, recipeId);
      await updateDoc(recipeRef, {
        unsplashImageUrl: deleteField(),
        unsplashPhotographer: deleteField(),
        unsplashPhotographerUrl: deleteField(),
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

