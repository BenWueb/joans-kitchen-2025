/**
 * Error handling utilities and error message mapping
 */

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
}

/**
 * Map Firebase auth error codes to user-friendly messages
 */
export function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    "auth/invalid-credential": "Invalid email or password. Please try again.",
    "auth/user-not-found": "Invalid email or password. Please try again.",
    "auth/wrong-password": "Invalid email or password. Please try again.",
    "auth/invalid-email": "Invalid email address. Please enter a valid email.",
    "auth/user-disabled": "This account has been disabled. Please contact support.",
    "auth/too-many-requests":
      "Too many failed login attempts. Please try again later.",
    "auth/network-request-failed":
      "Network error. Please check your connection and try again.",
    "auth/requires-recent-login":
      "Please log out and log back in to update your email",
    "auth/email-already-in-use": "This email is already in use",
  };

  return (
    errorMessages[errorCode] ||
    "An error occurred. Please try again."
  );
}

/**
 * Map Firebase storage error codes to user-friendly messages
 */
export function getStorageErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    "storage/object-not-found": "File not found",
    "storage/unauthorized": "You don't have permission to access this file",
    "storage/canceled": "Upload was canceled",
    "storage/unknown": "An unknown error occurred",
  };

  return (
    errorMessages[errorCode] ||
    "An error occurred with file storage. Please try again."
  );
}

/**
 * Map Firebase Firestore error codes to user-friendly messages
 */
export function getFirestoreErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    "permission-denied": "You don't have permission to perform this action",
    "not-found": "The requested item was not found",
    "already-exists": "This item already exists",
    "unavailable": "Service temporarily unavailable. Please try again.",
  };

  return (
    errorMessages[errorCode] ||
    "An error occurred. Please try again."
  );
}

/**
 * Get user-friendly error message from any error
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred";

  // Firebase Auth errors
  if (error.code?.startsWith("auth/")) {
    return getAuthErrorMessage(error.code);
  }

  // Firebase Storage errors
  if (error.code?.startsWith("storage/")) {
    return getStorageErrorMessage(error.code);
  }

  // Firebase Firestore errors
  if (error.code) {
    return getFirestoreErrorMessage(error.code);
  }

  // Generic error messages
  if (error.message) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Log error with context
 */
export function logError(context: string, error: any): void {
  console.error(`[${context}]`, error);
}

