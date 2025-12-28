"use client";

import { useState } from "react";

export const useShareRecipe = () => {
  const [showCopyNotification, setShowCopyNotification] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 3000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return {
    showCopyNotification,
    handleShare,
  };
};
