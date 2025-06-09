"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import Navbar from "@/components/Navbar";
import OAuth from "@/components/OAuth";
import { redirect } from "next/navigation";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { email, password } = formData;

  // Update state with user input
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  // Sign in and navigate to profile page
  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setFormData({ email: "", password: "" });
      setTimeout(() => redirect("/profile"), 1000);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="background"></div>
      <div className="navbar-container">
        <Navbar />
      </div>
      <div className="container">
        <h1 className="page-title">Login</h1>
        <div className="form-page-container">
          <div className="form-container">
            <form className="form" onSubmit={onSubmit}>
              <label htmlFor="email">Email</label>
              <input
                className="input"
                id="email"
                value={email}
                type="email"
                placeholder="Email"
                onChange={onChange}
                required
              />
              <label htmlFor="password">Password</label>
              <input
                className="input"
                id="password"
                value={password}
                type="password"
                placeholder="Password"
                onChange={onChange}
                required
              />
              <button type="submit" className="btn submit-btn">
                Submit
              </button>
              <p>Or</p>
              <OAuth />
              <Link className="link form-link" href="/forgot-password">
                <p>Forgot Password</p>
              </Link>
              <Link className="link form-link" href="/create-account">
                Create an Account
              </Link>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
export default Login;
