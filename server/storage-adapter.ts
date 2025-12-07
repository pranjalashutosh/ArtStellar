import { resolve } from "path";
import { existsSync, mkdirSync } from "fs";

/**
 * File storage configuration and utilities
 * Supports both local filesystem (development) and cloud storage (production)
 */

// Storage directories
export const UPLOADS_DIR = resolve(process.cwd(), "uploads", "products");
export const DIGITAL_ASSETS_DIR = resolve(process.cwd(), "server", "digital-assets");

// Ensure directories exist
export function ensureStorageDirectories() {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  if (!existsSync(DIGITAL_ASSETS_DIR)) {
    mkdirSync(DIGITAL_ASSETS_DIR, { recursive: true });
  }
}

// Storage type detection
export const isCloudStorage = (): boolean => {
  return !!(
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
};

// Get base URL for uploads
export const getUploadsBaseUrl = (): string => {
  if (isCloudStorage()) {
    // If using S3/R2, return the bucket URL
    const endpoint = process.env.S3_ENDPOINT;
    const bucket = process.env.S3_BUCKET_NAME;
    const region = process.env.S3_REGION || "us-east-1";

    if (endpoint) {
      // For Cloudflare R2 or custom S3-compatible service
      return `${endpoint}/${bucket}`;
    } else {
      // For AWS S3
      return `https://${bucket}.s3.${region}.amazonaws.com`;
    }
  } else {
    // Local storage
    const appUrl = process.env.APP_URL || "http://localhost:5000";
    return `${appUrl}/uploads`;
  }
};

/**
 * Storage adapter interface for future cloud storage implementation
 */
export interface StorageAdapter {
  uploadFile(file: Express.Multer.File, path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  getFileUrl(path: string): string;
}

/**
 * Local filesystem storage adapter
 */
export class LocalStorageAdapter implements StorageAdapter {
  async uploadFile(file: Express.Multer.File, relativePath: string): Promise<string> {
    // File is already saved by multer
    return relativePath;
  }

  async deleteFile(path: string): Promise<void> {
    const fs = await import("fs/promises");
    try {
      await fs.unlink(resolve(UPLOADS_DIR, path));
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  getFileUrl(relativePath: string): string {
    const baseUrl = process.env.APP_URL || "http://localhost:5000";
    return `${baseUrl}/uploads/products/${relativePath}`;
  }
}

/**
 * S3/R2 cloud storage adapter (for future implementation)
 * Uncomment and implement when moving to cloud storage
 */
/*
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export class CloudStorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET_NAME!;
    
    const config: any = {
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      region: process.env.S3_REGION || "us-east-1",
    };

    // For Cloudflare R2 or other S3-compatible services
    if (process.env.S3_ENDPOINT) {
      config.endpoint = process.env.S3_ENDPOINT;
    }

    this.client = new S3Client(config);
  }

  async uploadFile(file: Express.Multer.File, path: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.client.send(command);
    return path;
  }

  async deleteFile(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    await this.client.send(command);
  }

  getFileUrl(path: string): string {
    return `${getUploadsBaseUrl()}/${path}`;
  }
}
*/

/**
 * Get the appropriate storage adapter based on configuration
 */
export function getStorageAdapter(): StorageAdapter {
  // For now, always use local storage
  // When ready for cloud storage, uncomment this:
  // if (isCloudStorage()) {
  //   return new CloudStorageAdapter();
  // }
  return new LocalStorageAdapter();
}

// Initialize storage directories on module load
ensureStorageDirectories();

