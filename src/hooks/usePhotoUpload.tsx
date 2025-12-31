"use client";

import { useMemo, useRef, useState } from "react";
import { FILE_LIMITS } from "@/lib/constants";

export const usePhotoUpload = (
  uploadPhoto: (
    file: File,
    opts?: {
      onProgress?: (pct: number) => void;
      onStage?: (stage: "uploading" | "processing") => void;
    }
  ) => Promise<any>,
  setPhotoError: (error: string) => void,
  maxSelectable: number
) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  type UploadStatus = "queued" | "uploading" | "processing" | "done" | "error";

  type UploadItem = {
    id: string;
    file: File;
    previewUrl: string;
    status: UploadStatus;
    progress: number; // 0-100
    error?: string;
  };

  const [items, setItems] = useState<UploadItem[]>([]);

  const remainingSlots = useMemo(() => {
    const max = Math.max(0, maxSelectable);
    return Math.max(0, max - items.length);
  }, [items.length, maxSelectable]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

    const allowed = fileList.slice(0, remainingSlots);
    const rejectedCount = fileList.length - allowed.length;

    const nextItems: UploadItem[] = [];

    for (const file of allowed) {
      if (!file.type.startsWith("image/")) {
        setPhotoError("Please select image files only");
        continue;
      }
      if (file.size > FILE_LIMITS.MAX_PHOTO_SIZE_BYTES) {
        setPhotoError(
          `File size must be less than ${FILE_LIMITS.MAX_PHOTO_SIZE_MB}MB`
        );
        continue;
      }

      const id = `${file.name}-${file.size}-${file.lastModified}-${Math.random()
        .toString(16)
        .slice(2)}`;
      const previewUrl = URL.createObjectURL(file);
      nextItems.push({
        id,
        file,
        previewUrl,
        status: "queued",
        progress: 0,
      });
    }

    if (rejectedCount > 0) {
      setPhotoError(
        `You can upload up to ${FILE_LIMITS.MAX_PHOTOS_PER_RECIPE} photos per recipe.`
      );
    }

    if (nextItems.length > 0) {
      setPhotoError("");
      setItems((prev) => [...prev, ...nextItems]);
    }

    // allow selecting the same files again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    setItems((prev) => {
      prev.forEach((i) => URL.revokeObjectURL(i.previewUrl));
      return [];
    });
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const runUpload = async (item: UploadItem, onSuccess: (result: any) => void) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, status: "uploading", progress: 0, error: "" } : i
      )
    );

    const result = await uploadPhoto(item.file, {
      onProgress: (pct) => {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, progress: pct } : i))
        );
      },
      onStage: (stage) => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: stage === "processing" ? "processing" : "uploading" }
              : i
          )
        );
      },
    });

    if (result) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "done", progress: 100 } : i))
      );
      onSuccess(result);
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "error", error: "Upload failed" } : i
        )
      );
    }
  };

  const uploadAll = async (onSuccess: (result: any) => void) => {
    // sequential upload to avoid overloading storage / resize pipeline
    for (const item of items) {
      if (item.status === "queued" || item.status === "error") {
        // eslint-disable-next-line no-await-in-loop
        await runUpload(item, onSuccess);
      }
    }

    // If everything succeeded, auto-clear the queue so the status window disappears.
    // (If any items are still errored, keep them visible for retry.)
    setItems((prev) => {
      const allDone = prev.length > 0 && prev.every((i) => i.status === "done");
      if (!allDone) return prev;
      prev.forEach((i) => URL.revokeObjectURL(i.previewUrl));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return [];
    });
    setPhotoError("");
  };

  const retryItem = async (id: string, onSuccess: (result: any) => void) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await runUpload(item, onSuccess);
  };

  return {
    items,
    remainingSlots,
    fileInputRef,
    handleFileSelect,
    uploadAll,
    retryItem,
    removeItem,
    clearAll,
  };
};
