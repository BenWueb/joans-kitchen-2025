"use client";

import { useState } from "react";

export const useDeletePhotoModal = (
  handleDeletePhoto: (photo: any) => Promise<boolean>
) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<any>(null);

  const handleDeletePhotoClick = (photo: any) => {
    setPhotoToDelete(photo);
    setShowDeleteModal(true);
  };

  const confirmDeletePhoto = async (onSuccess: (photo: any) => void) => {
    if (!photoToDelete) return;

    const success = await handleDeletePhoto(photoToDelete);
    if (success) {
      onSuccess(photoToDelete);
    }
    setShowDeleteModal(false);
    setPhotoToDelete(null);
  };

  const cancelDeletePhoto = () => {
    setShowDeleteModal(false);
    setPhotoToDelete(null);
  };

  return {
    showDeleteModal,
    photoToDelete,
    handleDeletePhotoClick,
    confirmDeletePhoto,
    cancelDeletePhoto,
  };
};
