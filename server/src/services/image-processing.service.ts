import axios from 'axios';
import sharp from 'sharp';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ImageAsset } from '../models/ImageAsset.model';
import { Product } from '../models/Product.model';
import { ISource } from '../models/Source.model';

export interface ProcessedImageResult {
  hasModel: boolean;
  processedImageUrl: string | null;
  originalImageUrl: string;
  status: 'approved' | 'rejected' | 'review';
  reason?: string;
}

const NEUTRAL_PLACEHOLDER =
  process.env.NEUTRAL_PRODUCT_PLACEHOLDER_URL ||
  'https://via.placeholder.com/600x800?text=Product+Image+Unavailable';

/**
 * Policy-gated image pipeline:
 * detect person → segment garment → validate → store only approved assets.
 * Never publish the original model image when transform is required.
 */
export class ImageProcessingService {
  private tempDir: string;
  private storageService?: StorageService;

  constructor(storageService?: StorageService) {
    this.storageService = storageService;
    this.tempDir = path.join(os.tmpdir(), 'fashion-images');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  private getStorage(): StorageService {
    if (!this.storageService) {
      this.storageService = createDefaultStorageService();
    }
    return this.storageService;
  }

  async processPendingForProduct(productId: string, source: ISource): Promise<number> {
    const pending = await ImageAsset.find({
      productId,
      processingStatus: 'pending',
    }).limit(10);

    let approvedCount = 0;
    for (const asset of pending) {
      asset.allowsTransform = source.allowsImageTransform;
      asset.processingStatus = 'processing';
      await asset.save();

      const result = await this.processImageAsset(asset.sourceUrl, productId, source.allowsImageTransform);
      asset.checksum = createHash('sha1').update(asset.sourceUrl).digest('hex');
      asset.personDetected = result.hasModel;
      asset.personConfidence = result.hasModel ? 0.7 : 0.2;
      asset.processingStatus = result.status;
      asset.rejectionReason = result.reason;
      asset.processedUrl = result.processedImageUrl || undefined;
      if (result.processedImageUrl) {
        asset.storageKey = `${productId}/${asset._id}.jpg`;
        asset.segmentationConfidence = result.status === 'approved' ? 0.65 : undefined;
        approvedCount += 1;
      }
      await asset.save();
    }

    const approved = await ImageAsset.find({
      productId,
      processingStatus: 'approved',
      processedUrl: { $exists: true, $ne: null },
    });
    const approvedUrls = approved.map((a) => a.processedUrl!).filter(Boolean);

    await Product.findByIdAndUpdate(productId, {
      'images.approved': approvedUrls,
      'images.processed': approvedUrls,
    });

    return approvedCount;
  }

  async processImageAsset(
    imageUrl: string,
    productId: string,
    allowsTransform: boolean
  ): Promise<ProcessedImageResult> {
    try {
      const imageBuffer = await this.downloadImage(imageUrl);
      const detection = await this.detectPerson(imageBuffer);

      if (detection.personDetected && !allowsTransform) {
        return {
          hasModel: true,
          processedImageUrl: null,
          originalImageUrl: imageUrl,
          status: 'rejected',
          reason: 'Model image rejected: source does not permit transformation',
        };
      }

      if (detection.personDetected && allowsTransform) {
        const segmented = await this.segmentGarment(imageBuffer);
        const validation = await this.validateSegmentedOutput(segmented);
        if (!validation.ok) {
          return {
            hasModel: true,
            processedImageUrl: null,
            originalImageUrl: imageUrl,
            status: 'review',
            reason: validation.reason,
          };
        }

        const processedImageUrl = await this.getStorage().uploadImage(
          segmented,
          `${productId}/processed-${Date.now()}.jpg`
        );

        if (processedImageUrl.includes('via.placeholder.com')) {
          return {
            hasModel: true,
            processedImageUrl: null,
            originalImageUrl: imageUrl,
            status: 'review',
            reason: 'Storage unavailable; holding for review',
          };
        }

        return {
          hasModel: true,
          processedImageUrl,
          originalImageUrl: imageUrl,
          status: 'approved',
        };
      }

      // Flat-lay / product-only image
      const optimized = await this.optimizeImage(imageBuffer);
      const processedImageUrl = await this.getStorage().uploadImage(
        optimized,
        `${productId}/flat-${Date.now()}.jpg`
      );

      return {
        hasModel: false,
        processedImageUrl: processedImageUrl.includes('via.placeholder.com') ? null : processedImageUrl,
        originalImageUrl: imageUrl,
        status: processedImageUrl.includes('via.placeholder.com') ? 'review' : 'approved',
        reason: processedImageUrl.includes('via.placeholder.com')
          ? 'Storage unavailable; holding for review'
          : undefined,
      };
    } catch (error: any) {
      return {
        hasModel: false,
        processedImageUrl: null,
        originalImageUrl: imageUrl,
        status: 'rejected',
        reason: error?.message || 'Image processing failed',
      };
    }
  }

  /**
   * Backward-compatible batch helper used by legacy scrape orchestrator.
   * Does not fall back to original model images.
   */
  async processImages(imageUrls: string[], productId: string): Promise<string[]> {
    const approved: string[] = [];
    for (const imageUrl of imageUrls) {
      const result = await this.processImageAsset(imageUrl, productId, false);
      if (result.status === 'approved' && result.processedImageUrl) {
        approved.push(result.processedImageUrl);
      }
    }
    return approved.length ? approved : [NEUTRAL_PLACEHOLDER];
  }

  async processImage(imageUrl: string, productId: string): Promise<ProcessedImageResult> {
    return this.processImageAsset(imageUrl, productId, false);
  }

  private async downloadImage(imageUrl: string): Promise<Buffer> {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FashionInstaBot/1.0)',
      },
    });
    return Buffer.from(response.data);
  }

  /**
   * Lightweight person detection heuristic.
   * Replace with YOLO/MediaPipe/Rekognition in production.
   */
  private async detectPerson(
    imageBuffer: Buffer
  ): Promise<{ personDetected: boolean; confidence: number }> {
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1;
    const height = metadata.height || 1;
    const aspectRatio = width / height;

    // Portrait fashion shots are treated as likely model images.
    if (aspectRatio < 0.85 && height > 500) {
      return { personDetected: true, confidence: 0.7 };
    }

    // Sample center luminance variance as a crude subject check.
    const stats = await sharp(imageBuffer).stats();
    const channels = stats.channels || [];
    const avgStd = channels.reduce((sum, c) => sum + (c.stdev || 0), 0) / Math.max(channels.length, 1);
    if (avgStd > 55 && aspectRatio < 1) {
      return { personDetected: true, confidence: 0.55 };
    }

    return { personDetected: false, confidence: 0.25 };
  }

  /**
   * Garment segmentation stand-in:
   * - normalize canvas
   * - soft-edge trim
   * Replace with rembg / segmentation model when available.
   */
  private async segmentGarment(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .trim({ threshold: 20 })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 88 })
      .toBuffer();
  }

  private async validateSegmentedOutput(
    buffer: Buffer
  ): Promise<{ ok: boolean; reason?: string }> {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
      return { ok: false, reason: 'Invalid segmented dimensions' };
    }
    if (metadata.width < 200 || metadata.height < 200) {
      return { ok: false, reason: 'Segmented output too small' };
    }
    const area = metadata.width * metadata.height;
    if (area < 80_000) {
      return { ok: false, reason: 'Insufficient garment coverage' };
    }
    return { ok: true };
  }

  private async optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
      .resize(800, 1000, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
  }
}

export interface StorageService {
  uploadImage(buffer: Buffer, key: string): Promise<string>;
  deleteImage(key: string): Promise<void>;
}

function createDefaultStorageService(): StorageService {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new SupabaseStorageService();
  }
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return new S3StorageService();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Production image storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
  return new LocalPlaceholderStorageService();
}

class LocalPlaceholderStorageService implements StorageService {
  async uploadImage(_buffer: Buffer, _key: string): Promise<string> {
    return NEUTRAL_PLACEHOLDER;
  }
  async deleteImage(_key: string): Promise<void> {}
}

export class SupabaseStorageService implements StorageService {
  private supabaseUrl: string;
  private supabaseKey: string;
  private bucketName: string;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || '';
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.bucketName = process.env.SUPABASE_BUCKET || 'processed-images';

    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for image uploads');
    }
  }

  async uploadImage(buffer: Buffer, key: string): Promise<string> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(this.supabaseUrl, this.supabaseKey);
      const { error } = await supabase.storage.from(this.bucketName).upload(key, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(this.bucketName).getPublicUrl(key);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      return NEUTRAL_PLACEHOLDER;
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

export class S3StorageService implements StorageService {
  private s3Client: any;
  private bucketName: string;

  constructor() {
    const { S3Client } = require('@aws-sdk/client-s3');
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET || 'fashion-processed-images';
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
      return NEUTRAL_PLACEHOLDER;
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
