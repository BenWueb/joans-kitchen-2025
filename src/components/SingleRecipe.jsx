"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MdFavorite,
  MdAdd,
  MdEdit,
  MdDelete,
  MdUpload,
  MdShare,
} from "react-icons/md";
import { getAuth } from "firebase/auth";
import { useRecipeActions } from "@/hooks/useRecipeActions";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { usePhotoModal } from "@/hooks/usePhotoModal";
import { useDeletePhotoModal } from "@/hooks/useDeletePhotoModal";
import { useShareRecipe } from "@/hooks/useShareRecipe";
import { useDeleteRecipe } from "@/hooks/useDeleteRecipe";

function SingleRecipe({
  recipeId,
  title,
  ingredients,
  recipe,
  notes,
  notesUpdatedBy,
  notesUpdatedAt,
  createdBy,
  createdByUserId,
  imageUrls,
  tags,
  created,
  photos,
}) {
  const {
    isEditingNotes,
    newNote,
    saving,
    error,
    editingNoteIndex,
    editedNoteText,
    currentUserId,
    isFavorited,
    checkingFavorite,
    localNotes,
    uploadingPhoto,
    photoError,
    setIsEditingNotes,
    setNewNote,
    setError,
    setEditingNoteIndex,
    setEditedNoteText,
    setPhotoError,
    handleToggleFavorite,
    handleSaveNotes,
    handleEditNote,
    handleDeleteNote,
    handleUploadPhoto,
    handleDeletePhoto,
  } = useRecipeActions(recipeId, notes, notesUpdatedBy, notesUpdatedAt);

  // Photo upload hook
  const {
    selectedFile,
    previewUrl,
    fileInputRef,
    handleFileSelect,
    handleUploadClick,
    clearSelection,
  } = usePhotoUpload(handleUploadPhoto, setPhotoError);

  // Photo modal hook
  const { showPhotoModal, selectedPhoto, handlePhotoClick, closePhotoModal } =
    usePhotoModal();

  // Delete photo modal hook
  const {
    showDeleteModal,
    photoToDelete,
    handleDeletePhotoClick,
    confirmDeletePhoto,
    cancelDeletePhoto,
  } = useDeletePhotoModal(handleDeletePhoto);

  // Share recipe hook
  const { showCopyNotification, handleShare } = useShareRecipe();

  const router = useRouter();

  // Delete recipe hook
  const {
    showDeleteModal: showDeleteRecipeModal,
    recipeToDelete,
    deleting: deletingRecipe,
    handleDeleteRecipeClick,
    cancelDelete: cancelDeleteRecipe,
    confirmDeleteRecipe,
  } = useDeleteRecipe(
    currentUserId,
    async () => {
      // After deletion, redirect to home
      router.push("/");
    },
    () => {}, // No local state to update
    () => {}, // Success handled by redirect
    (msg) => setError(msg) // Error message
  );

  const [localPhotos, setLocalPhotos] = useState(photos || []);

  const recipeImage =
    (photos && photos.length > 0 ? photos[0].url : null) ||
    imageUrls?.[0] ||
    "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/jason-briscoe-GliaHAJ3_5A-unsplash.jpg?alt=media&token=592afcb6-578a-456b-8fa9-83d1125b3a6a";

  // Update local photos when photos prop changes
  useEffect(() => {
    setLocalPhotos(photos || []);
  }, [photos]);

  // Remove early return - let page display even if recipe is empty
  // Split steps - handle empty recipe gracefully
  const steps = recipe ? recipe.split(/\d[.]/gm) : [];
  if (steps.length > 0 && steps[0] === "") {
    steps.shift();
  }

  // Convert recipe title to url format - handle empty title
  // Replace spaces with underscores, then capitalize any letter that follows a non-letter
  const searchUrl = title
    ? title
        .replace(/\s/g, "_")
        .replace(
          /(^|[^a-zA-Z])([a-z])/g,
          (match, p1, p2) => p1 + p2.toUpperCase()
        )
    : "";

  return (
    <>
      {/* Recipe Title Section */}
      <div className="relative rounded-lg shadow-lg overflow-hidden mb-6 min-h-25 flex items-center group">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('${recipeImage}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Gradient Overlay - dark on left, lighter on right */}
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/20" />

        {/* Delete Recipe Button - top right, visible on hover for owner */}
        {currentUserId && createdByUserId === currentUserId && (
          <button
            onClick={(e) => {
              e.preventDefault();
              handleDeleteRecipeClick(recipeId, title, e);
            }}
            className="absolute top-4 right-4 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
            title="Delete recipe"
          >
            <MdDelete className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="relative z-10 p-8 lg:p-12 max-w-2xl w-full flex flex-col justify-between min-h-400px">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 capitalize drop-shadow-lg leading-tight">
              {title ? title.toLowerCase() : "Untitled Recipe"}
            </h1>
            {createdBy && (
              <p className="text-base text-white/90 mb-3">
                by{" "}
                <span className="font-semibold text-teal-300">{createdBy}</span>
              </p>
            )}
            {created && (
              <p className="text-sm text-white/80 mb-5">
                Created on{" "}
                {new Date(created.seconds * 1000).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 items-center self-start mt-6">
            {/* Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              disabled={checkingFavorite}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all disabled:opacity-50 border border-white/30"
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <MdFavorite
                className={`w-6 h-6 transition-colors ${
                  isFavorited ? "text-red-500" : "text-white"
                }`}
              />
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all border border-white/30"
              title="Share recipe"
            >
              <MdShare className="w-6 h-6 text-white" />
            </button>

            {/* Copy Notification */}
            {showCopyNotification && (
              <div className="bg-white/95 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg shadow-xl border border-white/30 animate-fade-in">
                <p className="text-sm font-semibold">Link copied!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {ingredients && ingredients.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h5 className="text-xl font-bold text-gray-700 mb-4">
              Ingredients
            </h5>
            <ul className="space-y-2">
              {ingredients.split(/\n/gm).map((ing, index) => (
                <li
                  key={index}
                  className="text-gray-600 flex items-start gap-2"
                >
                  <span className="text-teal-600 font-bold">•</span>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {recipe && recipe.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h5 className="text-xl font-bold text-gray-700 mb-4">Steps</h5>
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={index} className="text-gray-600 flex gap-3">
                  <span className="font-bold text-teal-600 shrink-0">
                    {index + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="bg-linear-to-br from-teal-100 via-cyan-50 to-teal-100 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h5 className="text-lg font-bold text-gray-700">Notes</h5>
          {!isEditingNotes && getAuth().currentUser && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-md transition-colors"
            >
              <MdAdd className="w-4 h-4" />
              Add Note
            </button>
          )}
        </div>

        {isEditingNotes && (
          <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            {error && (
              <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-600 min-h-25"
              placeholder="Add your note here..."
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => {
                  setNewNote("");
                  setIsEditingNotes(false);
                  setError("");
                }}
                disabled={saving}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {localNotes.length > 0 ? (
            localNotes.map((note, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-md border border-gray-200"
              >
                {editingNoteIndex === index ? (
                  <div>
                    <textarea
                      value={editedNoteText}
                      onChange={(e) => setEditedNoteText(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-600 min-h-25 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditNote(index)}
                        disabled={saving}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteIndex(null);
                          setEditedNoteText("");
                        }}
                        disabled={saving}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-gray-600 flex-1">{note.text}</p>
                      {currentUserId &&
                        note.addedByUserId === currentUserId &&
                        editingNoteIndex === null &&
                        !isEditingNotes && (
                          <div className="flex gap-2 ml-2">
                            <button
                              onClick={() => {
                                setEditingNoteIndex(index);
                                setEditedNoteText(note.text);
                              }}
                              className="text-teal-600 hover:text-teal-700"
                              title="Edit note"
                            >
                              <MdEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(index)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete note"
                            >
                              <MdDelete className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                    </div>
                    <div className="text-xs text-gray-500 italic">
                      {note.addedBy}
                      {note.addedBy.toLowerCase() !== "joan" && (
                        <>
                          {" "}
                          •{" "}
                          {new Date(note.addedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {note.editedAt && " (edited)"}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic">No notes yet</p>
          )}
        </div>
      </div>

      {/* Photos Section */}
      <div className="bg-linear-to-br from-teal-100 via-cyan-50 to-teal-100 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-lg font-bold text-gray-700">Photos</h5>
          {currentUserId && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-md transition-colors"
              disabled={uploadingPhoto}
            >
              <MdUpload className="w-4 h-4" />
              Add Photo
            </button>
          )}
        </div>

        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Preview and upload section */}
        {selectedFile && previewUrl && (
          <div className="mb-4 p-4 bg-white rounded-lg border-2 border-teal-200">
            <div className="flex items-start gap-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-32 h-32 object-cover rounded"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>File:</strong> {selectedFile.name}
                </p>
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Size:</strong> {(selectedFile.size / 1024).toFixed(2)}{" "}
                  KB
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleUploadClick((result) => {
                        setLocalPhotos((prev) => [...prev, result]);
                        // Update header background to use the newly uploaded photo
                        if (result && result.url) {
                          setRecipeImage(result.url);
                        }
                      })
                    }
                    disabled={uploadingPhoto}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingPhoto ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    onClick={clearSelection}
                    disabled={uploadingPhoto}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {photoError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {photoError}
          </div>
        )}

        {/* Photos grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {localPhotos && localPhotos.length > 0 ? (
            localPhotos.map((photo, index) => (
              <div
                key={index}
                className="relative group aspect-square overflow-hidden rounded-lg shadow-lg"
              >
                {/* Photo */}
                <img
                  src={photo.url}
                  alt={`Photo by ${photo.addedBy}`}
                  className="w-full h-full object-cover"
                />

                {/* Clickable overlay to view in modal */}
                <button
                  onClick={() => handlePhotoClick(photo)}
                  className="absolute inset-0 z-0 cursor-pointer"
                  title="View photo"
                />

                {/* Sharp gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/90 via-black/60 to-transparent pointer-events-none z-10" />

                {/* Info overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 p-3 text-white pointer-events-none z-10">
                  <p className="text-sm font-semibold mb-0.5">
                    {photo.addedBy}
                  </p>
                  <p className="text-xs opacity-90">
                    {new Date(photo.addedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Delete button - visible on hover for owner */}
                {currentUserId === photo.addedByUserId && (
                  <button
                    onClick={() => handleDeletePhotoClick(photo)}
                    disabled={uploadingPhoto}
                    className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg z-20"
                    title="Delete photo"
                  >
                    <MdDelete className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm italic col-span-full">
              No photos yet
            </p>
          )}
        </div>
      </div>

      {imageUrls && imageUrls.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h5 className="text-xl font-bold text-gray-700 mb-4">Photos</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {imageUrls.map((img, index) => (
              <a
                key={index}
                href={img}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square overflow-hidden rounded-md border border-gray-200 hover:border-teal-500 transition-colors"
              >
                <img
                  src={img}
                  alt={`Recipe photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <MdDelete className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Delete Photo
                </h3>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to delete this photo? This action cannot
                  be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={cancelDeletePhoto}
                disabled={uploadingPhoto}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmDeletePhoto((photo) => {
                    setLocalPhotos((prev) =>
                      prev.filter((p) => p.url !== photo.url)
                    );
                  })
                }
                disabled={uploadingPhoto}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhoto ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {showPhotoModal && selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={closePhotoModal}
        >
          <div
            className="relative max-w-6xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closePhotoModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-sm flex items-center gap-2 bg-black/50 px-4 py-2 rounded-md transition-colors"
            >
              <span>Close</span>
              <span className="text-2xl">&times;</span>
            </button>

            {/* Image container with overlay */}
            <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
              <img
                src={selectedPhoto.url}
                alt={`Photo by ${selectedPhoto.addedBy}`}
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              {/* Photo info - bottom left */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg p-4 shadow-2xl">
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Uploaded by:</strong> {selectedPhoto.addedBy}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(selectedPhoto.addedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Open in new tab link - bottom right */}
              <a
                href={selectedPhoto.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2 shadow-2xl"
              >
                <span>Open in New Tab</span>
                <span className="text-lg">↗</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Delete Recipe Confirmation Modal */}
      {showDeleteRecipeModal && recipeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <MdDelete className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Delete Recipe
                </h3>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to delete{" "}
                  <strong>"{recipeToDelete.title}"</strong>? This action cannot
                  be undone and will permanently delete all recipe data
                  including photos and notes.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={cancelDeleteRecipe}
                disabled={deletingRecipe}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRecipe}
                disabled={deletingRecipe}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingRecipe ? "Deleting..." : "Delete Recipe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default SingleRecipe;
