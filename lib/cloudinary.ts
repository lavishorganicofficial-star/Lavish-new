/**
 * lib/cloudinary.ts
 * Cloudinary image upload and management utilities.
 * Includes file validation before upload (FIX — image size/type check).
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
// Max 5MB per image
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export type CloudinaryFolder = 'products' | 'banners' | 'categories' | 'avatars' | 'reviews';

export interface UploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export interface ValidationError {
  valid: false;
  error: string;
}

export interface ValidationSuccess {
  valid: true;
}

/**
 * Validates file type and size before upload.
 * Returns a typed result object rather than throwing.
 */
export function validateImageFile(
  file: File
): ValidationError | ValidationSuccess {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, WebP.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      error: `File too large: ${fileSizeMB}MB. Maximum allowed size is 5MB.`,
    };
  }

  return { valid: true };
}

/**
 * Uploads a file Buffer/base64 string to Cloudinary.
 * Server-side only — uses API key/secret.
 *
 * @param fileData - base64 data URI or file buffer as data URI
 * @param folder - Target folder (products, banners, avatars, reviews)
 * @param options - Optional transformation options
 */
export async function uploadToCloudinary(
  fileData: string,
  folder: CloudinaryFolder,
  options: {
    filename?: string;
    transformation?: object;
  } = {}
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(fileData, {
    folder: `lavishorganic/${folder}`,
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    ...options,
  });

  return {
    public_id: result.public_id,
    secure_url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Deletes an image from Cloudinary by public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Generates a Cloudinary signed upload URL for client-side direct uploads.
 * Client sends the file directly to Cloudinary — avoids proxying large files through Next.js.
 */
export function generateSignedUploadParams(folder: CloudinaryFolder): {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
} {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folderPath = `lavishorganic/${folder}`;

  const paramsToSign = {
    folder: folderPath,
    timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder: folderPath,
  };
}

/**
 * Returns a Cloudinary transformation URL for optimized images.
 * Transformation presets match the design spec.
 */
export function getCloudinaryUrl(
  publicId: string,
  preset: 'thumbnail' | 'gallery' | 'banner' | 'avatar'
): string {
  const transformations: Record<string, string> = {
    thumbnail: 'w_400,h_500,c_fill,f_auto,q_auto',
    gallery: 'w_800,h_1000,c_fill,f_auto,q_auto',
    banner: 'w_1920,h_600,c_fill,f_auto,q_auto',
    avatar: 'w_200,h_200,c_fill,g_face,f_auto,q_auto',
  };

  const transform = transformations[preset];
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transform}/${publicId}`;
}

/**
 * Next.js Image component Cloudinary loader.
 * Add to next.config.ts: images.loader = 'custom', images.loaderFile = './lib/cloudinary.ts'
 * Or use as a prop: <Image loader={cloudinaryLoader} ... />
 */
export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const q = quality ?? 'auto';

  // If it's already a full Cloudinary URL, extract the public_id
  if (src.startsWith('https://res.cloudinary.com')) {
    // Insert width/quality transformation
    return src.replace('/upload/', `/upload/w_${width},q_${q},f_auto/`);
  }

  // Treat src as public_id
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},q_${q},f_auto/${src}`;
}
