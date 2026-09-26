import { StorageProvider, UploadOptions, UploadResult } from "./provider";
import { generateStorageKey, sanitizeFilename, validateImageUpload } from "./validation";

export interface SupabaseStorageConfig {
  url: string;
  serviceRoleKey: string;
  bucket?: string;
}

export class SupabaseStorageProvider implements StorageProvider {
  readonly name = "supabase";
  private baseUrl: string;
  private serviceKey: string;
  private bucket: string;

  constructor(config: SupabaseStorageConfig) {
    this.baseUrl = config.url.replace(/\/$/, "");
    this.serviceKey = config.serviceRoleKey;
    this.bucket = config.bucket || "rolling-razors";
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.serviceKey}`,
      apikey: this.serviceKey,
    };
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const validation = validateImageUpload(buffer, options.mimeType);
    if (!validation.valid || !validation.sanitizedMime) {
      throw new Error(validation.error || "Image validation failed.");
    }

    const key = generateStorageKey(options.category, validation.sanitizedMime, options.entityId);
    const uploadUrl = `${this.baseUrl}/storage/v1/object/${this.bucket}/${key}`;

    const isPrivate = options.isPrivate ?? (
      options.category.startsWith("work-order") || options.category === "booking-reference"
    );

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": validation.sanitizedMime,
        "x-upsert": "true",
      },
      body: buffer,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Supabase upload failed (${res.status}): ${errorText}`);
    }

    const url = isPrivate ? "" : await this.getUrl(key, false);

    return {
      key,
      url,
      category: options.category,
      size: buffer.length,
      mimeType: validation.sanitizedMime,
      originalFilename: sanitizeFilename(options.originalFilename),
      isPrivate,
      uploadedAt: new Date().toISOString(),
    };
  }

  async delete(key: string): Promise<boolean> {
    try {
      const deleteUrl = `${this.baseUrl}/storage/v1/object/${this.bucket}`;
      const res = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          ...this.headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes: [key] }),
      });
      return res.ok;
    } catch (err) {
      console.warn("[SupabaseStorageProvider] Delete failed:", err);
      return false;
    }
  }

  async getUrl(key: string, isPrivate?: boolean): Promise<string> {
    if (isPrivate) {
      return this.getSignedUrl(key, 3600);
    }
    return `${this.baseUrl}/storage/v1/object/public/${this.bucket}/${key}`;
  }

  async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const signUrl = `${this.baseUrl}/storage/v1/object/sign/${this.bucket}/${key}`;
    const res = await fetch(signUrl, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });

    if (!res.ok) {
      throw new Error(`Supabase could not create a private asset URL (${res.status}).`);
    }

    const data = (await res.json()) as { signedURL?: string };
    if (data.signedURL) {
      return data.signedURL.startsWith("http")
        ? data.signedURL
        : `${this.baseUrl}${data.signedURL}`;
    }

    throw new Error("Supabase did not return a signed URL for a private asset.");
  }
}
