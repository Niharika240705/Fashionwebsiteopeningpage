import axios from 'axios';
import sharp from 'sharp';

export type GarmentCategory = 'upper_body' | 'lower_body' | 'dresses';
export type TryOnProvider = 'replicate' | 'fal';

export interface TryOnRequestInput {
  productId?: string;
  garmentImageUrl: string;
  humanImageBase64?: string;
  humanImageUrl?: string;
  category?: string;
  sizeHint?: string;
  garmentDescription?: string;
}

export interface TryOnValidationError {
  field: string;
  message: string;
}

export type TryOnValidationResult =
  | { valid: true; data: TryOnRequestInput }
  | { valid: false; errors: TryOnValidationError[] };

export interface TryOnResult {
  mode: 'photorealistic' | 'demo';
  provider: TryOnProvider | 'mock';
  resultImageUrl: string;
  category: GarmentCategory;
  sizeHint?: string;
  message?: string;
}

const MAX_BASE64_BYTES = 12 * 1024 * 1024; // ~12MB decoded ceiling for a full-body photo
const VALID_SIZE_HINTS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const PROVIDER_TIMEOUT_MS = 55_000;

/**
 * Default IDM-VTON model version on Replicate (cuuupid/idm-vton). Replicate versions are
 * content-addressed and occasionally change when the model owner publishes updates — override
 * via REPLICATE_VTON_MODEL_VERSION if this default ever 404s, using the version id shown at
 * https://replicate.com/cuuupid/idm-vton/versions.
 */
const DEFAULT_REPLICATE_IDM_VTON_VERSION =
  '906425dbca90663ff5427624839572cc56ea7d380343d13e2a4c4b09d3f0c30f';

function isHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isDataUrlImage(value: unknown): boolean {
  return typeof value === 'string' && /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=]+$/i.test(value);
}

export function validateTryOnRequest(body: unknown): TryOnValidationResult {
  const errors: TryOnValidationError[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: [{ field: 'body', message: 'Request body is required' }] };
  }

  const {
    productId,
    garmentImageUrl,
    humanImageBase64,
    humanImageUrl,
    category,
    sizeHint,
    garmentDescription,
  } = body as Record<string, unknown>;

  if (!isHttpUrl(garmentImageUrl)) {
    errors.push({ field: 'garmentImageUrl', message: 'garmentImageUrl must be a valid http(s) URL' });
  }

  const hasBase64 = typeof humanImageBase64 === 'string' && humanImageBase64.trim().length > 0;
  const hasUrl = typeof humanImageUrl === 'string' && humanImageUrl.trim().length > 0;

  if (!hasBase64 && !hasUrl) {
    errors.push({
      field: 'humanImageBase64',
      message: 'Provide humanImageBase64 (data URL) or humanImageUrl',
    });
  }

  if (hasBase64 && !isDataUrlImage(humanImageBase64)) {
    errors.push({
      field: 'humanImageBase64',
      message: 'humanImageBase64 must be a data:image/(png|jpeg|webp);base64,... string',
    });
  } else if (hasBase64) {
    const b64 = String(humanImageBase64).split(',')[1] || '';
    const approxBytes = Math.ceil((b64.length * 3) / 4);
    if (approxBytes > MAX_BASE64_BYTES) {
      errors.push({
        field: 'humanImageBase64',
        message: 'Photo is too large. Please use a smaller image (max ~12MB).',
      });
    }
  }

  if (hasUrl && !isHttpUrl(humanImageUrl)) {
    errors.push({ field: 'humanImageUrl', message: 'humanImageUrl must be a valid http(s) URL' });
  }

  if (productId !== undefined && typeof productId !== 'string') {
    errors.push({ field: 'productId', message: 'productId must be a string' });
  }

  if (category !== undefined && typeof category !== 'string') {
    errors.push({ field: 'category', message: 'category must be a string' });
  }

  if (garmentDescription !== undefined && typeof garmentDescription !== 'string') {
    errors.push({ field: 'garmentDescription', message: 'garmentDescription must be a string' });
  }

  if (sizeHint !== undefined && !VALID_SIZE_HINTS.includes(String(sizeHint).toUpperCase())) {
    errors.push({
      field: 'sizeHint',
      message: `sizeHint must be one of ${VALID_SIZE_HINTS.join(', ')}`,
    });
  }

  if (errors.length) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      productId: typeof productId === 'string' ? productId : undefined,
      garmentImageUrl: garmentImageUrl as string,
      humanImageBase64: hasBase64 ? (humanImageBase64 as string) : undefined,
      humanImageUrl: hasUrl ? (humanImageUrl as string) : undefined,
      category: typeof category === 'string' ? category : undefined,
      sizeHint: typeof sizeHint === 'string' ? sizeHint.toUpperCase() : undefined,
      garmentDescription:
        typeof garmentDescription === 'string' ? garmentDescription.slice(0, 300) : undefined,
    },
  };
}

/** Maps free-form catalog category/subcategory text to the category flag VTON models expect. */
export function mapToProviderCategory(category?: string): GarmentCategory {
  const c = (category || '').toLowerCase();
  if (/dress|gown|jumpsuit|romper|saree/.test(c)) return 'dresses';
  if (/pant|jean|trouser|short|skirt|legging|bottom|lower|co-?ord/.test(c)) return 'lower_body';
  return 'upper_body';
}

export function isMockMode(): boolean {
  return process.env.TRY_ON_MOCK === 'true';
}

export function getConfiguredProvider(): TryOnProvider | null {
  const preferred = (process.env.TRY_ON_PROVIDER || '').toLowerCase();
  if (preferred === 'replicate' && process.env.REPLICATE_API_TOKEN) return 'replicate';
  if (preferred === 'fal' && process.env.FAL_KEY) return 'fal';
  if (process.env.REPLICATE_API_TOKEN) return 'replicate';
  if (process.env.FAL_KEY) return 'fal';
  return null;
}

function providerError(message: string, status = 502): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildGarmentDescription(input: TryOnRequestInput): string {
  const parts: string[] = [];
  if (input.garmentDescription) parts.push(input.garmentDescription);
  if (input.sizeHint) parts.push(`size ${input.sizeHint} fit`);
  return parts.join(', ') || 'Fashion garment';
}

/**
 * Runs a photorealistic virtual try-on via whichever provider is configured, or a clearly
 * labeled local demo composite when TRY_ON_MOCK=true. Throws an Error with a `status` property
 * for the route layer to map to an HTTP response.
 */
export async function runVirtualTryOn(input: TryOnRequestInput): Promise<TryOnResult> {
  const category = mapToProviderCategory(input.category);

  if (isMockMode()) {
    return runMockTryOn(input, category);
  }

  const provider = getConfiguredProvider();
  if (!provider) {
    throw providerError(
      'Photorealistic try-on is not configured. Set REPLICATE_API_TOKEN or FAL_KEY on the server (see server/.env.example), or set TRY_ON_MOCK=true for local demo mode.',
      503
    );
  }

  const humanImage = (input.humanImageBase64 || input.humanImageUrl) as string;

  return provider === 'replicate'
    ? runReplicateTryOn(humanImage, input, category)
    : runFalTryOn(humanImage, input, category);
}

async function runReplicateTryOn(
  humanImage: string,
  input: TryOnRequestInput,
  category: GarmentCategory
): Promise<TryOnResult> {
  const token = process.env.REPLICATE_API_TOKEN as string;
  const version = process.env.REPLICATE_VTON_MODEL_VERSION || DEFAULT_REPLICATE_IDM_VTON_VERSION;

  let createResp;
  try {
    createResp = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version,
        input: {
          human_img: humanImage,
          garm_img: input.garmentImageUrl,
          category,
          garment_des: buildGarmentDescription(input),
        },
      },
      {
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
        timeout: 15_000,
      }
    );
  } catch (error) {
    throw providerError(describeAxiosError(error, 'Replicate'), 502);
  }

  const predictionId: string | undefined = createResp.data?.id;
  const getUrl: string =
    createResp.data?.urls?.get || `https://api.replicate.com/v1/predictions/${predictionId}`;

  if (!predictionId) {
    throw providerError('Replicate did not return a prediction id.', 502);
  }

  let status: string = createResp.data?.status;
  let output = createResp.data?.output;
  const startedAt = Date.now();

  while (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
    if (Date.now() - startedAt > PROVIDER_TIMEOUT_MS) {
      throw providerError('Try-on generation timed out. Please try again.', 504);
    }
    await sleep(2000);
    try {
      const pollResp = await axios.get(getUrl, {
        headers: { Authorization: `Token ${token}` },
        timeout: 15_000,
      });
      status = pollResp.data?.status;
      output = pollResp.data?.output;
    } catch (error) {
      throw providerError(describeAxiosError(error, 'Replicate'), 502);
    }
  }

  if (status !== 'succeeded' || !output) {
    throw providerError('Try-on generation failed for this photo. Please try a clearer full-body photo.', 502);
  }

  const resultImageUrl = Array.isArray(output) ? output[0] : output;

  return {
    mode: 'photorealistic',
    provider: 'replicate',
    resultImageUrl,
    category,
    sizeHint: input.sizeHint,
  };
}

async function runFalTryOn(
  humanImage: string,
  input: TryOnRequestInput,
  category: GarmentCategory
): Promise<TryOnResult> {
  const key = process.env.FAL_KEY as string;
  const model = process.env.FAL_VTON_MODEL || 'fal-ai/idm-vton';

  try {
    const resp = await axios.post(
      `https://fal.run/${model}`,
      {
        human_image_url: humanImage,
        garment_image_url: input.garmentImageUrl,
        description: buildGarmentDescription(input),
        category,
      },
      {
        headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
        timeout: PROVIDER_TIMEOUT_MS,
      }
    );

    const imageUrl: string | undefined =
      resp.data?.image?.url || resp.data?.images?.[0]?.url || resp.data?.image_url;

    if (!imageUrl) {
      throw providerError('fal.ai did not return a result image.', 502);
    }

    return {
      mode: 'photorealistic',
      provider: 'fal',
      resultImageUrl: imageUrl,
      category,
      sizeHint: input.sizeHint,
    };
  } catch (error: any) {
    if (error?.status) throw error;
    throw providerError(describeAxiosError(error, 'fal.ai'), 502);
  }
}

function describeAxiosError(error: unknown, providerLabel: string): string {
  const anyErr = error as any;
  const providerMessage =
    anyErr?.response?.data?.detail || anyErr?.response?.data?.message || anyErr?.message;
  return `${providerLabel} request failed: ${providerMessage || 'unknown error'}`;
}

/**
 * Local "Demo mode" composite for UI testing without a provider key. This is a simple image
 * composite (garment overlaid on the photo) — it is intentionally NOT presented as photorealistic
 * AI output. Every response from this path is labeled mode: 'demo' with an explicit message so the
 * frontend can show a clear banner instead of implying a real generative result.
 */
async function runMockTryOn(input: TryOnRequestInput, category: GarmentCategory): Promise<TryOnResult> {
  const demoMessage =
    'Demo mode: this is a simple local composite for UI testing, not a photorealistic AI result. Configure REPLICATE_API_TOKEN or FAL_KEY to enable real generative try-on.';

  try {
    const humanBuffer = await loadImageBuffer(input.humanImageBase64, input.humanImageUrl);
    const garmentBuffer = await loadImageBuffer(undefined, input.garmentImageUrl);

    const humanMeta = await sharp(humanBuffer).metadata();
    const width = humanMeta.width || 900;
    const height = humanMeta.height || 1200;

    // Clamp the banner and garment overlay to the actual image bounds so tiny/unusual photo
    // dimensions (e.g. thumbnails) never produce a composite input larger than the base canvas.
    const bannerHeight = Math.max(1, Math.min(height, Math.round(height * 0.05) || 1));
    const overlayTop = Math.max(0, Math.min(height - bannerHeight, Math.round(height * 0.16)));
    const maxGarmentHeight = Math.max(1, height - overlayTop - bannerHeight);

    const garmentResized = await sharp(garmentBuffer)
      .resize({ width: Math.max(1, Math.round(width * 0.6)), height: maxGarmentHeight, fit: 'inside' })
      .toBuffer();
    const garmentMeta = await sharp(garmentResized).metadata();

    const overlayLeft = Math.max(0, Math.round((width - (garmentMeta.width || 0)) / 2));

    const watermarkSvg = Buffer.from(
      `<svg width="${width}" height="${bannerHeight}" xmlns="http://www.w3.org/2000/svg">` +
        `<rect width="100%" height="100%" fill="black" opacity="0.6"/>` +
        `<text x="50%" y="${Math.round(bannerHeight * 0.65)}" font-size="${Math.max(14, Math.round(bannerHeight * 0.4))}" fill="white" font-family="sans-serif" text-anchor="middle" letter-spacing="2">DEMO MODE — NOT PHOTOREALISTIC</text>` +
        `</svg>`
    );

    const composite = await sharp(humanBuffer)
      .resize({ width, height })
      .composite([
        { input: garmentResized, top: overlayTop, left: overlayLeft, blend: 'multiply' },
        { input: watermarkSvg, top: Math.max(0, height - bannerHeight), left: 0 },
      ])
      .jpeg({ quality: 85 })
      .toBuffer();

    return {
      mode: 'demo',
      provider: 'mock',
      resultImageUrl: `data:image/jpeg;base64,${composite.toString('base64')}`,
      category,
      sizeHint: input.sizeHint,
      message: demoMessage,
    };
  } catch (error) {
    return {
      mode: 'demo',
      provider: 'mock',
      resultImageUrl: input.garmentImageUrl,
      category,
      sizeHint: input.sizeHint,
      message: `${demoMessage} (Composite failed, showing the garment image instead.)`,
    };
  }
}

async function loadImageBuffer(base64DataUrl?: string, url?: string): Promise<Buffer> {
  if (base64DataUrl) {
    const b64 = base64DataUrl.split(',')[1] || '';
    return Buffer.from(b64, 'base64');
  }
  if (!url) {
    throw new Error('No image source provided');
  }
  const resp = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer', timeout: 15_000 });
  return Buffer.from(resp.data);
}
