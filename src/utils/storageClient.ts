/**
 * Rolling Razors Customs - Client-Side Image Upload Utility
 * Handles client-side validation, progress tracking, and secure uploads.
 */

export type ImageUploadCategory =
  | "booking-reference"
  | "work-order-before"
  | "work-order-progress"
  | "work-order-after"
  | "vehicle"
  | "service"
  | "avatar"
  | "general";

export interface ClientUploadOptions {
  category: ImageUploadCategory;
  entityId?: string;
  onProgress?: (percentage: number) => void;
  signal?: AbortSignal;
}

export interface ClientUploadResult {
  key: string;
  url: string;
  category: ImageUploadCategory;
  size: number;
  mimeType: string;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates file type and size on client before initiating upload.
 */
export function validateFileBeforeUpload(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const mime = file.type.toLowerCase();
  if (mime && !ALLOWED_MIME_TYPES.includes(mime)) {
    return {
      valid: false,
      error: `Unsupported image format "${file.type}". Please upload JPEG, PNG, or WebP.`,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Image exceeds 10MB limit (size: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }

  return { valid: true };
}

/**
 * Upload an image file to Rolling Razors secure storage service.
 */
export async function uploadImageFile(
  file: File,
  options: ClientUploadOptions
): Promise<ClientUploadResult> {
  const validation = validateFileBeforeUpload(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (options.onProgress) options.onProgress(15);

  // Read file as base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });

  if (options.onProgress) options.onProgress(45);

  const payload = {
    category: options.category,
    entityId: options.entityId,
    originalFilename: file.name,
    mimeType: file.type || "image/jpeg",
    base64Data,
    isPrivate: options.category.startsWith("work-order") || options.category === "booking-reference",
  };

  const response = await fetch("/api/uploads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (options.onProgress) options.onProgress(85);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.success || !data.file) {
    throw new Error(data.error || "Failed to process uploaded file.");
  }

  if (options.onProgress) options.onProgress(100);

  return data.file;
}

/**
 * Delete an uploaded image by storage key.
 */
export async function deleteUploadedImage(key: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/uploads/${encodeURIComponent(key)}`, {
      method: "DELETE",
    });
    return response.ok;
  } catch {
    return false;
  }
}
