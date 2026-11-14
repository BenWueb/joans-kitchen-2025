import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

const tz = (name: string) => timestamp(name, { withTimezone: true });

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
  createdAt: tz("created_at").notNull().defaultNow(),
  updatedAt: tz("updated_at")
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
    expiresAt: tz("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: tz("created_at").notNull().defaultNow(),
    updatedAt: tz("updated_at")
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
    accessTokenExpiresAt: tz("access_token_expires_at"),
    refreshTokenExpiresAt: tz("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: tz("created_at").notNull().defaultNow(),
    updatedAt: tz("updated_at")
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
    expiresAt: tz("expires_at").notNull(),
    createdAt: tz("created_at").notNull().defaultNow(),
    updatedAt: tz("updated_at")
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
    instructions: text("instructions").notNull().default(""),
    category: text("category").notNull().default(""),
    // The author's live name comes from the joined user; this snapshot is used
    // when there is no linked account (recipes imported without an owner).
    authorName: text("author_name").notNull().default("Unknown"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    unsplashImageUrl: text("unsplash_image_url"),
    unsplashPhotographer: text("unsplash_photographer"),
    unsplashPhotographerUrl: text("unsplash_photographer_url"),
    createdAt: tz("created_at").notNull().defaultNow(),
    updatedAt: tz("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // Recipe URLs are derived from the title, so titles must be unique
    uniqueIndex("recipes_title_lower_uniq").on(sql`lower(${t.title})`),
    index("recipes_category_idx").on(t.category),
    index("recipes_created_by_user_id_idx").on(t.createdByUserId),
    check("recipes_title_not_blank", sql`length(btrim(${t.title})) > 0`),
  ]
);

export const recipeNotes = pgTable(
  "recipe_notes",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    authorName: text("author_name").notNull(),
    text: text("text").notNull(),
    createdAt: tz("created_at").notNull().defaultNow(),
    editedAt: tz("edited_at"),
  },
  (t) => [index("recipe_notes_recipe_idx").on(t.recipeId, t.createdAt)]
);

export const recipePhotos = pgTable(
  "recipe_photos",
  {
    id: text("id").primaryKey(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    uploaderName: text("uploader_name").notNull(),
    // 0 is the cover photo
    position: integer("position").notNull().default(0),
    createdAt: tz("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("recipe_photos_recipe_position_idx").on(t.recipeId, t.position),
    uniqueIndex("recipe_photos_recipe_url_uniq").on(t.recipeId, t.url),
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
    createdAt: tz("created_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.recipeId] }),
    index("favorites_recipe_idx").on(t.recipeId),
    index("favorites_user_created_idx").on(t.userId, t.createdAt),
  ]
);
