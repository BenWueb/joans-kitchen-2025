import { getAuth, signOut } from "firebase/auth";

/**
 * Logs out the current user and optionally stores the current path
 * for redirect after re-login
 */
export const logout = async (currentPath?: string) => {
  try {
    const auth = getAuth();
    await signOut(auth);

    // Store the current path if provided, so user can return after re-login
    if (currentPath && typeof window !== "undefined") {
      localStorage.setItem("returnUrl", currentPath);
    }
  } catch (error) {
    console.error("Error signing out:", error);
  }
};

