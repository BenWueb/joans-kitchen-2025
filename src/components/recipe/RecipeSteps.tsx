"use client";

import { MdEdit } from "react-icons/md";

interface RecipeStepsProps {
  recipe: string;
  isAdmin: boolean;
  isEditing: boolean;
  editedSteps: string;
  savingField: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onStepsChange: (value: string) => void;
  onSave: () => void;
}

export default function RecipeSteps({
  recipe,
  isAdmin,
  isEditing,
  editedSteps,
  savingField,
  onStartEdit,
  onCancelEdit,
  onStepsChange,
  onSave,
}: RecipeStepsProps) {
  if (!recipe || recipe.length === 0) {
    return null;
  }

  // Split steps - handle empty recipe gracefully
  const steps = recipe.split(/\d[.]/gm);
  if (steps.length > 0 && steps[0] === "") {
    steps.shift();
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h5 className="text-xl font-bold text-gray-700">Steps</h5>
        {isAdmin && !isEditing && (
          <button
            onClick={onStartEdit}
            className="text-teal-600 hover:text-teal-700"
            title="Edit steps"
          >
            <MdEdit className="w-5 h-5" />
          </button>
        )}
      </div>

      {isEditing && isAdmin ? (
        <div>
          <textarea
            value={editedSteps}
            onChange={(e) => onStepsChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-600 min-h-40"
            placeholder="Enter steps with numbers (e.g., '1. First step 2. Second step')"
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
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={index} className="text-gray-600 flex gap-3">
              <span className="font-bold text-teal-600 shrink-0">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

