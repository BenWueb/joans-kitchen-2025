"use client";

import { useState } from "react";

export const usePhotoModal = () => {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const openPhotoAt = (index: number) => {
    setSelectedIndex(index);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedIndex(null);
  };

  return {
    showPhotoModal,
    selectedIndex,
    openPhotoAt,
    closePhotoModal,
  };
};
