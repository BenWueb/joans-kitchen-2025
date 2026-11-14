import { randomUUID } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";
import { del, put } from "@vercel/blob";
import sharp from "sharp";
import { PHOTO_DIMENSIONS } from "./constants";

/**
 * Photo storage.
 *
 * - With BLOB_READ_WRITE_TOKEN set, files go to Vercel Blob (production).
 * - Otherwise, in development only, files are written to public/uploads.
 */

const LOCAL_PREFIX = "/uploads/";
const LOCAL_ROOT = path.join(process.cwd(), "public", "uploads");

function useBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function assertStorageConfigured() {
  if (!useBlob() && process.env.NODE_ENV === "production") {
    throw new Error(
      "Photo storage is not configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob)."
    );
  }
}

/** Resize to fit within 1600x1600 and re-encode as WebP (strips EXIF too). */
export async function processPhoto(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(PHOTO_DIMENSIONS.RESIZED_WIDTH, PHOTO_DIMENSIONS.RESIZED_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
}

/** Stores an already-processed image and returns its public URL. */
export async function storeImage(
  recipeId: string,
  data: Buffer,
  contentType = "image/webp"
): Promise<string> {
  assertStorageConfigured();
  const ext = contentType === "image/webp" ? "webp" : "bin";
  const key = `recipe-photos/${recipeId}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  if (useBlob()) {
    const blob = await put(key, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  const filePath = path.join(LOCAL_ROOT, key);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
  return `${LOCAL_PREFIX}${key}`;
}

function isOwnedUrl(url: string) {
  if (url.startsWith(LOCAL_PREFIX)) return true;
  try {
    return new URL(url).hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Deletes images we host. Other URLs (legacy/external) are ignored. */
export async function deleteImages(urls: string[]): Promise<void> {
  const owned = urls.filter(isOwnedUrl);
  if (owned.length === 0) return;

  const blobUrls = owned.filter((u) => !u.startsWith(LOCAL_PREFIX));
  if (blobUrls.length > 0 && useBlob()) {
    await del(blobUrls);
  }

  await Promise.all(
    owned
      .filter((u) => u.startsWith(LOCAL_PREFIX))
      .map((u) => {
        const target = path.join(LOCAL_ROOT, u.slice(LOCAL_PREFIX.length));
        if (!target.startsWith(LOCAL_ROOT + path.sep)) return Promise.resolve();
        return rm(target, { force: true });
      })
  );
}
