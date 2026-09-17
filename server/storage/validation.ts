import crypto from "crypto";
import { ImageCategory } from "./provider";

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per image

const MIME_TO_EXTENSION: Record<AllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/**
 * Validate image buffer headers (magic bytes) to prevent executable masquerading.
 */
export function verifyMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  if (!buffer || buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (declaredMime === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (declaredMime === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  // WebP: RIFF .... WEBP
  if (declaredMime === "image/webp") {
    const isRiff =
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46;
    const isWebp =
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  // HEIC / HEIF: bytes 4-8 are "ftyp"
  if (declaredMime === "image/heic" || declaredMime === "image/heif") {
    const ftyp = buffer.toString("ascii", 4, 8);
    return ftyp === "ftyp";
  }

  return false;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitizedMime?: AllowedMimeType;
}

export function validateImageUpload(
  buffer: Buffer,
  mimeType: string,
  maxSizeBytes: number = MAX_FILE_SIZE_BYTES
): ValidationResult {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "File buffer is empty." };
  }

  if (buffer.length > maxSizeBytes) {
    const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File exceeds maximum allowed size of ${maxMb}MB (received ${(buffer.length / (1024 * 1024)).toFixed(2)}MB).`,
    };
  }

  const normalizedMime = mimeType.trim().toLowerCase() as AllowedMimeType;
  if (!ALLOWED_MIME_TYPES.includes(normalizedMime)) {
    return {
      valid: false,
      error: `Unsupported file type "${mimeType}". Allowed formats: JPEG, PNG, WebP, HEIC.`,
    };
  }

  if (!verifyMagicBytes(buffer, normalizedMime)) {
    return {
      valid: false,
      error: `File signature does not match declared MIME type "${normalizedMime}". Upload rejected for security.`,
    };
  }

  return { valid: true, sanitizedMime: normalizedMime };
}

/**
 * Generate a collision-resistant, path-traversal-proof key for storage.
 */
export function generateStorageKey(
  category: ImageCategory,
  mimeType: AllowedMimeType,
  entityId?: string
): string {
  const ext = MIME_TO_EXTENSION[mimeType] || "bin";
  const cleanCategory = category.replace(/[^a-z0-9_-]/gi, "");
  const cleanEntityId = entityId ? entityId.replace(/[^a-z0-9_-]/gi, "").slice(0, 48) : "general";
  const randomId = crypto.randomUUID();
  const timestamp = Date.now();

  return `${cleanCategory}/${cleanEntityId}/${timestamp}-${randomId}.${ext}`;
}

/**
 * Clean and sanitize original filenames to strip dangerous characters and path traversal.
 */
export function sanitizeFilename(filename?: string): string {
  if (!filename) return "image";
  return filename
    .replace(/^.*[\\\/]/, "") // strip leading paths
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 100);
}
