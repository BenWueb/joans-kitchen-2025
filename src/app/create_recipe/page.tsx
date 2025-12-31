"use client";

import { useEffect, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useCreateRecipe } from "@/hooks/useCreateRecipe";
import { useRecipePhotos } from "@/hooks/useRecipePhotos";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { usePhotoModal } from "@/hooks/usePhotoModal";
import { useDeletePhotoModal } from "@/hooks/useDeletePhotoModal";
import RecipePhotos from "@/components/recipe/RecipePhotos";
import DeletePhotoModal from "@/components/recipe/modals/DeletePhotoModal";
import PhotoViewerModal from "@/components/recipe/modals/PhotoViewerModal";
import { FILE_LIMITS } from "@/lib/constants";
import { recipeToUrl } from "@/utils/recipeUrl";

function CreateRecipe() {
  const {
    formData,
    submitting,
    error,
    success,
    onChange,
    handleRecipeChange,
    recipeId,
    createRecipeDoc,
  } = useCreateRecipe();
  const router = useRouter();
  const [localPhotos, setLocalPhotos] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const createdRecipeIdRef = useRef<string | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      // Store return URL and redirect to login
      if (typeof window !== "undefined") {
        localStorage.setItem("returnUrl", "/create_recipe");
      }
      router.push("/login");
    } else {
      setCurrentUserId(user.uid);
    }
  }, [router]);

  // Photo hooks (same interface as SingleRecipe)
  const {
    uploadingPhoto,
    photoError,
    uploadPhoto,
    handleDeletePhoto,
    savePhotoOrder,
    setPhotoError,
  } = useRecipePhotos({
    recipeId,
    ensureRecipeId: async () => {
      if (createdRecipeIdRef.current) return createdRecipeIdRef.current;
      if (recipeId) return recipeId;
      throw new Error("Recipe not created yet");
    },
  });

  const {
    fileInputRef,
    handleFileSelect,
    items: uploadItems,
    remainingSlots,
    uploadAll,
    retryItem,
    removeItem,
    clearAll,
  } = usePhotoUpload(
    uploadPhoto,
    setPhotoError,
    Math.max(0, FILE_LIMITS.MAX_PHOTOS_PER_RECIPE - (localPhotos?.length || 0))
  );

  const { showPhotoModal, selectedIndex, openPhotoAt, closePhotoModal } =
    usePhotoModal();

  const {
    showDeleteModal,
    photoToDelete,
    handleDeletePhotoClick,
    confirmDeletePhoto,
    cancelDeletePhoto,
  } = useDeletePhotoModal(handleDeletePhoto);

  const handlePhotoUploaded = (result: any) => {
    setLocalPhotos((prev) => [...prev, result]);
  };

  const handlePhotoDeleted = (photo: any) => {
    setLocalPhotos((prev) => prev.filter((p) => p.url !== photo.url));
  };

  const handleSetCoverPhoto = async (photo: any) => {
    const next = [photo, ...localPhotos.filter((p) => p.url !== photo.url)];
    setLocalPhotos(next);
    await savePhotoOrder(next);
  };

  const handleMovePhoto = async (photo: any, direction: "left" | "right") => {
    const idx = localPhotos.findIndex((p) => p.url === photo.url);
    if (idx === -1) return;
    const swapWith = direction === "left" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= localPhotos.length) return;
    const next = [...localPhotos];
    const tmp = next[idx];
    next[idx] = next[swapWith];
    next[swapWith] = tmp;
    setLocalPhotos(next);
    await savePhotoOrder(next);
  };

  const handleCreateRecipeSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      const { id, formattedTitle } = await createRecipeDoc();
      createdRecipeIdRef.current = id;

      // Upload queued photos (staged) after the recipe doc exists
      if (uploadItems.length > 0) {
        await uploadAll(handlePhotoUploaded);
      }

      // Navigate to the newly created recipe
      router.push(`/${recipeToUrl(formattedTitle)}`);
    } catch {
      // errors are handled inside the hook / upload hooks
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen px-4 pt-20 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-700 text-center mb-8">
              Create New Recipe
            </h1>

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-center">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleCreateRecipeSubmit}>
              {/* Recipe Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Recipe Title *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  id="title"
                  value={formData.title}
                  type="text"
                  placeholder="e.g., Grilled Chicken Salad"
                  onChange={onChange}
                  required
                  disabled={submitting}
                />
              </div>

              {/* Ingredients */}
              <div>
                <label
                  htmlFor="ingredients"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Ingredients *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-37.5"
                  id="ingredients"
                  value={formData.ingredients}
                  placeholder="List all ingredients, one per line"
                  onChange={onChange}
                  required
                  disabled={submitting}
                />
              </div>

              {/* Recipe Instructions */}

              <div>
                <label
                  htmlFor="recipe"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Instructions *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-62.5"
                  id="recipe"
                  value={formData.recipe}
                  placeholder="Start typing instructions. Use a new line for each step."
                  onChange={handleRecipeChange}
                  required
                  disabled={submitting}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Press Enter to automatically number each step
                </p>
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-25"
                  id="notes"
                  value={formData.notes}
                  placeholder="Add any additional notes or tips for this recipe"
                  onChange={onChange}
                  disabled={submitting}
                />
              </div>

              {/* Photo Upload Section (same UI as SingleRecipe) */}
              <RecipePhotos
                photos={localPhotos}
                currentUserId={currentUserId}
                isAdmin={false}
                canManagePhotos={true}
                uploadingPhoto={uploadingPhoto}
                photoError={photoError}
                fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
                onFileSelect={handleFileSelect}
                uploadItems={uploadItems}
                remainingSlots={remainingSlots}
                onUploadAll={uploadAll}
                showUploadAll={false}
                onRetryUpload={retryItem}
                onRemoveUploadItem={removeItem}
                onClearUploads={clearAll}
                onPhotoClick={(_, index) => openPhotoAt(index)}
                onDeletePhotoClick={handleDeletePhotoClick}
                onPhotoUploaded={handlePhotoUploaded}
                onSetCoverPhoto={handleSetCoverPhoto}
                onMovePhoto={handleMovePhoto}
              />

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || uploadingPhoto}
                  className={`flex-1 font-medium py-2.5 rounded-md transition-colors ${
                    submitting || uploadingPhoto
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
                >
                  {submitting
                    ? uploadingPhoto
                      ? "Uploading Photos..."
                      : "Creating Recipe..."
                    : "Create Recipe"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  disabled={submitting}
                  className="px-6 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Photo Modals */}
            <DeletePhotoModal
              show={showDeleteModal}
              photo={photoToDelete}
              uploadingPhoto={uploadingPhoto}
              onCancel={cancelDeletePhoto}
              onConfirm={() =>
                confirmDeletePhoto((photo) => {
                  handlePhotoDeleted(photo);
                })
              }
            />

            <PhotoViewerModal
              show={showPhotoModal}
              photos={localPhotos}
              initialIndex={selectedIndex ?? 0}
              onClose={closePhotoModal}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateRecipe;
