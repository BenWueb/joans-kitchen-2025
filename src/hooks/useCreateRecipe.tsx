"use client";

import { useState, useRef } from "react";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firestore.config";
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate files
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select only image files");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Limit to 5 photos total
    const newFiles = [...selectedFiles, ...validFiles].slice(0, 5);
    setSelectedFiles(newFiles);
    setError("");

    // Create previews
    const newPreviews: string[] = [];
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === newFiles.length) {
          setPreviewUrls(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setError("You must be logged in to create a recipe.");
      // Store current path and redirect to login
      if (typeof window !== "undefined") {
        localStorage.setItem("returnUrl", "/create_recipe");
      }
      router.push("/login");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a recipe title.");
      return;
    }

    if (!formData.ingredients.trim()) {
      setError("Please enter ingredients.");
      return;
    }

    if (!formData.recipe.trim()) {
      setError("Please enter recipe instructions.");
      return;
    }

    setSubmitting(true);

    try {
      // Get user info for photo uploads
      const userDocRef = doc(db, "Users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userName = userDoc.exists() ? userDoc.data().name : "Unknown";

      // Format title with proper capitalization (Title Case each word)
      const formattedTitle = formData.title
        .trim()
        .split(" ")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");

      // Capitalize first letter of each ingredient line
      const formattedIngredients = formData.ingredients
        .trim()
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          return trimmed
            ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
            : "";
        })
        .join("\n");

      // Capitalize first letter of each recipe step
      const formattedRecipe = formData.recipe
        .trim()
        .split("\n")
        .map((line) => {
          const trimmed = line.trim();
          return trimmed
            ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
            : "";
        })
        .join("\n");

      // Create recipe document first (without photos)
      const recipeData = {
        title: formattedTitle,
        ingredients: formattedIngredients,
        recipe: formattedRecipe,
        createdBy: user.email || "Unknown",
        createdByUserId: user.uid,
        created: serverTimestamp(),
        notes: formData.notes.trim()
          ? [
              {
                text: formData.notes.trim(),
                addedBy: userName,
                addedByEmail: user.email || "Unknown",
                addedByUserId: user.uid,
                addedAt: new Date().toISOString(),
              },
            ]
          : [], // Initialize with user's note if provided, otherwise empty
        photos: [], // Will be updated if photos are uploaded
      };

      const docRef = await addDoc(collection(db, "recipes"), recipeData);

      // Add recipe ID to user's recipes array
      try {
        await updateDoc(userDocRef, {
          recipes: arrayUnion(docRef.id),
        });
      } catch (updateError) {
        console.error("Error updating user recipes:", updateError);
        // Continue anyway - recipe was created successfully
      }

      // Upload photos if any were selected
      if (selectedFiles.length > 0) {
        setUploadingPhotos(true);
        try {
          const photoObjects = [];

          for (const file of selectedFiles) {
            const timestamp = Date.now() + Math.random(); // Ensure unique names
            const fileExtension = file.name.split(".").pop();
            const fileName = `${docRef.id}_${timestamp}.${fileExtension}`;

            // Upload to Firebase Storage
            const storageRef = ref(
              storage,
              `recipe-photos/${docRef.id}/${fileName}`
            );
            await uploadBytes(storageRef, file);

            // Wait for the resize extension to process the image
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
                  `recipe-photos/${docRef.id}/${resizedFileName}`
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
            const storedFileName = photoUrl.includes("_1600x1600.webp")
              ? resizedFileName
              : fileName;

            // Create photo object
            photoObjects.push({
              url: photoUrl,
              addedBy: userName,
              addedByEmail: user.email || "Unknown",
              addedByUserId: user.uid,
              addedAt: new Date().toISOString(),
              fileName: storedFileName,
            });
          }

          // Update recipe with photos
          await updateDoc(doc(db, "recipes", docRef.id), {
            photos: photoObjects,
          });
          setUploadingPhotos(false);
        } catch (photoError) {
          console.error("Error uploading photos:", photoError);
          setUploadingPhotos(false);
          // Continue anyway - recipe was created successfully
        }
      }

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
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError("");
    setSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    formData,
    submitting,
    error,
    success,
    selectedFiles,
    previewUrls,
    uploadingPhotos,
    fileInputRef,
    onChange,
    handleRecipeChange,
    onSubmit,
    handleFileSelect,
    removePhoto,
    resetForm,
  };
};
