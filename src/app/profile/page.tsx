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
  MdDelete,
} from "react-icons/md";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getAuth, updateEmail, sendEmailVerification } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/firestore.config";
import { useDeleteRecipe } from "@/hooks/useDeleteRecipe";
import { recipeToUrl } from "@/utils/recipeUrl";

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
  const [userRecipes, setUserRecipes] = useState<
    Array<{ id: string; title: string; createdBy: string; photos?: any[] }>
  >([]);
  const [loadingUserRecipes, setLoadingUserRecipes] = useState(true);

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const isEmailVerified = currentUser?.emailVerified || false;

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

  // Delete recipe hook
  const {
    showDeleteModal,
    recipeToDelete,
    deleting,
    handleDeleteRecipeClick,
    cancelDelete,
    confirmDeleteRecipe,
  } = useDeleteRecipe(
    currentUser?.uid,
    refetchUserData,
    setUserRecipes,
    setSuccess,
    setError
  );

  // Update currentUserData only on initial load  // Fetch favorite recipe details
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

  // Fetch user's created recipes
  useEffect(() => {
    const fetchUserRecipes = async () => {
      if (userData?.recipes && userData.recipes.length > 0) {
        setLoadingUserRecipes(true);
        try {
          const recipePromises = userData.recipes.map(
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
          setUserRecipes(
            recipes.filter((recipe) => recipe !== null) as Array<{
              id: string;
              title: string;
              createdBy: string;
              photos?: any[];
            }>
          );
        } catch (error) {
          console.error("Error fetching user recipes:", error);
        }
        setLoadingUserRecipes(false);
      } else {
        setLoadingUserRecipes(false);
      }
    };

    fetchUserRecipes();
  }, [userData?.recipes]);

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

  // Use userData directly if currentUserData isn't set yet
  const displayData = currentUserData || userData;

  if (!displayData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-white text-xl">Loading...</p>
        </div>
      </>
    );
  }

  const { name, email, favorites, about } = displayData;

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
          <h1 className="mt-12 text-3xl font-bold text-white text-center mb-8">
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
                      className="flex items-center gap-2 px-4 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      <MdSave className="w-5 h-5" />
                      <span className="hidden sm:inline">
                        {saving ? "Saving..." : "Save"}
                      </span>
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors disabled:opacity-50"
                    >
                      <MdCancel className="w-5 h-5" />
                      <span className="hidden sm:inline">Cancel</span>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                  {favoriteRecipes.length > 0 ? (
                    favoriteRecipes.map((recipe) => {
                      const searchUrl = recipeToUrl(recipe.title);

                      return (
                        <Link
                          key={recipe.id}
                          href={`/${searchUrl}`}
                          className="block relative aspect-video overflow-hidden rounded-lg shadow-lg group hover:shadow-xl transition-shadow"
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

                          {/* Dark overlay */}
                          <div className="absolute inset-0 bg-black/40 pointer-events-none z-10" />

                          {/* Text overlay centered */}
                          <div className="absolute inset-0 flex items-center justify-center px-1 sm:px-2 text-white z-10">
                            <h4 className="text-xs sm:text-sm md:text-base font-bold line-clamp-2 capitalize">
                              {recipe.title.toLowerCase()}
                            </h4>
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
              {loadingUserRecipes ? (
                <p className="text-gray-500 text-center py-8">
                  Loading recipes...
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                  {userRecipes.length > 0 ? (
                    userRecipes.map((recipe) => {
                      const searchUrl = recipeToUrl(recipe.title);

                      return (
                        <div key={recipe.id} className="relative group">
                          <Link
                            href={`/${searchUrl}`}
                            className="block relative aspect-video overflow-hidden rounded-lg shadow-lg group hover:shadow-xl transition-shadow"
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

                            {/* Dark overlay */}
                            <div className="absolute inset-0 bg-black/40 pointer-events-none z-10" />

                            {/* Text overlay centered */}
                            <div className="absolute inset-0 flex items-center justify-center px-1 sm:px-2 text-white z-10">
                              <h4 className="text-xs sm:text-sm md:text-base font-bold line-clamp-2 capitalize">
                                {recipe.title.toLowerCase()}
                              </h4>
                            </div>
                          </Link>

                          {/* Delete button - visible on hover */}
                          <button
                            onClick={(e) =>
                              handleDeleteRecipeClick(
                                recipe.id,
                                recipe.title,
                                e
                              )
                            }
                            className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-20"
                            title="Delete recipe"
                          >
                            <MdDelete className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 col-span-full text-center py-8">
                      No recipes yet
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={() => router.push("/create_recipe")}
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-md transition-colors"
              >
                Add Recipe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && recipeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <MdDelete className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Delete Recipe
                </h3>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to delete{" "}
                  <strong>"{recipeToDelete.title}"</strong>? This action cannot
                  be undone and will permanently delete all recipe data
                  including photos and notes.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteRecipe}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : "Delete Recipe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default Profile;
