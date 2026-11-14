"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getUserFriendlyErrorMessage, logError } from "@/lib/errors";

export function useLogin() {
  const router = useRouter();
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
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });
      if (signInError) throw signInError;

      setFormData({ email: "", password: "" });

      // Get the return URL from localStorage or default to profile
      const returnUrl = localStorage.getItem("returnUrl") || "/profile";
      localStorage.removeItem("returnUrl"); // Clean up
      router.push(returnUrl);
      router.refresh();
    } catch (error: any) {
      logError("useLogin", error);
      setLoading(false);
      setError(getUserFriendlyErrorMessage(error));
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
