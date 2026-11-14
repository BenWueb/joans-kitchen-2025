"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient, googleAuthEnabled } from "@/lib/auth-client";
import Navbar from "@/components/Navbar";
import OAuth from "@/components/OAuth";

interface FormData {
  name: string;
  email: string;
  password: string;
}

function CreateAccount() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { name, email, password } = formData;

  const router = useRouter();

  // Update form state with user input
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  // Add user to database
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      // Better Auth signs the user in and sends the verification email
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/profile",
      });
      if (signUpError) throw signUpError;

      setMessage(
        "Account created! Please check your email to verify your account."
      );

      // Redirect after a delay to show the message
      setTimeout(() => {
        router.push("/profile");
        router.refresh();
      }, 3000);
    } catch (error: any) {
      console.error("Account creation error:", error);

      // Handle specific errors with generic messages for security
      const code = error?.code;
      if (
        code === "USER_ALREADY_EXISTS" ||
        code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
      ) {
        setError(
          "Unable to create account. Please check your credentials or try logging in."
        );
      } else if (code === "INVALID_EMAIL") {
        setError("Invalid email address. Please enter a valid email.");
      } else if (code === "PASSWORD_TOO_SHORT") {
        setError("Password must be at least 8 characters.");
      } else if (error instanceof TypeError) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Unable to create account. Please try again.");
      }

      // Only clear the visible form fields on error
      setFormData((prevState) => ({
        ...prevState,
        name: "",
        email: "",
        password: "",
      }));
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-700 text-center mb-8">
              Create Account
            </h1>

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
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  id="name"
                  value={name}
                  type="text"
                  placeholder="Enter your name"
                  onChange={onChange}
                  required
                />
              </div>

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

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  id="password"
                  value={password}
                  type="password"
                  placeholder="Enter your password"
                  onChange={onChange}
                  minLength={8}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-md transition-colors"
              >
                Create Account
              </button>
            </form>

            <div className="space-y-5 mt-5">
              {googleAuthEnabled && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or</span>
                    </div>
                  </div>

                  <OAuth />
                </>
              )}

              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-teal-600 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default CreateAccount;
