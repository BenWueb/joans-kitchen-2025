import { FILE_LIMITS, PHOTO_DIMENSIONS } from "@/lib/constants";

/**
 * Downscale an image in the browser (max 1600px, WebP) so uploads stay well
 * under the request-size limit. Falls back to the original file when the
 * browser can't decode it (e.g. HEIC) and it is already small enough.
 */
export async function resizeImageForUpload(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(
      1,
      PHOTO_DIMENSIONS.RESIZED_WIDTH / bitmap.width,
      PHOTO_DIMENSIONS.RESIZED_HEIGHT / bitmap.height
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85)
    );
    if (blob) return blob;
  } catch {
    // fall through to the original file
  }

  if (file.size <= FILE_LIMITS.MAX_UPLOAD_BYTES) return file;
  throw new Error("That image couldn't be processed. Please try a JPG or PNG.");
}
