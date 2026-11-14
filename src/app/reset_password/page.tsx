"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import Navbar from "@/components/Navbar";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const invalidLink = !token || searchParams.get("error") === "INVALID_TOKEN";

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return;

    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (resetError) throw resetError;

      setMessage("Password updated! Redirecting to sign in...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-700 text-center mb-2">
          Reset Password
        </h1>

        {invalidLink ? (
          <div className="text-center mt-6">
            <p className="text-sm text-red-600 mb-4">
              This reset link is invalid or has expired.
            </p>
            <Link
              href="/forgot_password"
              className="text-teal-600 hover:underline font-medium"
            >
              Request a new link
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 text-center mb-8">
              Choose a new password for your account
            </p>

            {message && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-center">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-center">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={onSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New password
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  id="password"
                  type="password"
                  value={password}
                  placeholder="At least 8 characters"
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !!message}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </>
  );
}
