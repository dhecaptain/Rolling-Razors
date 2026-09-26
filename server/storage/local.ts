import fs from "fs";
import path from "path";
import crypto from "crypto";
import { StorageProvider, UploadOptions, UploadResult } from "./provider";
import { generateStorageKey, sanitizeFilename, validateImageUpload } from "./validation";

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";
  private baseDir: string;
  private signingSecret: string;

  constructor(baseDir?: string, signingSecret?: string) {
    this.baseDir = path.resolve(baseDir || path.join(process.cwd(), "data", "uploads"));
    this.signingSecret = signingSecret || process.env.AUTH_SECRET || "rolling-razors-local-storage-secret";
    if (!fs.existsSync(this.baseDir)) {
      try {
        fs.mkdirSync(this.baseDir, { recursive: true });
      } catch (err) {
        console.warn("[LocalStorageProvider] Failed to create baseDir:", err);
      }
    }
  }

  private resolveSafePath(key: string): string {
    const safeKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
    const fullPath = path.resolve(this.baseDir, safeKey);
    if (!fullPath.startsWith(this.baseDir)) {
      throw new Error("Path traversal detected.");
    }
    return fullPath;
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const validation = validateImageUpload(buffer, options.mimeType);
    if (!validation.valid || !validation.sanitizedMime) {
      throw new Error(validation.error || "Image validation failed.");
    }

    const key = generateStorageKey(options.category, validation.sanitizedMime, options.entityId);
    const targetPath = this.resolveSafePath(key);
    const targetDir = path.dirname(targetPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, buffer);

    const isPrivate = options.isPrivate ?? (
      options.category.startsWith("work-order") || options.category === "booking-reference"
    );

    const url = await this.getUrl(key, isPrivate);

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
      const targetPath = this.resolveSafePath(key);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("[LocalStorageProvider] Delete failed for key:", key, err);
      return false;
    }
  }

  async getUrl(key: string, isPrivate?: boolean): Promise<string> {
    const encodedKey = encodeURIComponent(key);
    if (isPrivate) {
      return this.getPrivateProxyUrl(key);
    }
    return `/api/uploads/file/${encodedKey}`;
  }

  getPrivateProxyUrl(key: string): string {
    return `/api/uploads/file/${encodeURIComponent(key)}`;
  }

  async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const dataToSign = `${key}:${expiresAt}`;
    const hmac = crypto.createHmac("sha256", this.signingSecret).update(dataToSign).digest("hex");
    const encodedKey = encodeURIComponent(key);
    return `/api/uploads/file/${encodedKey}?exp=${expiresAt}&sig=${hmac}`;
  }

  verifySignature(key: string, expStr?: string, sig?: string): boolean {
    if (!expStr || !sig) return false;
    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Math.floor(Date.now() / 1000) > exp) return false;
    const dataToSign = `${key}:${exp}`;
    const expected = crypto.createHmac("sha256", this.signingSecret).update(dataToSign).digest("hex");
    const bExpected = Buffer.from(expected);
    const bSig = Buffer.from(sig);
    if (bExpected.length !== bSig.length) return false;
    return crypto.timingSafeEqual(bExpected, bSig);
  }

  getFilePath(key: string): string | null {
    try {
      const targetPath = this.resolveSafePath(key);
      return fs.existsSync(targetPath) ? targetPath : null;
    } catch {
      return null;
    }
  }
}
