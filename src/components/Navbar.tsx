"use client";

import { useState, useRef, useEffect } from "react";
import { BiMenuAltRight } from "react-icons/bi";
import {
  MdOutlineClose,
  MdSearch,
  MdCabin,
  MdOutlineGridOn,
  MdLibraryBooks,
  MdOutlinePerson,
  MdOutlinePostAdd,
  MdLogout,
  MdInfoOutline,
} from "react-icons/md";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { Logout } from "@/hooks/Logout";
import { auth } from "../firestore.config";

function Navbar() {
  const [menuVisible, setMenuVisible] = useState(false);
  const menuButtonRef = useRef<HTMLDivElement>(null); // Ref for menu/close button
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname(); // Get current path

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuVisible &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setMenuVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuVisible]);

  // Toggle menu open/closed
  const toggleMenu = () => {
    setMenuVisible((prevState) => !prevState);
  };

  //Sign out
  const signOut = () => {
    Logout(pathname); // Pass current path to store for later
    redirect("/");
  };

  // Store current path before navigating to login
  const handleLoginClick = () => {
    if (pathname !== "/login") {
      localStorage.setItem("returnUrl", pathname);
    }
    toggleMenu();
  };

  return (
    <div className="fixed top-0 w-full z-50">
      <nav className="relative flex justify-between items-center max-w-7xl mx-auto w-full text-white z-10 px-4 py-2">
        <h5>
          <Link href="/">
            <div className="text-2xl font-bold text-primary">JK</div>
          </Link>
        </h5>

        <>
          {!menuVisible && (
            <div className="flex items-center justify-center">
              <BiMenuAltRight
                onClick={toggleMenu}
                className="w-8 h-8 cursor-pointer"
              />
            </div>
          )}

          {menuVisible && (
            <div
              ref={menuRef}
              className="absolute min-h-fit right-0 top-0 h-full w-80 bg-white shadow-2xl rounded-lg flex flex-col z-50 border border-gray-200"
            >
              <div className="flex justify-end px-4 py-2">
                <div
                  ref={menuButtonRef}
                  className="flex items-center justify-center"
                >
                  <MdOutlineClose
                    onClick={toggleMenu}
                    className="w-8 h-8 cursor-pointer text-gray-800 hover:text-teal-600 transition-colors"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 mb-2"></div>

              <Link href="/" className="w-full" onClick={toggleMenu}>
                <li className="flex items-stretch gap-3 px-6 py-4 hover:bg-gray-50 transition-all duration-200 border-l-4 border-transparent hover:border-teal-500">
                  <MdCabin className="w-8 h-auto text-teal-600 flex-shrink-0" />
                  <div>
                    <div className="text-lg font-semibold text-gray-800">
                      Cabin
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Return to main page
                    </div>
                  </div>
                </li>
              </Link>

              <Link href="/search" className="w-full" onClick={toggleMenu}>
                <li className="flex items-stretch gap-3 px-6 py-4 hover:bg-gray-50 transition-all duration-200 border-l-4 border-transparent hover:border-teal-500">
                  <MdSearch className="w-8 h-auto text-teal-600 flex-shrink-0" />
                  <div>
                    <div className="text-lg font-semibold text-gray-800">
                      Search
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Find recipes
                    </div>
                  </div>
                </li>
              </Link>

              <Link href="/" className="w-full" onClick={toggleMenu}>
                <li className="flex items-stretch gap-3 px-6 py-4 hover:bg-gray-50 transition-all duration-200 border-l-4 border-transparent hover:border-teal-500">
                  <MdInfoOutline className="w-8 h-auto text-teal-600 flex-shrink-0" />
                  <div>
                    <div className="text-lg font-semibold text-gray-800">
                      About
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Learn more about us
                    </div>
                  </div>
                </li>
              </Link>

              <div className="border-t border-gray-200 my-2"></div>

              {auth.currentUser ? (
                <>
                  <Link href="/profile" className="w-full" onClick={toggleMenu}>
                    <li className="flex items-stretch gap-3 px-6 py-4 hover:bg-gray-50 transition-all duration-200 border-l-4 border-transparent hover:border-teal-500">
                      <MdOutlinePerson className="w-8 h-auto text-teal-600 flex-shrink-0" />
                      <div>
                        <div className="text-lg font-semibold text-gray-800">
                          Profile
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          View your account details
                        </div>
                      </div>
                    </li>
                  </Link>

                  <Link
                    href="/create_recipe"
                    className="w-full"
                    onClick={toggleMenu}
                  >
                    <li className="flex items-stretch gap-3 px-6 py-4 hover:bg-green-50 transition-all duration-200 border-l-4 border-transparent hover:border-green-500">
                      <MdOutlinePostAdd className="w-8 h-auto text-green-600 flex-shrink-0" />
                      <div>
                        <div className="text-lg font-semibold text-gray-800">
                          Add Recipe
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Share your culinary creation
                        </div>
                      </div>
                    </li>
                  </Link>

                  <Link
                    href="/"
                    className="w-full"
                    onClick={() => {
                      signOut();
                      toggleMenu();
                    }}
                  >
                    <li className="flex items-stretch gap-3 px-6 py-4 hover:bg-red-50 transition-all duration-200 border-l-4 border-transparent hover:border-red-500">
                      <MdLogout className="w-8 h-auto text-red-600 flex-shrink-0" />
                      <div>
                        <div className="text-lg font-semibold text-red-600">
                          Sign Out
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Log out of your account
                        </div>
                      </div>
                    </li>
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  className="w-full"
                  onClick={handleLoginClick}
                >
                  <li className="flex items-stretch gap-3 px-6 py-4 hover:bg-green-50 transition-all duration-200 border-l-4 border-transparent hover:border-green-500">
                    <MdLogout className="w-8 h-auto text-green-600 flex-shrink-0" />
                    <div>
                      <div className="text-lg font-semibold text-green-700">
                        Login
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Access your account
                      </div>
                    </div>
                  </li>
                </Link>
              )}
            </div>
          )}
        </>
      </nav>
    </div>
  );
}
export default Navbar;
