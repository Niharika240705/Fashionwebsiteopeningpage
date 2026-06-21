import axios from 'axios';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface ProcessedImageResult {
  hasModel: boolean;
  processedImageUrl: string;
  originalImageUrl: string;
}

/**
 * AI Image Processing Service
 * Handles person detection, background removal, and clothing isolation
 */
export class ImageProcessingService {
  private tempDir: string;
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
    this.tempDir = path.join(os.tmpdir(), 'fashion-images');
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Process a single product image
   * 1. Detect if image contains a human model
   * 2. If yes: remove background and model, isolate clothing
   * 3. If no: pass through unchanged
   */
  async processImage(imageUrl: string, productId: string): Promise<ProcessedImageResult> {
    try {
      // Download image
      const imageBuffer = await this.downloadImage(imageUrl);
      const tempImagePath = path.join(this.tempDir, `${productId}-${Date.now()}.jpg`);
      fs.writeFileSync(tempImagePath, imageBuffer);

      // Detect if image contains a human model
      const hasModel = await this.detectPerson(imageBuffer);

      let processedImageBuffer: Buffer;
      let processedImageUrl: string;

      if (hasModel) {
        // Remove background and model, isolate clothing
        processedImageBuffer = await this.isolateClothing(imageBuffer);
      } else {
        // Pass through unchanged (but still optimize)
        processedImageBuffer = await this.optimizeImage(imageBuffer);
      }

      // Upload processed image to cloud storage
      processedImageUrl = await this.storageService.uploadImage(
        processedImageBuffer,
        `${productId}/processed-${Date.now()}.jpg`
      );

      // Cleanup temp file
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }

      return {
        hasModel,
        processedImageUrl,
        originalImageUrl: imageUrl,
      };
    } catch (error) {
      console.error('Error processing image:', error);
      // Return original image URL if processing fails
      return {
        hasModel: false,
        processedImageUrl: imageUrl,
        originalImageUrl: imageUrl,
      };
    }
  }

  /**
   * Process multiple images for a product
   */
  async processImages(imageUrls: string[], productId: string): Promise<string[]> {
    const processedUrls: string[] = [];

    for (const imageUrl of imageUrls) {
      try {
        const result = await this.processImage(imageUrl, productId);
        processedUrls.push(result.processedImageUrl);
      } catch (error) {
        console.error(`Error processing image ${imageUrl}:`, error);
        // Fallback to original image
        processedUrls.push(imageUrl);
      }
    }

    return processedUrls;
  }

  /**
   * Download image from URL
   */
  private async downloadImage(imageUrl: string): Promise<Buffer> {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    return Buffer.from(response.data);
  }

  /**
   * Detect if image contains a human person/model
   * Using a lightweight approach - in production, use YOLO or MediaPipe
   */
  private async detectPerson(imageBuffer: Buffer): Promise<boolean> {
    try {
      // For now, use a simple heuristic based on image dimensions and aspect ratio
      // In production, integrate with YOLO, MediaPipe, or a cloud AI service
      
      const metadata = await sharp(imageBuffer).metadata();
      const aspectRatio = (metadata.width || 1) / (metadata.height || 1);

      // Portrait-oriented images (aspect ratio < 1) are more likely to contain models
      // This is a simple heuristic - replace with actual ML model
      if (aspectRatio < 0.8) {
        // Could be a model shot
        // TODO: Integrate with actual person detection model
        // For now, return true for portrait images as a placeholder
        return true;
      }

      // For production, use one of these approaches:
      // 1. TensorFlow.js with COCO-SSD model
      // 2. MediaPipe Person Detection
      // 3. Cloud AI service (AWS Rekognition, Google Vision API)
      // 4. YOLO model via Python subprocess

      return false;
    } catch (error) {
      console.error('Error detecting person:', error);
      return false; // Default to no model if detection fails
    }
  }

  /**
   * Isolate clothing item by removing background and model
   * Uses RemBG or similar background removal service
   */
  private async isolateClothing(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Option 1: Use RemBG library (Python-based, requires subprocess)
      // Option 2: Use cloud service (Remove.bg API, ClipDrop API)
      // Option 3: Use TensorFlow.js with segmentation model

      // For now, use Sharp to create a simple background removal effect
      // In production, integrate with RemBG or cloud service
      
      // Placeholder: Apply a simple processing
      // TODO: Replace with actual background removal
      const processed = await sharp(imageBuffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();

      return processed;
    } catch (error) {
      console.error('Error isolating clothing:', error);
      // Fallback to optimized original
      return await this.optimizeImage(imageBuffer);
    }
  }

  /**
   * Optimize image (resize, compress) without removing background
   */
  private async optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (error) {
      console.error('Error optimizing image:', error);
      return imageBuffer; // Return original if optimization fails
    }
  }
}

/**
 * Storage Service Interface
 */
export interface StorageService {
  uploadImage(buffer: Buffer, key: string): Promise<string>;
  deleteImage(key: string): Promise<void>;
}

/**
 * Supabase Storage Implementation
 */
export class SupabaseStorageService implements StorageService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private bucketName: string;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    this.bucketName = process.env.SUPABASE_BUCKET || 'processed-images';
    
    // Log configuration status (without exposing sensitive data)
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️  Supabase storage not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env file.');
      console.warn('   Images will use placeholder URLs until configured.');
    } else {
      console.log(`✅ Supabase storage configured (bucket: ${this.bucketName})`);
    }
  }

  async uploadImage(buffer: Buffer, key: string): Promise<string> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(this.supabaseUrl, this.supabaseKey);

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(key, buffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(key);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      // Fallback: return a placeholder URL
      return `https://via.placeholder.com/800?text=Processed+Image`;
    }
  }

  async deleteImage(key: string): Promise<void> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(this.supabaseUrl, this.supabaseKey);

      await supabase.storage.from(this.bucketName).remove([key]);
    } catch (error) {
      console.error('Error deleting from Supabase:', error);
    }
  }
}

/**
 * AWS S3 Storage Implementation
 */
export class S3StorageService implements StorageService {
  private s3Client: any;
  private bucketName: string;

  constructor() {
    const { S3Client } = require('@aws-sdk/client-s3');
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'fashion-processed-images';
    
    // Log configuration status
    if (!accessKeyId || !secretAccessKey) {
      console.warn('⚠️  AWS S3 storage not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file.');
      console.warn('   Images will use placeholder URLs until configured.');
    } else {
      console.log(`✅ AWS S3 storage configured (bucket: ${this.bucketName}, region: ${process.env.AWS_REGION || 'us-east-1'})`);
    }
  }

  async uploadImage(buffer: Buffer, key: string): Promise<string> {
    try {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: buffer,
          ContentType: 'image/jpeg',
        })
      );

      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      return `https://via.placeholder.com/800?text=Processed+Image`;
    }
  }

  async deleteImage(key: string): Promise<void> {
    try {
      const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
    } catch (error) {
      console.error('Error deleting from S3:', error);
    }
  }
}

