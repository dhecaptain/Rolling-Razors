import { StorageProvider, UploadOptions, UploadResult, ImageCategory } from "./provider";
import { LocalStorageProvider } from "./local";
import { CloudinaryStorageProvider } from "./cloudinary";
import { SupabaseStorageProvider } from "./supabase";
import { logger } from "../logger";

export * from "./provider";
export * from "./validation";
export * from "./local";
export * from "./cloudinary";
export * from "./supabase";

export class DurableStorageRequiredError extends Error {
  readonly statusCode = 503;
  constructor() {
    super("Image uploads are temporarily unavailable because persistent storage is not configured.");
    this.name = "DurableStorageRequiredError";
  }
}

export class StorageService {
  private provider: StorageProvider;
  readonly localProvider: LocalStorageProvider;

  constructor() {
    this.localProvider = new LocalStorageProvider();
    this.provider = this.createProvider();
  }

  private createProvider(): StorageProvider {
    const providerPref = (process.env.STORAGE_PROVIDER || "auto").trim().toLowerCase();

    // 1. Cloudinary Free Tier check
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const cloudKey = process.env.CLOUDINARY_API_KEY;
    const cloudSecret = process.env.CLOUDINARY_API_SECRET;

    if (
      (providerPref === "cloudinary" || providerPref === "auto") &&
      cloudName &&
      cloudKey &&
      cloudSecret
    ) {
      logger.info({ provider: "cloudinary", cloudName }, "[Storage] Using Cloudinary Free Tier provider");
      return new CloudinaryStorageProvider({
        cloudName,
        apiKey: cloudKey,
        apiSecret: cloudSecret,
        folder: process.env.CLOUDINARY_FOLDER || "rolling-razors",
      });
    }

    // 2. Supabase Storage Free Tier check
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (
      (providerPref === "supabase" || providerPref === "auto") &&
      supabaseUrl &&
      supabaseKey
    ) {
      logger.info({ provider: "supabase", url: supabaseUrl }, "[Storage] Using Supabase Storage provider");
      return new SupabaseStorageProvider({
        url: supabaseUrl,
        serviceRoleKey: supabaseKey,
        bucket: process.env.SUPABASE_BUCKET || "rolling-razors",
      });
    }

    // 3. Fallback: Local filesystem provider
    if (process.env.NODE_ENV === "production") {
      // The on-disk provider is ephemeral on serverless (Vercel) targets and is
      // lost when containers/instances recycle. Do not silently mis-deploy:
      // make the degradation unmissable in logs while keeping the process up
      // (existing deployments configure no provider may still be running).
      logger.error(
        { provider: "local", providerPref },
        "[Storage] Falling back to the Local filesystem provider in production. Uploads will NOT persist on serverless/ephemeral hosting. Configure STORAGE_PROVIDER + CLOUDINARY_* or SUPABASE_* — see .env.example."
      );
    }
    logger.info({ provider: "local" }, "[Storage] Using Local filesystem storage provider");
    return this.localProvider;
  }

  get providerName(): string {
    return this.provider.name;
  }

  async uploadImage(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    if (process.env.NODE_ENV === "production" && this.provider.name === "local") {
      throw new DurableStorageRequiredError();
    }
    try {
      const result = await this.provider.upload(buffer, options);
      const file = result.isPrivate
        ? { ...result, url: this.localProvider.getPrivateProxyUrl(result.key) }
        : result;
      logger.info(
        {
          key: file.key,
          category: file.category,
          size: file.size,
          provider: this.provider.name,
        },
        "[Storage] Image uploaded successfully"
      );
      return file;
    } catch (err) {
      logger.error({ err, category: options.category, provider: this.provider.name }, "[Storage] Image upload failed");
      throw err;
    }
  }

  async deleteImage(key: string): Promise<boolean> {
    try {
      const success = await this.provider.delete(key);
      logger.info({ key, success, provider: this.provider.name }, "[Storage] Image delete operation executed");
      return success;
    } catch (err) {
      logger.warn({ err, key }, "[Storage] Image delete failed");
      return false;
    }
  }

  async getImageUrl(key: string, isPrivate?: boolean): Promise<string> {
    return this.provider.getUrl(key, isPrivate);
  }

  async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
    if (this.provider.getSignedUrl) {
      return this.provider.getSignedUrl(key, expiresInSeconds);
    }
    return this.provider.getUrl(key, false);
  }
}

export const storageService = new StorageService();
