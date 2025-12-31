"use client";

import { MdDelete } from "react-icons/md";

interface UnsplashInfoProps {
  unsplashImageUrl?: string;
  unsplashPhotographer?: string | null;
  unsplashPhotographerUrl?: string | null;
  savingField: boolean;
  onDeleteCache: () => void;
}

export default function UnsplashInfo({
  unsplashImageUrl,
  unsplashPhotographer,
  unsplashPhotographerUrl,
  savingField,
  onDeleteCache,
}: UnsplashInfoProps) {
  if (!unsplashImageUrl) {
    return null;
  }

  return (
    <div className="bg-linear-to-br from-purple-100 via-indigo-50 to-purple-100 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-bold text-gray-700">Unsplash Image Info</h5>
        <button
          onClick={onDeleteCache}
          disabled={savingField}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
        >
          <MdDelete className="w-4 h-4" />
          Remove Image
        </button>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-white rounded-md border border-gray-200">
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-700 mb-1">Image URL:</p>
            <a
              href={unsplashImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-teal-600 hover:text-teal-700 underline break-all"
            >
              {unsplashImageUrl}
            </a>
          </div>

          {unsplashPhotographer && (
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-700 mb-1">Photographer:</p>
              <p className="text-sm text-gray-600">{unsplashPhotographer}</p>
            </div>
          )}

          {unsplashPhotographerUrl && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Photographer Profile:
              </p>
              <a
                href={unsplashPhotographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-teal-600 hover:text-teal-700 underline break-all"
              >
                {unsplashPhotographerUrl}
              </a>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 italic">
              This is the stored Unsplash image URL for this recipe. Removing it clears
              the stored Unsplash fields.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

