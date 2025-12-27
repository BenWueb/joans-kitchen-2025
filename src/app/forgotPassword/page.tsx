"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firestore.config";
import Navbar from "@/components/Navbar";

function ForgotPassword() {
  const [formData, setFormData] = useState({
    email: "",
  });
  const [message, setMessage] = useState("");

  const { email } = formData;

  const router = useRouter();

  // Add user input to state
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      email: e.target.value,
    });
  };

  // Submit email to server and send password reset email
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await sendPasswordResetEmail(auth, email);
      setFormData({ email: "" });
      setMessage("Password reset email sent! Check your inbox.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      console.error("Password reset error:", error);
      setMessage(
        "Failed to send reset email. Please check your email address."
      );
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-700 text-center mb-2">
              Forgot Password
            </h1>
            <p className="text-sm text-gray-600 text-center mb-8">
              Enter your email to receive a password reset link
            </p>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  id="email"
                  value={email}
                  type="email"
                  placeholder="Enter your email"
                  onChange={onChange}
                  required
                />
              </div>

              {message && (
                <div
                  className={`text-sm text-center ${
                    message.includes("sent") ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-md transition-colors"
              >
                Send Reset Link
              </button>
            </form>

            <div className="space-y-3 mt-5">
              <p className="text-center text-sm text-gray-600">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="text-teal-600 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
              <p className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/create-account"
                  className="text-teal-600 hover:underline font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default ForgotPassword;
