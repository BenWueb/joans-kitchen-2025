/**
 * Application-wide constants
 */

// Image constants
export const DEFAULT_RECIPE_IMAGE =
  "/images/static/jason-briscoe-GliaHAJ3_5A-unsplash.jpg";

export const DEFAULT_USER_NAME = "Joan";

// File upload limits
export const FILE_LIMITS = {
  MAX_PHOTO_SIZE_MB: 5,
  MAX_PHOTO_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_PHOTOS_PER_RECIPE: 5,
  // The platform limits request bodies (4.5MB on Vercel), so photos are
  // downscaled in the browser before upload and the server enforces this cap.
  MAX_UPLOAD_BYTES: 4 * 1024 * 1024,
} as const;

// Photo resize dimensions
export const PHOTO_DIMENSIONS = {
  RESIZED_WIDTH: 1600,
  RESIZED_HEIGHT: 1600,
} as const;

// Default values
export const DEFAULTS = {
  RECENTLY_FAVORITED_LIMIT: 6,
  RECIPE_CAROUSEL_AUTO_ADVANCE_MS: 5000,
} as const;
