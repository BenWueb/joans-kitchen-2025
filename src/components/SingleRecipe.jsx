"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRecipeFavorites } from "@/hooks/useRecipeFavorites";
import { useRecipeNotes } from "@/hooks/useRecipeNotes";
import { useRecipePhotos } from "@/hooks/useRecipePhotos";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { usePhotoModal } from "@/hooks/usePhotoModal";
import { useDeletePhotoModal } from "@/hooks/useDeletePhotoModal";
import { useShareRecipe } from "@/hooks/useShareRecipe";
import { useDeleteRecipe } from "@/hooks/useDeleteRecipe";
import { useAdminEditing } from "@/hooks/useAdminEditing";
import { useRecipeImage } from "@/hooks/useRecipeImage";
import { FILE_LIMITS } from "@/lib/constants";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";
import RecipeHeader from "./recipe/RecipeHeader";
import RecipeIngredients from "./recipe/RecipeIngredients";
import RecipeSteps from "./recipe/RecipeSteps";
import RecipeNotes from "./recipe/RecipeNotes";
import RecipePhotos from "./recipe/RecipePhotos";
import UnsplashInfo from "./recipe/UnsplashInfo";
import DeletePhotoModal from "./recipe/modals/DeletePhotoModal";
import PhotoViewerModal from "./recipe/modals/PhotoViewerModal";
import DeleteRecipeModal from "./recipe/modals/DeleteRecipeModal";

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
  unsplashImageUrl,
  category,
  created,
  photos,
}) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [localPhotos, setLocalPhotos] = useState(photos || []);
  const [localTitle, setLocalTitle] = useState(title || "");
  const [localIngredients, setLocalIngredients] = useState(ingredients || "");
  const [localRecipe, setLocalRecipe] = useState(recipe || "");
  const [localCategory, setLocalCategory] = useState(category || "");

  // Recipe favorites hook
  const {
    currentUserId,
    isFavorited,
    checkingFavorite,
    error: favoriteError,
    handleToggleFavorite,
    setError: setFavoriteError,
  } = useRecipeFavorites({ recipeId });

  const isOwner =
    !!currentUserId && !!createdByUserId && currentUserId === createdByUserId;

  // Recipe notes hook
  const {
    isEditingNotes,
    newNote,
    saving,
    error: notesError,
    editingNoteIndex,
    editedNoteText,
    localNotes,
    setIsEditingNotes,
    setNewNote,
    setError: setNotesError,
    setEditingNoteIndex,
    setEditedNoteText,
    handleSaveNotes,
    handleEditNote,
    handleDeleteNote,
  } = useRecipeNotes({
    recipeId,
    notes,
    notesUpdatedBy,
    notesUpdatedAt,
  });

  // Recipe photos hook
  const {
    uploadingPhoto,
    photoError,
    uploadPhoto,
    handleDeletePhoto,
    setPhotoError,
    savePhotoOrder,
  } = useRecipePhotos({ recipeId });

  // Photo upload hook
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

  // Photo modal hook
  const { showPhotoModal, selectedIndex, openPhotoAt, closePhotoModal } =
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
    async () => router.push("/"),
    () => {},
    () => {},
    (msg) => setFavoriteError(msg)
  );

  // Admin editing hook
  const {
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
    error: adminError,
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
  } = useAdminEditing({
    recipeId,
    currentUserId,
    title: localTitle,
    ingredients: localIngredients,
    recipe: localRecipe,
    category: localCategory,
  });

  // Local <-> props sync (when navigating between recipes)
  useEffect(() => {
    setLocalTitle(title || "");
    setLocalIngredients(ingredients || "");
    setLocalRecipe(recipe || "");
    setLocalCategory(category || "");
  }, [title, ingredients, recipe, category]);

  const saveAdminField = async (field, value) => {
    const ok = await handleSaveField(field, value);
    if (!ok) {
      showToast("Save failed", "error");
      return;
    }

    if (field === "title") setLocalTitle(value);
    if (field === "ingredients") setLocalIngredients(value);
    if (field === "recipe") setLocalRecipe(value);
    if (field === "category") setLocalCategory(value);

    showToast("Saved", "success");
  };

  const hasUnsavedChanges =
    (isEditingTitle && editedTitle !== localTitle) ||
    (isEditingIngredients && editedIngredients !== localIngredients) ||
    (isEditingSteps && editedSteps !== localRecipe) ||
    (isEditingTags && editedTags !== localCategory);

  useEffect(() => {
    if (!isAdmin) return;
    const onKeyDown = (e) => {
      const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
      if (!isSave) return;
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      if (savingField) return;

      if (isEditingTitle) return void saveAdminField("title", editedTitle);
      if (isEditingTags) return void saveAdminField("category", editedTags);
      if (isEditingIngredients)
        return void saveAdminField("ingredients", editedIngredients);
      if (isEditingSteps) return void saveAdminField("recipe", editedSteps);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isAdmin,
    hasUnsavedChanges,
    savingField,
    isEditingTitle,
    isEditingTags,
    isEditingIngredients,
    isEditingSteps,
    editedTitle,
    editedTags,
    editedIngredients,
    editedSteps,
  ]);

  // Recipe image hook
  const {
    recipeImage,
    setRecipeImage,
    unsplashPhotographer,
    unsplashPhotographerUrl,
  } = useRecipeImage({
    recipeId,
    title,
    photos: localPhotos,
    unsplashImageUrl,
  });

  // Update local photos when photos prop changes
  useEffect(() => {
    setLocalPhotos(photos || []);
  }, [photos]);

  // Handle photo upload callback
  const handlePhotoUploaded = (result) => {
    setLocalPhotos((prev) => [...prev, result]);
    if (result && result.url) {
      setRecipeImage(result.url);
    }
  };

  // Handle delete photo callback
  const handlePhotoDeleted = (photo) => {
    setLocalPhotos((prev) => prev.filter((p) => p.url !== photo.url));
  };

  // Admin photo ordering helpers
  const handleSetCoverPhoto = async (photo) => {
    const next = [photo, ...localPhotos.filter((p) => p.url !== photo.url)];
    setLocalPhotos(next);
    setRecipeImage(photo.url);
    await savePhotoOrder(next);
  };

  const handleMovePhoto = async (photo, direction) => {
    const idx = localPhotos.findIndex((p) => p.url === photo.url);
    if (idx === -1) return;
    const swapWith = direction === "left" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= localPhotos.length) return;
    const next = [...localPhotos];
    const tmp = next[idx];
    next[idx] = next[swapWith];
    next[swapWith] = tmp;
    setLocalPhotos(next);
    if (next[0]?.url) setRecipeImage(next[0].url);
    await savePhotoOrder(next);
  };

  return (
    <>
      <Toast toast={toast} />

      {isAdmin && hasUnsavedChanges && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          Unsaved changes. Press <strong>Ctrl/Cmd + S</strong> to save.
        </div>
      )}

      <RecipeHeader
        title={localTitle}
        createdBy={createdBy}
        created={created}
        category={localCategory}
        recipeImage={recipeImage}
        createdByUserId={createdByUserId}
        currentUserId={currentUserId}
        isFavorited={isFavorited}
        checkingFavorite={checkingFavorite}
        showCopyNotification={showCopyNotification}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShare}
        onDeleteRecipe={(e) => {
          e.preventDefault();
          handleDeleteRecipeClick(recipeId, title, e);
        }}
        isAdmin={isAdmin}
        isEditingTitle={isEditingTitle}
        isEditingTags={isEditingTags}
        editedTitle={editedTitle}
        editedTags={editedTags}
        savingField={savingField}
        onTitleChange={setEditedTitle}
        onTagsChange={setEditedTags}
        onStartEditTitle={() => setIsEditingTitle(true)}
        onStartEditTags={() => setIsEditingTags(true)}
        onCancelEditTitle={() => {
          setIsEditingTitle(false);
          setEditedTitle(localTitle || "");
        }}
        onCancelEditTags={() => {
          setIsEditingTags(false);
          setEditedTags(localCategory || "");
        }}
        onSaveField={saveAdminField}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecipeIngredients
          ingredients={localIngredients}
          isAdmin={isAdmin}
          isEditing={isEditingIngredients}
          editedIngredients={editedIngredients}
          savingField={savingField}
          onStartEdit={() => setIsEditingIngredients(true)}
          onCancelEdit={() => {
            setIsEditingIngredients(false);
            setEditedIngredients(localIngredients || "");
          }}
          onIngredientsChange={setEditedIngredients}
          onSave={() => saveAdminField("ingredients", editedIngredients)}
        />

        <RecipeSteps
          recipe={localRecipe}
          isAdmin={isAdmin}
          isEditing={isEditingSteps}
          editedSteps={editedSteps}
          savingField={savingField}
          onStartEdit={() => setIsEditingSteps(true)}
          onCancelEdit={() => {
            setIsEditingSteps(false);
            setEditedSteps(localRecipe || "");
          }}
          onStepsChange={setEditedSteps}
          onSave={() => saveAdminField("recipe", editedSteps)}
        />
      </div>

      <RecipeNotes
        notes={localNotes}
        isEditingNotes={isEditingNotes}
        newNote={newNote}
        editingNoteIndex={editingNoteIndex}
        editedNoteText={editedNoteText}
        saving={saving}
        error={notesError || favoriteError || adminError}
        currentUserId={currentUserId}
        onStartAddNote={() => setIsEditingNotes(true)}
        onCancelAddNote={() => {
          setNewNote("");
          setIsEditingNotes(false);
          setNotesError("");
        }}
        onNewNoteChange={setNewNote}
        onSaveNote={handleSaveNotes}
        onStartEditNote={(index) => {
          setEditingNoteIndex(index);
          setEditedNoteText(localNotes[index].text);
        }}
        onCancelEditNote={() => {
          setEditingNoteIndex(null);
          setEditedNoteText("");
        }}
        onEditedNoteChange={setEditedNoteText}
        onSaveEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
      />

      <RecipePhotos
        photos={localPhotos}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        canManagePhotos={isAdmin || isOwner}
        uploadingPhoto={uploadingPhoto}
        photoError={photoError}
        fileInputRef={fileInputRef}
        onFileSelect={handleFileSelect}
        uploadItems={uploadItems}
        remainingSlots={remainingSlots}
        onUploadAll={uploadAll}
        onRetryUpload={retryItem}
        onRemoveUploadItem={removeItem}
        onClearUploads={clearAll}
        onPhotoClick={(_, index) => openPhotoAt(index)}
        onDeletePhotoClick={handleDeletePhotoClick}
        onPhotoUploaded={handlePhotoUploaded}
        onSetCoverPhoto={isAdmin || isOwner ? handleSetCoverPhoto : () => {}}
        onMovePhoto={isAdmin || isOwner ? handleMovePhoto : () => {}}
      />

      {isAdmin && !!unsplashImageUrl && (
        <UnsplashInfo
          unsplashImageUrl={unsplashImageUrl}
          unsplashPhotographer={unsplashPhotographer}
          unsplashPhotographerUrl={unsplashPhotographerUrl}
          savingField={savingField}
          onDeleteCache={async () => {
            const ok = await handleDeleteUnsplashCache();
            showToast(
              ok ? "Unsplash image removed" : "Remove failed",
              ok ? "success" : "error"
            );
          }}
        />
      )}

      {/* Legacy imageUrls section */}
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

      {/* Owner actions */}
      {isOwner && (
        <button
          onClick={(e) => {
            e.preventDefault();
            handleDeleteRecipeClick(recipeId, localTitle, e);
          }}
          className=" w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
        >
          Delete Recipe
        </button>
      )}

      {/* Modals */}
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

      <DeleteRecipeModal
        show={showDeleteRecipeModal}
        recipeTitle={recipeToDelete?.title || ""}
        deleting={deletingRecipe}
        onCancel={cancelDeleteRecipe}
        onConfirm={confirmDeleteRecipe}
      />
    </>
  );
}

export default SingleRecipe;
