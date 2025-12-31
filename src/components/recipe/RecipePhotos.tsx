"use client";

import { useEffect, useState } from "react";
import { MdUpload, MdDelete, MdClose, MdMoreVert, MdStar, MdChevronLeft, MdChevronRight, MdContentCopy, MdOpenInNew } from "react-icons/md";

interface Photo {
  url: string;
  addedBy: string;
  addedByUserId?: string;
  addedAt: string;
}

interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  status: "queued" | "uploading" | "processing" | "done" | "error";
  progress: number;
  error?: string;
}

interface RecipePhotosProps {
  photos: Photo[];
  currentUserId: string | null;
  isAdmin: boolean;
  canManagePhotos?: boolean;
  uploadingPhoto: boolean;
  photoError: string;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadItems: UploadItem[];
  remainingSlots: number;
  onUploadAll: (callback: (photo: Photo) => void) => void;
  onRetryUpload: (id: string, callback: (photo: Photo) => void) => void;
  onRemoveUploadItem: (id: string) => void;
  onClearUploads: () => void;
  onPhotoClick: (photo: Photo, index: number) => void;
  onDeletePhotoClick: (photo: Photo) => void;
  onPhotoUploaded: (photo: Photo) => void;
  onSetCoverPhoto: (photo: Photo) => void;
  onMovePhoto: (photo: Photo, direction: "left" | "right") => void;
}

export default function RecipePhotos({
  photos,
  currentUserId,
  isAdmin,
  canManagePhotos = isAdmin,
  uploadingPhoto,
  photoError,
  fileInputRef,
  onFileSelect,
  uploadItems,
  remainingSlots,
  onUploadAll,
  onRetryUpload,
  onRemoveUploadItem,
  onClearUploads,
  onPhotoClick,
  onDeletePhotoClick,
  onPhotoUploaded,
  onSetCoverPhoto,
  onMovePhoto,
}: RecipePhotosProps) {
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);

  // Close the actions menu when clicking/tapping outside of it
  useEffect(() => {
    if (openMenuIndex === null) return;

    const handler = (e: Event) => {
      const target = e.target as Element | null;
      if (!target) return;
      if (target.closest('[data-photo-menu="true"]')) return;
      setOpenMenuIndex(null);
    };

    document.addEventListener("mousedown", handler, true);
    document.addEventListener("touchstart", handler, true);
    return () => {
      document.removeEventListener("mousedown", handler, true);
      document.removeEventListener("touchstart", handler, true);
    };
  }, [openMenuIndex]);

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // no-op
    }
  };

  return (
    <div className="bg-linear-to-br from-teal-100 via-cyan-50 to-teal-100 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-bold text-gray-700">Photos</h5>
        {currentUserId && remainingSlots > 0 && (
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
        multiple
        onChange={onFileSelect}
        className="hidden"
      />

      {/* Upload queue */}
      {uploadItems.length > 0 && (
        <div className="mb-4 p-3 sm:p-4 bg-white rounded-lg border-2 border-teal-200">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-sm font-semibold text-gray-700">
              Ready to upload ({uploadItems.length})
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onUploadAll(onPhotoUploaded)}
                disabled={uploadingPhoto}
                aria-label="Upload all"
                className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <MdUpload className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {uploadingPhoto ? "Uploading..." : "Upload All"}
                </span>
              </button>
              <button
                onClick={onClearUploads}
                disabled={uploadingPhoto}
                aria-label="Clear uploads"
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                <MdClose className="w-5 h-5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {uploadItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-2 rounded-md border border-gray-200"
              >
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-[11px] sm:text-xs text-gray-500 shrink-0 tabular-nums">
                      {Math.round(item.progress)}%
                    </p>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-500 mb-1">
                    {(item.file.size / 1024).toFixed(0)} KB •{" "}
                    {item.status === "processing"
                      ? "Processing…"
                      : item.status === "uploading"
                      ? "Uploading…"
                      : item.status === "done"
                      ? "Done"
                      : item.status === "error"
                      ? "Failed"
                      : "Queued"}
                  </p>
                  <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-teal-600 transition-all duration-150"
                      style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                    />
                  </div>
                  {item.error && (
                    <p className="text-[11px] sm:text-xs text-red-600 mt-1">
                      {item.error}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {item.status === "error" && (
                    <button
                      onClick={() => onRetryUpload(item.id, onPhotoUploaded)}
                      disabled={uploadingPhoto}
                      className="text-xs text-teal-700 hover:text-teal-800"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveUploadItem(item.id)}
                    disabled={uploadingPhoto}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
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
        {photos && photos.length > 0 ? (
          photos.map((photo, index) => (
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
                onClick={() => onPhotoClick(photo, index)}
                className="absolute inset-0 z-0 cursor-pointer"
                title="View photo"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-black/90 via-black/60 to-transparent pointer-events-none z-10" />

              {/* Info overlay */}
              <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 text-white pointer-events-none z-10">
                <div className="flex items-center gap-2">
                  <p className="text-xs sm:text-sm font-semibold mb-0.5 truncate">
                    {photo.addedBy}
                  </p>
                  {index === 0 && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-teal-600/90">
                      Cover
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs opacity-90">
                  {new Date(photo.addedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>

              {/* Actions menu */}
              <div className="absolute top-2 left-2 z-20" data-photo-menu="true">
                <button
                  onClick={() => setOpenMenuIndex(openMenuIndex === index ? null : index)}
                  className="p-2 bg-black/50 hover:bg-black/60 text-white rounded-full shadow-lg"
                  aria-label="Photo actions"
                >
                  <MdMoreVert className="w-4 h-4" />
                </button>
                {openMenuIndex === index && (
                  <div className="absolute mt-2 w-44 bg-white rounded-md shadow-xl border border-gray-200 overflow-hidden">
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        setOpenMenuIndex(null);
                        onPhotoClick(photo, index);
                      }}
                    >
                      <MdOpenInNew className="w-4 h-4" /> View
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        setOpenMenuIndex(null);
                        window.open(photo.url, "_blank", "noopener,noreferrer");
                      }}
                    >
                      <MdOpenInNew className="w-4 h-4" /> Open
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        setOpenMenuIndex(null);
                        handleCopyLink(photo.url);
                      }}
                    >
                      <MdContentCopy className="w-4 h-4" /> Copy link
                    </button>
                    {canManagePhotos && (
                      <>
                        <div className="h-px bg-gray-200" />
                        <button
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenuIndex(null);
                            onSetCoverPhoto(photo);
                          }}
                        >
                          <MdStar className="w-4 h-4" /> Set cover
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenuIndex(null);
                            onMovePhoto(photo, "left");
                          }}
                        >
                          <MdChevronLeft className="w-4 h-4" /> Move left
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => {
                            setOpenMenuIndex(null);
                            onMovePhoto(photo, "right");
                          }}
                        >
                          <MdChevronRight className="w-4 h-4" /> Move right
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Delete button */}
              {(isAdmin || (currentUserId && currentUserId === photo.addedByUserId)) && (
                <button
                  onClick={() => onDeletePhotoClick(photo)}
                  disabled={uploadingPhoto}
                  className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg z-20"
                  title="Delete photo"
                >
                  <MdDelete className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm italic col-span-full">No photos yet</p>
        )}
      </div>
    </div>
  );
}

