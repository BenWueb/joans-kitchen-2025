"use client";
import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { redirect } from "next/navigation";

export function useLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { email, password } = formData;

  // Update state with user input
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  // Sign in and navigate back to original page or profile
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      setFormData({ email: "", password: "" });

      // Get the return URL from localStorage or default to profile
      const returnUrl = localStorage.getItem("returnUrl") || "/profile";
      localStorage.removeItem("returnUrl"); // Clean up
      setTimeout(() => redirect(returnUrl), 1000);
    } catch (error: any) {
      console.error("Login error:", error);
      setLoading(false);

      // Handle specific Firebase auth errors
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password. Please try again.");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address. Please enter a valid email.");
      } else if (error.code === "auth/user-disabled") {
        setError("This account has been disabled. Please contact support.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else if (error.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(
          "Unable to sign in. Please check your credentials and try again."
        );
      }
    }
  };

  return {
    formData,
    email,
    password,
    error,
    loading,
    onChange,
    onSubmit,
  };
}
