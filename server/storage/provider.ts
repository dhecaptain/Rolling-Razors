/**
 * Rolling Razors Customs - Abstract Storage Provider Interface
 * Supports pluggable zero-cost cloud storage (Cloudinary free tier, Supabase Storage)
 * and secure local filesystem storage for dev/test/preview.
 */

export type ImageCategory =
  | "booking-reference"
  | "work-order-before"
  | "work-order-progress"
  | "work-order-after"
  | "vehicle"
  | "service"
  | "avatar"
  | "general";

export interface UploadOptions {
  category: ImageCategory;
  entityId?: string;
  originalFilename?: string;
  mimeType: string;
  isPrivate?: boolean;
  userId?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  category: ImageCategory;
  size: number;
  mimeType: string;
  originalFilename?: string;
  isPrivate: boolean;
  uploadedAt: string;
  width?: number;
  height?: number;
}

export interface StorageProvider {
  readonly name: string;
  upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;
  delete(key: string): Promise<boolean>;
  getUrl(key: string, isPrivate?: boolean): Promise<string>;
  getSignedUrl?(key: string, expiresInSeconds?: number): Promise<string>;
}
