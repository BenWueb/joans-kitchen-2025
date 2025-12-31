"use client";

import { MdEdit } from "react-icons/md";

interface RecipeIngredientsProps {
  ingredients: string;
  isAdmin: boolean;
  isEditing: boolean;
  editedIngredients: string;
  savingField: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onIngredientsChange: (value: string) => void;
  onSave: () => void;
}

export default function RecipeIngredients({
  ingredients,
  isAdmin,
  isEditing,
  editedIngredients,
  savingField,
  onStartEdit,
  onCancelEdit,
  onIngredientsChange,
  onSave,
}: RecipeIngredientsProps) {
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-xl font-bold text-gray-700">Ingredients</h5>
        {isAdmin && !isEditing && (
          <button
            onClick={onStartEdit}
            className="text-teal-600 hover:text-teal-700"
            title="Edit ingredients"
          >
            <MdEdit className="w-5 h-5" />
          </button>
        )}
      </div>

      {isEditing && isAdmin ? (
        <div>
          <textarea
            value={editedIngredients}
            onChange={(e) => onIngredientsChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-600 min-h-40"
            placeholder="Enter ingredients, one per line"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={onSave}
              disabled={savingField}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
            >
              {savingField ? "Saving..." : "Save"}
            </button>
            <button
              onClick={onCancelEdit}
              disabled={savingField}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {ingredients.split(/\n/gm).map((ing, index) => (
            <li key={index} className="text-gray-600 flex items-start gap-2">
              <span className="text-teal-600 font-bold">•</span>
              <span>{ing}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

