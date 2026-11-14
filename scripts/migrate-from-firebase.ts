/**
 * One-off migration: Firebase (Auth + Firestore + Storage) -> Postgres + Better Auth.
 *
 *   npm run migrate:firebase -- [--dry-run] [--skip-photos]
 *
 * Reads from Firebase using a service account and writes to DATABASE_URL.
 * Photo files are downloaded from Firebase Storage and re-hosted via
 * src/lib/storage.ts (Vercel Blob when BLOB_READ_WRITE_TOKEN is set).
 *
 * Required env (shell or .env.local):
 *   DATABASE_URL
 *   FIREBASE_SERVICE_ACCOUNT_PATH  (path to the service account JSON)
 *     or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 *
 * Safe to re-run: users, accounts, favorites and recipes that already exist
 * are skipped. Firebase password hashes can't be imported into Better Auth,
 * so email/password users sign in via "Forgot password" the first time.
 * Google users keep working: their Google account is linked by provider id.
 */
import { randomUUID } from "crypto";
import { readFileSync } from "fs";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local is optional
}

const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_PHOTOS = process.argv.includes("--skip-photos");

type FirestoreData = Record<string, any>;

function toDate(value: any): Date | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function loadCredential() {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path) {
    const json = JSON.parse(readFileSync(path, "utf8"));
    return {
      projectId: json.project_id ?? json.projectId,
      clientEmail: json.client_email ?? json.clientEmail,
      privateKey: json.private_key ?? json.privateKey,
    };
  }
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } =
    process.env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }
  throw new Error(
    "Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY"
  );
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const { initializeApp, cert } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const { getFirestore } = await import("firebase-admin/firestore");
  const { eq } = await import("drizzle-orm");
  const { db, schema } = await import("../src/db");
  const { processPhoto, storeImage } = await import("../src/lib/storage");

  const app = initializeApp({ credential: cert(loadCredential()) });
  const firestore = getFirestore(app);

  console.log(
    `Migrating Firebase -> Postgres${DRY_RUN ? " (dry run)" : ""}${
      SKIP_PHOTOS ? " (skipping photos)" : ""
    }`
  );

  // ---- Users ---------------------------------------------------------------
  const profileDocs = new Map<string, FirestoreData>();
  (await firestore.collection("Users").get()).forEach((d) =>
    profileDocs.set(d.id, d.data())
  );

  const importedUsers = new Set<string>();
  const stats = { users: 0, accounts: 0, recipes: 0, photos: 0, favorites: 0, skipped: 0 };

  let pageToken: string | undefined;
  do {
    const page = await getAuth(app).listUsers(1000, pageToken);
    pageToken = page.pageToken;

    for (const fbUser of page.users) {
      const email = fbUser.email?.toLowerCase();
      if (!email) {
        console.warn(`! Skipping user ${fbUser.uid}: no email`);
        stats.skipped++;
        continue;
      }
      const profile = profileDocs.get(fbUser.uid) ?? {};
      importedUsers.add(fbUser.uid);

      if (DRY_RUN) {
        stats.users++;
        continue;
      }

      const created = await db
        .insert(schema.user)
        .values({
          id: fbUser.uid,
          name: profile.name || fbUser.displayName || email.split("@")[0],
          email,
          emailVerified: fbUser.emailVerified,
          image: fbUser.photoURL ?? null,
          about: profile.about ?? null,
          isAdmin: profile.isAdmin === true,
          createdAt: toDate(fbUser.metadata.creationTime) ?? new Date(),
        })
        .onConflictDoNothing()
        .returning({ id: schema.user.id });
      if (created.length > 0) stats.users++;

      for (const info of fbUser.providerData) {
        if (info.providerId !== "google.com") continue;
        const existing = await db
          .select({ id: schema.account.id })
          .from(schema.account)
          .where(eq(schema.account.userId, fbUser.uid));
        if (existing.length > 0) continue;
        await db.insert(schema.account).values({
          id: randomUUID(),
          accountId: info.uid,
          providerId: "google",
          userId: fbUser.uid,
        });
        stats.accounts++;
      }
    }
  } while (pageToken);

  // Recipes created by a user but missing createdByUserId on the document
  const ownerByRecipe = new Map<string, string>();
  for (const [uid, profile] of profileDocs) {
    for (const recipeId of profile.recipes ?? []) ownerByRecipe.set(recipeId, uid);
  }

  // ---- Recipes -------------------------------------------------------------
  const recipeSnap = await firestore.collection("recipes").get();
  const importedRecipes = new Set<string>();

  for (const doc of recipeSnap.docs) {
    const data = doc.data();
    const id = doc.id;
    importedRecipes.add(id);

    const [exists] = await db
      .select({ id: schema.recipes.id })
      .from(schema.recipes)
      .where(eq(schema.recipes.id, id))
      .limit(1);
    if (exists) {
      stats.skipped++;
      continue;
    }

    const created = toDate(data.created) ?? new Date();

    // Legacy docs stored notes as a single string
    const notes = Array.isArray(data.notes)
      ? data.notes
      : data.notes
        ? [
            {
              text: String(data.notes),
              addedBy: data.notesUpdatedBy || "Joan",
              addedAt: data.notesUpdatedAt || created.toISOString(),
            },
          ]
        : [];

    const photos = [];
    for (const p of data.photos ?? []) {
      if (!p?.url) continue;
      let url: string = p.url;

      if (!DRY_RUN && !SKIP_PHOTOS) {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const processed = await processPhoto(Buffer.from(await res.arrayBuffer()));
          url = await storeImage(id, processed);
          stats.photos++;
        } catch (err) {
          console.warn(`! Could not re-host photo for ${id} (${p.url}): ${err}`);
        }
      }

      photos.push({
        url,
        addedBy: p.addedBy ?? p.uploadedBy ?? "Joan",
        addedByUserId: p.addedByUserId,
        addedAt:
          p.addedAt ?? toDate(p.uploadedAt)?.toISOString() ?? created.toISOString(),
      });
    }

    const ownerId = data.createdByUserId ?? ownerByRecipe.get(id) ?? null;

    if (DRY_RUN) {
      stats.recipes++;
      continue;
    }

    await db.insert(schema.recipes).values({
      id,
      title: data.title ?? "Untitled Recipe",
      ingredients: data.ingredients ?? "",
      recipe: data.recipe ?? "",
      category: data.category ?? "",
      createdBy: data.createdBy ?? "Unknown",
      createdByUserId: ownerId && importedUsers.has(ownerId) ? ownerId : null,
      created,
      notes,
      photos,
      imageUrls: data.imageUrls ?? [],
      unsplashImageUrl: data.unsplashImageUrl ?? null,
      unsplashPhotographer: data.unsplashPhotographer ?? null,
      unsplashPhotographerUrl: data.unsplashPhotographerUrl ?? null,
    });
    stats.recipes++;
    console.log(`  recipe ${id}: ${data.title}`);
  }

  // ---- Favorites -----------------------------------------------------------
  for (const [uid, profile] of profileDocs) {
    if (!importedUsers.has(uid)) continue;
    const list: string[] = profile.favorites ?? [];

    for (const [idx, recipeId] of list.entries()) {
      if (!importedRecipes.has(recipeId)) continue;
      if (DRY_RUN) {
        stats.favorites++;
        continue;
      }
      // Firestore didn't keep favorite times; preserve per-user order
      const createdAt = new Date(Date.now() - (list.length - idx) * 1000);
      const inserted = await db
        .insert(schema.favorites)
        .values({ userId: uid, recipeId, createdAt })
        .onConflictDoNothing()
        .returning({ recipeId: schema.favorites.recipeId });
      if (inserted.length > 0) stats.favorites++;
    }
  }

  console.log("\nDone.", stats);
  console.log(
    "Email/password users must use \"Forgot password\" to set a password for the new system."
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
