"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import OAuth from "@/components/OAuth";
import { useLogin } from "@/hooks/useLogin";

function Login() {
  const { email, password, onChange, onSubmit } = useLogin();

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-700 text-center mb-8">
              Sign In
            </h1>

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
                  required
                />
                <div className="flex justify-end mt-1">
                  <Link
                    href="/forgot_password"
                    className="text-xs text-teal-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-md transition-colors"
              >
                Sign In
              </button>
            </form>

            <div className="space-y-5 mt-5">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>

              <OAuth />

              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
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
export default Login;
