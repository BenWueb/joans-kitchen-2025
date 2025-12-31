/**
 * Application-wide constants
 */

// Firebase Collections
export const COLLECTIONS = {
  RECIPES: "recipes",
  USERS: "Users",
} as const;

// Storage paths
export const STORAGE_PATHS = {
  RECIPE_PHOTOS: "recipe-photos",
} as const;

// Image constants
export const DEFAULT_RECIPE_IMAGE =
  "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/jason-briscoe-GliaHAJ3_5A-unsplash.jpg?alt=media&token=592afcb6-578a-456b-8fa9-83d1125b3a6a";

export const DEFAULT_USER_NAME = "Joan";

// File upload limits
export const FILE_LIMITS = {
  MAX_PHOTO_SIZE_MB: 5,
  MAX_PHOTO_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_PHOTOS_PER_RECIPE: 5,
  PHOTO_RESIZE_TIMEOUT_SECONDS: 15,
  PHOTO_RESIZE_POLL_INTERVAL_MS: 1000,
} as const;

// Photo resize dimensions
export const PHOTO_DIMENSIONS = {
  RESIZED_WIDTH: 1600,
  RESIZED_HEIGHT: 1600,
  RESIZED_SUFFIX: "_1600x1600.webp",
} as const;

// Default values
export const DEFAULTS = {
  RECENTLY_FAVORITED_LIMIT: 6,
  RECIPE_CAROUSEL_AUTO_ADVANCE_MS: 5000,
} as const;
