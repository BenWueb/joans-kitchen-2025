/**
 * Error handling utilities and error message mapping
 */

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
}

/**
 * Map Better Auth error codes to user-friendly messages
 */
export function getAuthErrorMessage(errorCode?: string): string {
  const errorMessages: Record<string, string> = {
    INVALID_EMAIL_OR_PASSWORD: "Invalid email or password. Please try again.",
    INVALID_PASSWORD: "Invalid email or password. Please try again.",
    INVALID_EMAIL: "Invalid email address. Please enter a valid email.",
    EMAIL_NOT_VERIFIED: "Please verify your email address before signing in.",
    TOO_MANY_REQUESTS: "Too many attempts. Please try again later.",
    PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
    PASSWORD_TOO_LONG: "That password is too long.",
    USER_ALREADY_EXISTS: "This email is already in use",
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "This email is already in use",
    SESSION_EXPIRED: "Please log out and log back in to update your email",
    FAILED_TO_CREATE_USER: "Unable to create account. Please try again.",
    INVALID_TOKEN: "This link is invalid or has expired.",
  };

  return (
    (errorCode && errorMessages[errorCode]) ||
    "An error occurred. Please try again."
  );
}

/**
 * Get user-friendly error message from any error
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred";

  if (error.status === 429) {
    return getAuthErrorMessage("TOO_MANY_REQUESTS");
  }

  if (typeof error.code === "string") {
    const mapped = getAuthErrorMessage(error.code);
    if (mapped !== getAuthErrorMessage()) return mapped;
  }

  if (error instanceof TypeError) {
    return "Network error. Please check your connection and try again.";
  }

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
