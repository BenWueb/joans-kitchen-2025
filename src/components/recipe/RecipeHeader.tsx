"use client";

import { MdEdit, MdFavorite, MdShare, MdDelete } from "react-icons/md";
import { recipeToUrl } from "@/utils/recipeUrl";

interface RecipeHeaderProps {
  title: string;
  createdBy?: string;
  created?: { seconds: number; nanoseconds: number };
  category?: string;
  recipeImage: string;
  createdByUserId?: string;
  currentUserId: string | null;
  isFavorited: boolean;
  checkingFavorite: boolean;
  showCopyNotification: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onDeleteRecipe: (e: React.MouseEvent) => void;
  // Admin editing props
  isAdmin: boolean;
  isEditingTitle: boolean;
  isEditingTags: boolean;
  editedTitle: string;
  editedTags: string;
  savingField: boolean;
  onTitleChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onStartEditTitle: () => void;
  onStartEditTags: () => void;
  onCancelEditTitle: () => void;
  onCancelEditTags: () => void;
  onSaveField: (field: string, value: string) => void;
}

export default function RecipeHeader({
  title,
  createdBy,
  created,
  category,
  recipeImage,
  createdByUserId,
  currentUserId,
  isFavorited,
  checkingFavorite,
  showCopyNotification,
  onToggleFavorite,
  onShare,
  onDeleteRecipe,
  isAdmin,
  isEditingTitle,
  isEditingTags,
  editedTitle,
  editedTags,
  savingField,
  onTitleChange,
  onTagsChange,
  onStartEditTitle,
  onStartEditTags,
  onCancelEditTitle,
  onCancelEditTags,
  onSaveField,
}: RecipeHeaderProps) {
  return (
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

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/20" />

      {/* Delete Recipe Button */}
      {currentUserId && createdByUserId === currentUserId && (
        <button
          onClick={onDeleteRecipe}
          className="absolute top-4 right-4 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
          title="Delete recipe"
        >
          <MdDelete className="w-5 h-5" />
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 p-8 lg:p-12 max-w-2xl w-full flex flex-col justify-between min-h-400px">
        <div>
          {/* Title with admin edit */}
          {isEditingTitle && isAdmin ? (
            <div className="mb-4">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full p-3 text-4xl lg:text-5xl font-bold text-gray-900 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Recipe title"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onSaveField("title", editedTitle)}
                  disabled={savingField}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
                >
                  {savingField ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={onCancelEditTitle}
                  disabled={savingField}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl lg:text-5xl font-bold text-white capitalize drop-shadow-lg leading-tight">
                {title ? title.toLowerCase() : "Untitled Recipe"}
              </h1>
              {isAdmin && (
                <button
                  onClick={onStartEditTitle}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                  title="Edit title"
                >
                  <MdEdit className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          )}

          {createdBy && (
            <p className="text-base text-white/90 mb-3">
              by <span className="font-semibold text-teal-300">{createdBy}</span>
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

          {category && (
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                {category}
              </span>
              {isAdmin && (
                <button
                  onClick={onStartEditTags}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30"
                  title="Edit category"
                >
                  <MdEdit className="w-3 h-3 inline mr-1" />
                  Edit
                </button>
              )}
            </div>
          )}

          {isEditingTags && isAdmin && (
            <div className="mt-3">
              <input
                type="text"
                value={editedTags}
                onChange={(e) => onTagsChange(e.target.value)}
                className="w-full p-2 text-sm text-gray-900 bg-white/90 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Enter category"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => onSaveField("category", editedTags)}
                  disabled={savingField}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded disabled:opacity-50"
                >
                  {savingField ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={onCancelEditTags}
                  disabled={savingField}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 items-center self-start mt-6">
          <button
            onClick={onToggleFavorite}
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

          <button
            onClick={onShare}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all border border-white/30"
            title="Share recipe"
          >
            <MdShare className="w-6 h-6 text-white" />
          </button>

          {showCopyNotification && (
            <div className="bg-white/95 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-lg shadow-xl border border-white/30 animate-fade-in">
              <p className="text-sm font-semibold">Link copied!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

