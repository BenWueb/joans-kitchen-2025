import {
  boolean,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Note, Photo } from "@/lib/types";

// ---------------------------------------------------------------------------
// Better Auth tables (names/columns follow Better Auth's core schema, plus the
// `about` and `isAdmin` additional user fields declared in src/lib/auth.ts)
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  about: text("about"),
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("account_user_id_idx").on(t.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)]
);

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

export const recipes = pgTable(
  "recipes",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    ingredients: text("ingredients").notNull().default(""),
    recipe: text("recipe").notNull().default(""),
    category: text("category").notNull().default(""),
    createdBy: text("created_by").notNull().default("Unknown"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    created: timestamp("created").notNull().defaultNow(),
    notes: jsonb("notes").$type<Note[]>().notNull().default([]),
    photos: jsonb("photos").$type<Photo[]>().notNull().default([]),
    imageUrls: jsonb("image_urls").$type<string[]>().notNull().default([]),
    unsplashImageUrl: text("unsplash_image_url"),
    unsplashPhotographer: text("unsplash_photographer"),
    unsplashPhotographerUrl: text("unsplash_photographer_url"),
  },
  (t) => [
    index("recipes_title_idx").on(t.title),
    index("recipes_category_idx").on(t.category),
    index("recipes_created_by_user_id_idx").on(t.createdByUserId),
  ]
);

export const favorites = pgTable(
  "favorites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.recipeId] }),
    index("favorites_created_at_idx").on(t.createdAt),
  ]
);
