/**
 * Shared type definitions for the application
 */

export interface Recipe {
  id: string;
  title: string;
  createdBy: string;
  ingredients?: string;
  recipe?: string;
  notes?: any;
  category?: string;
  imageUrls?: string[];
  photos?: Photo[];
  unsplashImageUrl?: string;
  unsplashPhotographer?: string;
  unsplashPhotographerUrl?: string;
  created?: { seconds: number; nanoseconds: number };
  createdByUserId?: string;
  notesUpdatedBy?: string;
  notesUpdatedAt?: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  about?: string | null;
  isAdmin: boolean;
}

export interface RecipeSummary {
  id: string;
  title: string;
  createdBy: string;
  photos?: Photo[];
}

export interface Note {
  text: string;
  addedBy: string;
  addedByUserId?: string;
  addedAt: string;
  editedAt?: string;
}

export interface Photo {
  url: string;
  addedBy: string;
  addedByUserId?: string;
  addedAt: string;
}

export interface FavoritedRecipe {
  id: string;
  title: string;
  imageUrl: string;
  favoritedBy: string;
  favoritedAt?: Date;
}

