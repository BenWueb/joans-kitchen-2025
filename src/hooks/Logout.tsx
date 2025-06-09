import { getAuth, signOut } from "firebase/auth";

export const Logout = async () => {
  try {
    const auth = getAuth();
    await signOut(auth);
  } catch (error) {
    console.log(error);
  }
};
