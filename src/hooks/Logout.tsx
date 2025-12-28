import { getAuth, signOut } from "firebase/auth";

export const Logout = async (currentPath?: string) => {
  try {
    const auth = getAuth();
    await signOut(auth);

    // Store the current path if provided, so user can return after re-login
    if (currentPath) {
      localStorage.setItem("returnUrl", currentPath);
    }
  } catch (error) {
    console.log(error);
  }
};
