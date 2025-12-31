"use client";

import { MdDelete } from "react-icons/md";

interface DeleteRecipeModalProps {
  show: boolean;
  recipeTitle: string;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteRecipeModal({
  show,
  recipeTitle,
  deleting,
  onCancel,
  onConfirm,
}: DeleteRecipeModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <MdDelete className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Recipe</h3>
            <p className="text-gray-600 text-sm">
              Are you sure you want to delete <strong>"{recipeTitle}"</strong>? This
              action cannot be undone and will permanently delete all recipe data
              including photos and notes.
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete Recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}

