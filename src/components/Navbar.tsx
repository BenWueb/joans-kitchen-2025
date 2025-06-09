"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { redirect } from "next/navigation";
import { Logout } from "@/hooks/Logout";
import { auth } from "../firestore.config";

function Navbar() {
  const [menuVisible, setMenuVisible] = useState(false);
  const menuButtonRef = useRef(null); // Ref for menu/close button
  const menuRef = useRef(null);

  // Styling for nav container
  const mobileContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,

      transition: {
        duration: 1,
        staggerChildren: 0.2,
      },
    },
  };

  // Styling for nav items
  const mobileListItem = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0, transition: { delay: 0.3 } },
    exit: { opacity: 0, y: 0, transition: { duration: 0 } },
  };

  // Close menu on click out
  // window.addEventListener('click', (e) => {

  // })

  // Toggle menu open/closed
  const toggleMenu = () => {
    setMenuVisible((prevState) => !prevState);
  };

  //Sign out
  const signOut = () => {
    Logout();
    redirect("/");
  };

  return (
    <div className="fixed top-0 w-full backdrop-blur-xs  px-4 py-2 ">
      <nav className=" relative flex justify-between items-center max-w-7xl mx-auto w-full text-white z-10 ">
        <motion.h5
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 2 } }}
        >
          <Link href="/">
            <div className="text-2xl font-bold text-primary">JK</div>
          </Link>
        </motion.h5>

        <>
          <AnimatePresence>
            {menuVisible ? (
              <motion.div
                ref={menuButtonRef}
                initial={{ rotate: 0 }}
                animate={{ rotate: 90 }}
                exit={{ rotate: 0 }}
                className="flex items-center justify-center"
              >
                <MdOutlineClose
                  style={{ color: "black" }}
                  onClick={toggleMenu}
                  className="w-8 h-8 cursor-pointer"
                />
              </motion.div>
            ) : (
              <motion.div className="flex items-center justify-center">
                <BiMenuAltRight
                  onClick={toggleMenu}
                  className="w-8 h-8 cursor-pointer"
                />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {menuVisible && (
              <motion.div
                ref={menuRef}
                key="sidebar"
                initial="hidden"
                animate="show"
                exit="hidden"
                transition={{ type: "tween", duration: 0.3 }}
                variants={mobileContainer}
                className=" absolute min-h-fit right-0 top-0 h-full w-64  bg-zinc-500 rounded  flex flex-col mt-10 gap-2 z-5"
              >
                <Link href="/">
                  <motion.li
                    variants={mobileListItem}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="flex items-center gap-2 px-6 py-3 hover:bg-gray-100 rounded transition text-lg  "
                  >
                    <MdCabin />
                    Cabin
                  </motion.li>
                </Link>
                <Link href="/search">
                  <motion.li
                    variants={mobileListItem}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="flex items-center gap-2 px-6 py-3 hover:bg-gray-100 rounded transition text-lg"
                  >
                    <MdSearch /> Search
                  </motion.li>
                </Link>
                <Link href="/categories">
                  <motion.li
                    variants={mobileListItem}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="flex items-center gap-2 px-6 py-3 hover:bg-gray-100 rounded transition text-lg"
                  >
                    <MdOutlineGridOn />
                    Categories
                  </motion.li>
                </Link>
                <Link href="/search">
                  <motion.li
                    variants={mobileListItem}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="flex items-center gap-2 px-6 py-3 hover:bg-gray-100 rounded transition text-lg"
                  >
                    <MdLibraryBooks />
                    Recipes
                  </motion.li>
                </Link>
                <Link href="/">
                  <motion.li
                    variants={mobileListItem}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="flex items-center gap-2 px-6 py-3 hover:bg-gray-100 rounded transition text-lg"
                  >
                    <MdInfoOutline />
                    About
                  </motion.li>
                </Link>

                {auth.currentUser ? (
                  <>
                    <Link href="/profile">
                      <motion.li
                        variants={mobileListItem}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="flex items-center gap-2 px-6 py-3 hover:bg-gray-100 rounded transition text-lg"
                      >
                        <MdOutlinePerson />
                        Profile
                      </motion.li>
                    </Link>
                    <Link href="/add-recipe">
                      <motion.li
                        variants={mobileListItem}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="flex items-center gap-2 px-6 py-3 hover:bg-gray-100 rounded transition text-lg"
                      >
                        <MdOutlinePostAdd />
                        Add Recipe
                      </motion.li>
                    </Link>
                    <Link href="/">
                      <motion.li
                        onClick={signOut}
                        variants={mobileListItem}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="flex items-center gap-2 px-6 py-3 hover:bg-red-100 text-red-600 rounded transition text-lg"
                      >
                        <MdLogout />
                        Sign Out
                      </motion.li>
                    </Link>
                  </>
                ) : (
                  <Link href="/login">
                    <motion.li
                      variants={mobileListItem}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="flex items-center gap-2 px-6 py-3 hover:bg-green-100 text-green-700 rounded transition text-lg"
                    >
                      <MdLogout />
                      Login
                    </motion.li>
                  </Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      </nav>
    </div>
  );
}
export default Navbar;
