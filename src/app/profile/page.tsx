"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  MdEmail,
  MdPerson,
  MdEdit,
  MdSave,
  MdCancel,
  MdVerified,
  MdWarning,
} from "react-icons/md";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAuth, updateEmail, sendEmailVerification } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firestore.config";

function Profile() {
  const router = useRouter();
  const { userData, loading } = useCurrentUser();
  const [currentUserData, setCurrentUserData] = useState<typeof userData>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedEmail, setEditedEmail] = useState("");
  const [editedAbout, setEditedAbout] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [favoriteRecipes, setFavoriteRecipes] = useState<
    Array<{ id: string; title: string; createdBy: string; photos?: any[] }>
  >([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const isEmailVerified = currentUser?.emailVerified || false;

  // Update currentUserData only on initial load
  useEffect(() => {
    if (userData && !currentUserData) {
      setCurrentUserData(userData);
    }
  }, [userData, currentUserData]);

  // Refetch user data from Firestore
  const refetchUserData = async () => {
    if (currentUser) {
      const userDocRef = doc(db, "Users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setCurrentUserData(userDoc.data() as typeof userData);
      }
    }
  };

  // Fetch favorite recipe details
  useEffect(() => {
    const fetchFavoriteRecipes = async () => {
      if (userData?.favorites && userData.favorites.length > 0) {
        setLoadingFavorites(true);
        try {
          const recipePromises = userData.favorites.map(
            async (recipeId: string) => {
              const recipeDoc = await getDoc(doc(db, "recipes", recipeId));
              if (recipeDoc.exists()) {
                return {
                  id: recipeId,
                  title: recipeDoc.data().title,
                  createdBy: recipeDoc.data().createdBy,
                  photos: recipeDoc.data().photos,
                };
              }
              return null;
            }
          );

          const recipes = await Promise.all(recipePromises);
          setFavoriteRecipes(
            recipes.filter((recipe) => recipe !== null) as Array<{
              id: string;
              title: string;
              createdBy: string;
              photos?: any[];
            }>
          );
        } catch (error) {
          console.error("Error fetching favorite recipes:", error);
        }
        setLoadingFavorites(false);
      } else {
        setLoadingFavorites(false);
      }
    };

    fetchFavoriteRecipes();
  }, [userData?.favorites]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-white text-xl">Loading...</p>
        </div>
      </>
    );
  }

  if (!userData) {
    router.push("/login");
    return null;
  }

  if (!currentUserData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-white text-xl">Loading...</p>
        </div>
      </>
    );
  }

  const { name, email, favorites, about } = currentUserData;

  const handleEdit = () => {
    setEditedName(name);
    setEditedEmail(email);
    setEditedAbout(about || "");
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName("");
    setEditedEmail("");
    setEditedAbout("");
    setError("");
    setSuccess("");
  };

  const handleResendVerification = async () => {
    setError("");
    setSuccess("");

    try {
      if (currentUser) {
        await sendEmailVerification(currentUser);
        setSuccess("Verification email sent! Please check your inbox.");
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      setError("Failed to send verification email. Please try again.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("No user logged in");
      }

      // Update email in Firebase Auth if it changed
      if (editedEmail !== email) {
        await updateEmail(user, editedEmail);
        // Send verification email to new address
        await sendEmailVerification(user);
      }

      // Update name and email in Firestore
      const userDocRef = doc(db, "Users", user.uid);
      await updateDoc(userDocRef, {
        name: editedName,
        email: editedEmail,
        about: editedAbout,
      });

      // Refetch user data to update the UI
      await refetchUserData();

      setIsEditing(false);
      if (editedEmail !== email) {
        setSuccess("Profile updated! Please verify your new email address.");
      } else {
        setSuccess("Profile updated successfully!");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      if (error.code === "auth/requires-recent-login") {
        setError("Please log out and log back in to update your email");
      } else if (error.code === "auth/email-already-in-use") {
        setError("This email is already in use");
      } else if (error.code === "auth/invalid-email") {
        setError("Invalid email address");
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen px-4 pt-20 pb-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            {name}&apos;s Profile
          </h1>

          <div className="space-y-6">
            {/* Account Info Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-700">
                  Account Info
                </h2>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md transition-colors"
                  >
                    <MdEdit className="w-5 h-5" />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      <MdSave className="w-5 h-5" />
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      <MdCancel className="w-5 h-5" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                  {success}
                </div>
              )}

              {!isEmailVerified && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MdWarning className="w-5 h-5" />
                    <span>Email not verified</span>
                  </div>
                  <button
                    onClick={handleResendVerification}
                    className="text-sm underline hover:no-underline"
                  >
                    Resend verification email
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <input
                      className={`w-full px-3 py-2 pr-10 border border-gray-300 rounded-md ${
                        isEditing
                          ? "bg-white text-gray-900"
                          : "bg-gray-50 text-gray-700"
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      type="text"
                      value={isEditing ? editedName : name}
                      onChange={(e) => setEditedName(e.target.value)}
                      disabled={!isEditing}
                    />
                    <MdPerson className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      className={`w-full px-3 py-2 pr-20 border border-gray-300 rounded-md ${
                        isEditing
                          ? "bg-white text-gray-900"
                          : "bg-gray-50 text-gray-700"
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      type="email"
                      value={isEditing ? editedEmail : email}
                      onChange={(e) => setEditedEmail(e.target.value)}
                      disabled={!isEditing}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {isEmailVerified ? (
                        <MdVerified
                          className="w-5 h-5 text-green-600"
                          title="Email verified"
                        />
                      ) : (
                        <MdWarning
                          className="w-5 h-5 text-yellow-600"
                          title="Email not verified"
                        />
                      )}
                      <MdEmail className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    About
                  </label>
                  <textarea
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      isEditing
                        ? "bg-white text-gray-900"
                        : "bg-gray-50 text-gray-700"
                    } focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none`}
                    value={isEditing ? editedAbout : about || ""}
                    onChange={(e) => setEditedAbout(e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>
              </div>
            </div>

            {/* Favorites Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-700 mb-6">
                Favorites
              </h2>
              {loadingFavorites ? (
                <p className="text-gray-500 text-center py-8">
                  Loading favorites...
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {favoriteRecipes.length > 0 ? (
                    favoriteRecipes.map((recipe) => {
                      const searchUrl = recipe.title
                        .replace(/\s/gi, "_")
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                        )
                        .join("_");

                      return (
                        <Link
                          key={recipe.id}
                          href={`/${searchUrl}`}
                          className="block relative aspect-square overflow-hidden rounded-lg shadow-lg group hover:shadow-xl transition-shadow"
                        >
                          {/* Image */}
                          <Image
                            src={
                              recipe.photos && recipe.photos.length > 0
                                ? recipe.photos[0].url
                                : "https://firebasestorage.googleapis.com/v0/b/joans-recipes-2025.firebasestorage.app/o/anh-nguyen-kcA-c3f_3FE-unsplash.jpg?alt=media&token=84d81dbd-d2ef-4035-8928-4526652bcd9c"
                            }
                            fill
                            alt={recipe.title}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Sharp gradient overlay at bottom */}
                          <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-black/95 via-black/70 to-transparent pointer-events-none z-10" />

                          {/* Text overlay at bottom */}
                          <div className="absolute inset-x-0 bottom-0 p-4 text-white z-10 text-left">
                            <h4 className="text-base font-bold mb-1 line-clamp-2 capitalize">
                              {recipe.title.toLowerCase()}
                            </h4>
                            {recipe.createdBy && (
                              <p className="text-xs opacity-90">
                                By {recipe.createdBy}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 col-span-full text-center py-8">
                      No favorites yet
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Recipes Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-700 mb-6">
                My Recipes
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <p className="text-gray-500 col-span-full text-center py-8">
                  No recipes yet
                </p>
              </div>
              <button
                onClick={() => router.push("/add-recipe")}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-md transition-colors"
              >
                Add Recipe
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default Profile;
