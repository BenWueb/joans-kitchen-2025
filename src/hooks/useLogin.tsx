"use client";
import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { redirect } from "next/navigation";

export function useLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { email, password } = formData;

  // Update state with user input
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  // Sign in and navigate to profile page
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      setFormData({ email: "", password: "" });
      setTimeout(() => redirect("/profile"), 1000);
    } catch (error) {
      console.log(error);
    }
  };

  return {
    formData,
    email,
    password,
    onChange,
    onSubmit,
  };
}
