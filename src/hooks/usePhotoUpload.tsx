"use client";

import { useState, useRef } from "react";

export const usePhotoUpload = (
  handleUploadPhoto: (file: File) => Promise<any>,
  setPhotoError: (error: string) => void
) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setPhotoError("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setPhotoError("");

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = async (onSuccess: (result: any) => void) => {
    if (!selectedFile) return;

    const result = await handleUploadPhoto(selectedFile);
    if (result) {
      onSuccess(result);
      // Clear selection
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPhotoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    selectedFile,
    previewUrl,
    fileInputRef,
    handleFileSelect,
    handleUploadClick,
    clearSelection,
  };
};
