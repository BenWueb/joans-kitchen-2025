import { authClient } from "@/lib/auth-client";

/**
 * Logs out the current user and optionally stores the current path
 * for redirect after re-login
 */
export const logout = async (currentPath?: string) => {
  try {
    await authClient.signOut();

    // Store the current path if provided, so user can return after re-login
    if (currentPath && typeof window !== "undefined") {
      localStorage.setItem("returnUrl", currentPath);
    }
  } catch (error) {
    console.error("Error signing out:", error);
  }
};
