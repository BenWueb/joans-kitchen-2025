import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import {
  apiError,
  FORBIDDEN,
  isAdminOrOwner,
  NOT_FOUND,
  readJson,
  UNAUTHORIZED,
} from "@/lib/api-server";
import { DEFAULT_USER_NAME, FILE_LIMITS } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { deleteImages, processPhoto, storeImage } from "@/lib/storage";
import type { Photo } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 30;

// Upload a photo (multipart form field "file"). Any signed-in user may add photos.
export async function POST(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const [existing] = await db
    .select({ photos: recipes.photos })
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);
  if (!existing) return NOT_FOUND();
  if ((existing.photos?.length ?? 0) >= FILE_LIMITS.MAX_PHOTOS_PER_RECIPE) {
    return apiError(
      `You can upload up to ${FILE_LIMITS.MAX_PHOTOS_PER_RECIPE} photos per recipe.`,
      400
    );
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
  const photo: Photo = {
    url,
    addedBy: user.name || DEFAULT_USER_NAME,
    addedByUserId: user.id,
    addedAt: new Date().toISOString(),
  };

  const saved = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ photos: recipes.photos })
      .from(recipes)
      .where(eq(recipes.id, id))
      .for("update");
    if (!row || row.photos.length >= FILE_LIMITS.MAX_PHOTOS_PER_RECIPE) {
      return false;
    }
    await tx
      .update(recipes)
      .set({ photos: [...row.photos, photo] })
      .where(eq(recipes.id, id));
    return true;
  });

  if (!saved) {
    await deleteImages([url]).catch(() => {});
    return apiError("Could not save photo. Please try again.", 409);
  }

  return NextResponse.json(photo, { status: 201 });
}

// Delete a photo ({ url }). Admins and the photo's uploader may delete it.
export async function DELETE(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const body = await readJson<{ url?: string }>(request);
  if (!body?.url) return apiError("Missing photo url", 400);

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({ photos: recipes.photos })
      .from(recipes)
      .where(eq(recipes.id, id))
      .for("update");
    if (!row) return "not_found" as const;

    const photo = row.photos.find((p) => p.url === body.url);
    if (!photo) return "not_found" as const;
    if (!user.isAdmin && photo.addedByUserId !== user.id) {
      return "forbidden" as const;
    }

    await tx
      .update(recipes)
      .set({ photos: row.photos.filter((p) => p.url !== body.url) })
      .where(eq(recipes.id, id));
    return "ok" as const;
  });

  if (result === "not_found") return NOT_FOUND();
  if (result === "forbidden") return FORBIDDEN();

  try {
    await deleteImages([body.url]);
  } catch (error) {
    console.error("Error deleting photo from storage:", error);
  }
  return NextResponse.json({ ok: true });
}

// Reorder photos ({ urls }). Only admins and the recipe owner may reorder.
export async function PUT(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return UNAUTHORIZED();

  const { id } = await params;
  const body = await readJson<{ urls?: string[] }>(request);
  if (!Array.isArray(body?.urls)) return apiError("Missing photo order", 400);
  const urls = body.urls;

  const result = await db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        photos: recipes.photos,
        createdByUserId: recipes.createdByUserId,
      })
      .from(recipes)
      .where(eq(recipes.id, id))
      .for("update");
    if (!row) return "not_found" as const;
    if (!isAdminOrOwner(user, row.createdByUserId)) return "forbidden" as const;

    // Reorder existing photos only; never add or drop photos via this endpoint
    const byUrl = new Map(row.photos.map((p) => [p.url, p]));
    const orderedUrls = [...new Set(urls)].filter((u) => byUrl.has(u));
    const ordered = orderedUrls.map((u) => byUrl.get(u)!);
    const remaining = row.photos.filter((p) => !orderedUrls.includes(p.url));

    await tx
      .update(recipes)
      .set({ photos: [...ordered, ...remaining] })
      .where(eq(recipes.id, id));
    return "ok" as const;
  });

  if (result === "not_found") return NOT_FOUND();
  if (result === "forbidden") return FORBIDDEN();
  return NextResponse.json({ ok: true });
}
