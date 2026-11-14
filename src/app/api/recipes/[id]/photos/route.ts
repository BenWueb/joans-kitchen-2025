import { randomUUID } from "crypto";
import { and, asc, count, eq, max } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { recipePhotos, recipes } from "@/db/schema";
import {
  apiError,
  FORBIDDEN,
  isAdminOrOwner,
  NOT_FOUND,
  readJson,
  UNAUTHORIZED,
} from "@/lib/api-server";
import { FILE_LIMITS } from "@/lib/constants";
import { toPhoto } from "@/lib/recipes";
import { getCurrentUser } from "@/lib/session";
import { deleteImages, processPhoto, storeImage } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 30;

const limitMessage = `You can upload up to ${FILE_LIMITS.MAX_PHOTOS_PER_RECIPE} photos per recipe.`;

// Upload a photo (multipart form field "file"). Any signed-in user may add photos.
export async function POST(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const existing = await db
    .select({ id: recipePhotos.id })
    .from(recipePhotos)
    .where(eq(recipePhotos.recipeId, id));
  if (existing.length >= FILE_LIMITS.MAX_PHOTOS_PER_RECIPE) {
    return apiError(limitMessage, 400);
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get("file");
    file = value instanceof File ? value : null;
  } catch {
    return apiError("Invalid upload", 400);
  }
  if (!file) return apiError("No file provided", 400);
  if (file.size > FILE_LIMITS.MAX_UPLOAD_BYTES) {
    return apiError("That image is too large to upload", 413);
  }

  let processed: Buffer;
  try {
    processed = await processPhoto(Buffer.from(await file.arrayBuffer()));
  } catch {
    return apiError("Please select a valid image file", 400);
  }

  let url: string;
  try {
    url = await storeImage(id, processed);
  } catch (error) {
    console.error("Error storing photo:", error);
    return apiError("Photo upload is unavailable right now.", 503);
  }

  // Lock the recipe row so concurrent uploads can't exceed the limit or
  // pick the same position
  const saved = await db.transaction(async (tx) => {
    const [recipe] = await tx
      .select({ id: recipes.id })
      .from(recipes)
      .where(eq(recipes.id, id))
      .for("update");
    if (!recipe) return "not_found" as const;

    const [stats] = await tx
      .select({ count: count(), lastPosition: max(recipePhotos.position) })
      .from(recipePhotos)
      .where(eq(recipePhotos.recipeId, id));
    if (stats.count >= FILE_LIMITS.MAX_PHOTOS_PER_RECIPE) return "limit" as const;

    const [row] = await tx
      .insert(recipePhotos)
      .values({
        id: randomUUID(),
        recipeId: id,
        url,
        userId: user.id,
        uploaderName: user.name,
        position: (stats.lastPosition ?? -1) + 1,
      })
      .returning();
    return row;
  });

  if (saved === "not_found" || saved === "limit") {
    await deleteImages([url]).catch(() => {});
    return saved === "not_found" ? NOT_FOUND() : apiError(limitMessage, 400);
  }

  return NextResponse.json(toPhoto(saved), { status: 201 });
}

// Delete a photo ({ id }). Admins and the photo's uploader may delete it.
export async function DELETE(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const body = await readJson<{ id?: string }>(request);
  if (typeof body?.id !== "string") return apiError("Missing photo id", 400);

  const [photo] = await db
    .select()
    .from(recipePhotos)
    .where(and(eq(recipePhotos.id, body.id), eq(recipePhotos.recipeId, id)))
    .limit(1);
  if (!photo) return NOT_FOUND();
  if (!user.isAdmin && photo.userId !== user.id) return FORBIDDEN();

  await db.delete(recipePhotos).where(eq(recipePhotos.id, photo.id));

  try {
    await deleteImages([photo.url]);
  } catch (error) {
    console.error("Error deleting photo from storage:", error);
  }
  return NextResponse.json({ ok: true });
}

// Reorder photos ({ ids }). Only admins and the recipe owner may reorder.
export async function PUT(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const body = await readJson<{ ids?: string[] }>(request);
  if (!Array.isArray(body?.ids)) return apiError("Missing photo order", 400);
  const requested = body.ids;

  const result = await db.transaction(async (tx) => {
    const [recipe] = await tx
      .select({ createdByUserId: recipes.createdByUserId })
      .from(recipes)
      .where(eq(recipes.id, id))
      .for("update");
    if (!recipe) return "not_found" as const;
    if (!isAdminOrOwner(user, recipe.createdByUserId)) return "forbidden" as const;

    const current = await tx
      .select({ id: recipePhotos.id })
      .from(recipePhotos)
      .where(eq(recipePhotos.recipeId, id))
      .orderBy(asc(recipePhotos.position), asc(recipePhotos.createdAt));

    // Reorder existing photos only; anything not listed keeps its relative
    // order after the listed ones.
    const known = new Set(current.map((p) => p.id));
    const listed = [...new Set(requested)].filter((p) => known.has(p));
    const rest = current.map((p) => p.id).filter((p) => !listed.includes(p));

    for (const [position, photoId] of [...listed, ...rest].entries()) {
      await tx
        .update(recipePhotos)
        .set({ position })
        .where(eq(recipePhotos.id, photoId));
    }
    return "ok" as const;
  });

  if (result === "not_found") return NOT_FOUND();
  if (result === "forbidden") return FORBIDDEN();
  return NextResponse.json({ ok: true });
}
