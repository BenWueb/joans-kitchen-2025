"use client";

import { useState } from "react";

export const usePhotoModal = () => {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const handlePhotoClick = (photo: any) => {
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedPhoto(null);
  };

  return {
    showPhotoModal,
    selectedPhoto,
    handlePhotoClick,
    closePhotoModal,
  };
};
