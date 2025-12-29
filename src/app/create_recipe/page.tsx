"use client";

import { useEffect } from "react";
import { getAuth } from "firebase/auth";
import { useRouter } from "next/navigation";
import { MdClose, MdAddPhotoAlternate } from "react-icons/md";
import Navbar from "@/components/Navbar";
import { useCreateRecipe } from "@/hooks/useCreateRecipe";

function CreateRecipe() {
  const {
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
  } = useCreateRecipe();
  const router = useRouter();

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
    }
  }, [router]);

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

            <form className="space-y-6" onSubmit={onSubmit}>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[150px]"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[250px]"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[100px]"
                  id="notes"
                  value={formData.notes}
                  placeholder="Add any additional notes or tips for this recipe"
                  onChange={onChange}
                  disabled={submitting}
                />
              </div>

              {/* Photo Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photos (Optional)
                </label>
                <div className="space-y-3">
                  {/* File Input */}
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      disabled={submitting || selectedFiles.length >= 5}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer transition-colors ${
                        submitting || selectedFiles.length >= 5
                          ? "bg-gray-100 cursor-not-allowed"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <MdAddPhotoAlternate className="w-5 h-5 text-teal-600" />
                      <span className="text-sm text-gray-700">
                        {selectedFiles.length >= 5
                          ? "Max 5 photos"
                          : "Add Photos"}
                      </span>
                    </label>
                    <span className="text-xs text-gray-500">
                      {selectedFiles.length}/5 photos
                    </span>
                  </div>

                  {/* Photo Previews */}
                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {previewUrls.map((url, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
                        >
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            disabled={submitting}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          >
                            <MdClose className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Upload up to 5 photos. Max 5MB per photo.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || uploadingPhotos}
                  className={`flex-1 font-medium py-2.5 rounded-md transition-colors ${
                    submitting || uploadingPhotos
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-teal-600 hover:bg-teal-700 text-white"
                  }`}
                >
                  {submitting
                    ? uploadingPhotos
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
          </div>
        </div>
      </div>
    </>
  );
}

export default CreateRecipe;
