"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/firestore.config";
import { recipeToUrl } from "@/utils/recipeUrl";

interface RecipeFormData {
  title: string;
  ingredients: string;
  recipe: string;
  notes: string;
}

export const useCreateRecipe = () => {
  const [formData, setFormData] = useState<RecipeFormData>({
    title: "",
    ingredients: "",
    recipe: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const router = useRouter();

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  const handleRecipeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // If field is empty and user is typing the first character, add "1. " prefix
    if (formData.recipe.trim() === "" && value.length === 1 && value !== "\n") {
      const newValue = `1. ${value}`;
      setFormData((prevState) => ({
        ...prevState,
        recipe: newValue,
      }));

      // Set cursor position after "1. " and the typed character
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = newValue.length;
      }, 0);
      return;
    }

    // Check if user just pressed Enter (added a newline)
    if (
      value.length > formData.recipe.length &&
      value[cursorPosition - 1] === "\n"
    ) {
      // Count existing steps to determine next number
      const lines = value.substring(0, cursorPosition - 1).split("\n");
      const stepCount = lines.filter((line) =>
        /^\d+\./.test(line.trim())
      ).length;
      const nextNumber = stepCount + 1;

      // Insert step number after the newline
      const newValue =
        value.substring(0, cursorPosition) +
        `${nextNumber}. ` +
        value.substring(cursorPosition);
      setFormData((prevState) => ({
        ...prevState,
        recipe: newValue,
      }));

      // Set cursor position after the inserted number
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd =
          cursorPosition + `${nextNumber}. `.length;
      }, 0);
    } else {
      setFormData((prevState) => ({
        ...prevState,
        recipe: value,
      }));
    }
  };

  const createRecipeDoc = async (): Promise<{ id: string; formattedTitle: string }> => {
    setError("");
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("You must be logged in to create a recipe.");
      if (typeof window !== "undefined") {
        localStorage.setItem("returnUrl", "/create_recipe");
      }
      router.push("/login");
      throw new Error("Not authenticated");
    }

    if (!formData.title.trim()) {
      setError("Please enter a recipe title.");
      throw new Error("Missing title");
    }
    if (!formData.ingredients.trim()) {
      setError("Please enter ingredients.");
      throw new Error("Missing ingredients");
    }
    if (!formData.recipe.trim()) {
      setError("Please enter recipe instructions.");
      throw new Error("Missing recipe");
    }

    // Get user info
    const userDocRef = doc(db, "Users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userName = userDoc.exists() ? userDoc.data().name : "Unknown";

    // Format title with proper capitalization (Title Case each word)
    const formattedTitle = formData.title
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Capitalize first letter of each ingredient line
    const formattedIngredients = formData.ingredients
      .trim()
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : "";
      })
      .join("\n");

    // Capitalize first letter of each recipe step
    const formattedRecipe = formData.recipe
      .trim()
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : "";
      })
      .join("\n");

    const notesArray = formData.notes.trim()
      ? [
          {
            text: formData.notes.trim(),
            addedBy: userName,
            addedByEmail: user.email || "Unknown",
            addedByUserId: user.uid,
            addedAt: new Date().toISOString(),
          },
        ]
      : [];

    // Create recipe document (without photos)
    const docRef = await addDoc(collection(db, "recipes"), {
      title: formattedTitle,
      ingredients: formattedIngredients,
      recipe: formattedRecipe,
      category: "",
      createdBy: user.email || "Unknown",
      createdByUserId: user.uid,
      created: serverTimestamp(),
      notes: notesArray,
      photos: [],
    });
    setRecipeId(docRef.id);

    // Add recipe ID to user's recipes array (best effort)
    try {
      await updateDoc(userDocRef, { recipes: arrayUnion(docRef.id) });
    } catch (e) {
      console.error("Error updating user recipes:", e);
    }

    return { id: docRef.id, formattedTitle };
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const auth = getAuth();
    const user = auth.currentUser;

    setSubmitting(true);

    try {
      const { formattedTitle } = await createRecipeDoc();

      setSuccess("Recipe created successfully!");

      // Redirect to the new recipe page after a short delay
      setTimeout(() => {
        // Replace spaces with underscores, capitalize any letter after non-letter
        const recipeUrl = recipeToUrl(formattedTitle);
        router.push(`/${recipeUrl}`);
      }, 1500);
    } catch (error: any) {
      console.error("Error creating recipe:", error);
      setError("Failed to create recipe. Please try again.");
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      ingredients: "",
      recipe: "",
      notes: "",
    });
    setError("");
    setSuccess("");
    setRecipeId(null);
  };

  return {
    formData,
    submitting,
    error,
    success,
    recipeId,
    onChange,
    handleRecipeChange,
    onSubmit,
    createRecipeDoc,
    resetForm,
  };
};
