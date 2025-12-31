"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface Photo {
  url: string;
  addedBy: string;
  addedAt: string;
}

interface PhotoViewerModalProps {
  show: boolean;
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoViewerModal({
  show,
  photos,
  initialIndex,
  onClose,
}: PhotoViewerModalProps) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!show) return;
    setIndex(Math.min(Math.max(0, initialIndex), Math.max(0, photos.length - 1)));
    setZoomed(false);
  }, [show, initialIndex, photos.length]);

  const photo = useMemo(() => photos[index] || null, [photos, index]);

  useEffect(() => {
    if (!show) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(photos.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show, onClose, photos.length]);

  if (!show || !photo) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-6xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 sm:-top-12 right-0 text-white hover:text-gray-300 text-xs sm:text-sm flex items-center gap-2 bg-black/50 px-3 sm:px-4 py-2 rounded-md transition-colors"
        >
          <span>Close</span>
          <span className="text-xl sm:text-2xl">&times;</span>
        </button>

        {/* Image container */}
        <div
          className="relative bg-black rounded-lg overflow-hidden shadow-2xl"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchStartX.current;
            const end = e.changedTouches[0]?.clientX ?? null;
            touchStartX.current = null;
            if (start === null || end === null) return;
            const delta = end - start;
            if (Math.abs(delta) < 40) return;
            if (delta > 0) {
              setIndex((i) => Math.max(0, i - 1));
            } else {
              setIndex((i) => Math.min(photos.length - 1, i + 1));
            }
          }}
        >
          <div className="relative w-full max-h-[80vh] overflow-auto">
            <img
              src={photo.url}
              alt={`Photo by ${photo.addedBy}`}
              className={`w-full h-auto object-contain transition-transform duration-200 ${
                zoomed ? "scale-150" : "scale-100"
              }`}
              onClick={() => setZoomed((z) => !z)}
              style={{ transformOrigin: "center" }}
            />
          </div>

          {/* Prev/Next buttons */}
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-30"
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            onClick={() => setIndex((i) => Math.min(photos.length - 1, i + 1))}
            disabled={index === photos.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/60 text-white rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-30"
            aria-label="Next photo"
          >
            ›
          </button>

          {/* Zoom hint */}
          <div className="absolute top-3 left-3 bg-black/50 text-white text-[11px] px-2 py-1 rounded">
            Tap to {zoomed ? "zoom out" : "zoom in"} • Swipe to navigate
          </div>

          {/* Photo info */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-white rounded-lg p-2.5 sm:p-4 shadow-2xl max-w-[75%]">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">
              <strong>Uploaded by:</strong> {photo.addedBy}
            </p>
            <p className="text-[11px] sm:text-xs text-gray-500">
              {new Date(photo.addedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {index + 1} / {photos.length}
            </p>
          </div>

          {/* Open in new tab link */}
          <a
            href={photo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 px-3 sm:px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-2 shadow-2xl"
          >
            <span className="hidden sm:inline">Open in New Tab</span>
            <span className="sm:hidden">Open</span>
            <span className="text-base sm:text-lg">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}

