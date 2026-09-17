import crypto from "crypto";
import { StorageProvider, UploadOptions, UploadResult } from "./provider";
import { generateStorageKey, sanitizeFilename, validateImageUpload } from "./validation";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder?: string;
}

export class CloudinaryStorageProvider implements StorageProvider {
  readonly name = "cloudinary";
  private config: CloudinaryConfig;

  constructor(config: CloudinaryConfig) {
    this.config = config;
  }

  private generateSignature(params: Record<string, string | number | boolean>): string {
    const sortedKeys = Object.keys(params).sort();
    const stringToSign = sortedKeys.map(k => `${k}=${params[k]}`).join("&") + this.config.apiSecret;
    return crypto.createHash("sha1").update(stringToSign).digest("hex");
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const validation = validateImageUpload(buffer, options.mimeType);
    if (!validation.valid || !validation.sanitizedMime) {
      throw new Error(validation.error || "Image validation failed.");
    }

    const key = generateStorageKey(options.category, validation.sanitizedMime, options.entityId);
    const publicId = key.replace(/\.[^/.]+$/, ""); // Strip extension for Cloudinary public_id
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = this.config.folder || "rolling-razors";
    const tags = `rr_customs,${options.category},${options.entityId || "general"}`;

    const params: Record<string, string | number | boolean> = {
      folder,
      public_id: publicId,
      tags,
      timestamp,
    };

    const signature = this.generateSignature(params);

    const formData = new FormData();
    formData.append("file", `data:${validation.sanitizedMime};base64,${buffer.toString("base64")}`);
    formData.append("api_key", this.config.apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("folder", folder);
    formData.append("public_id", publicId);
    formData.append("tags", tags);
    formData.append("signature", signature);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as any;
    const isPrivate = options.isPrivate ?? (
      options.category.startsWith("work-order") || options.category === "booking-reference"
    );

    // Provide optimized delivery URL using f_auto,q_auto for fast Kenyan mobile loading
    const secureUrl = data.secure_url || data.url;
    const optimizedUrl = secureUrl.includes("/upload/")
      ? secureUrl.replace("/upload/", "/upload/f_auto,q_auto/")
      : secureUrl;

    return {
      key: data.public_id || key,
      url: optimizedUrl,
      category: options.category,
      size: data.bytes || buffer.length,
      mimeType: validation.sanitizedMime,
      originalFilename: sanitizeFilename(options.originalFilename),
      isPrivate,
      uploadedAt: new Date().toISOString(),
      width: data.width,
      height: data.height,
    };
  }

  async delete(key: string): Promise<boolean> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const publicId = key.replace(/\.[^/.]+$/, "");
      const params: Record<string, string | number | boolean> = {
        public_id: publicId,
        timestamp,
      };
      const signature = this.generateSignature(params);

      const formData = new FormData();
      formData.append("public_id", publicId);
      formData.append("api_key", this.config.apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);

      const destroyUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/destroy`;
      const res = await fetch(destroyUrl, { method: "POST", body: formData });
      if (!res.ok) return false;
      const data = (await res.json()) as any;
      return data.result === "ok" || data.result === "not found";
    } catch (err) {
      console.warn("[CloudinaryStorageProvider] Delete failed:", err);
      return false;
    }
  }

  async getUrl(key: string): Promise<string> {
    const folder = this.config.folder || "rolling-razors";
    const cleanKey = key.startsWith(folder) ? key : `${folder}/${key}`;
    return `https://res.cloudinary.com/${this.config.cloudName}/image/upload/f_auto,q_auto/${cleanKey}`;
  }
}
