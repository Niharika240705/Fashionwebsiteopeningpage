import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sharp from 'sharp';

vi.mock('axios');
import axios from 'axios';

import {
  getConfiguredProvider,
  isMockMode,
  mapToProviderCategory,
  runVirtualTryOn,
  validateTryOnRequest,
} from './try-on.service';

const VALID_BASE64_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

describe('validateTryOnRequest', () => {
  it('accepts a valid payload with a base64 human image', () => {
    const result = validateTryOnRequest({
      garmentImageUrl: 'https://example.com/garment.jpg',
      humanImageBase64: VALID_BASE64_1PX,
      category: 'dresses',
      sizeHint: 'm',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.sizeHint).toBe('M');
      expect(result.data.category).toBe('dresses');
    }
  });

  it('accepts a valid payload using a human image URL instead of base64', () => {
    const result = validateTryOnRequest({
      garmentImageUrl: 'https://example.com/garment.jpg',
      humanImageUrl: 'https://example.com/human.jpg',
    });
    expect(result.valid).toBe(true);
  });

  it('rejects a missing garmentImageUrl', () => {
    const result = validateTryOnRequest({ humanImageBase64: VALID_BASE64_1PX });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === 'garmentImageUrl')).toBe(true);
    }
  });

  it('rejects a non-http garmentImageUrl', () => {
    const result = validateTryOnRequest({
      garmentImageUrl: 'javascript:alert(1)',
      humanImageBase64: VALID_BASE64_1PX,
    });
    expect(result.valid).toBe(false);
  });

  it('rejects when neither humanImageBase64 nor humanImageUrl is provided', () => {
    const result = validateTryOnRequest({ garmentImageUrl: 'https://example.com/g.jpg' });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === 'humanImageBase64')).toBe(true);
    }
  });

  it('rejects a malformed base64 data URL', () => {
    const result = validateTryOnRequest({
      garmentImageUrl: 'https://example.com/g.jpg',
      humanImageBase64: 'not-a-data-url',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects an invalid sizeHint', () => {
    const result = validateTryOnRequest({
      garmentImageUrl: 'https://example.com/g.jpg',
      humanImageBase64: VALID_BASE64_1PX,
      sizeHint: 'HUGE',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.field === 'sizeHint')).toBe(true);
    }
  });

  it('rejects a non-object body', () => {
    const result = validateTryOnRequest(null);
    expect(result.valid).toBe(false);
  });
});

describe('mapToProviderCategory', () => {
  it('maps dress-like categories to dresses', () => {
    expect(mapToProviderCategory('Dresses')).toBe('dresses');
    expect(mapToProviderCategory('evening gown')).toBe('dresses');
    expect(mapToProviderCategory('Sarees')).toBe('dresses');
  });

  it('maps bottoms to lower_body', () => {
    expect(mapToProviderCategory('Jeans')).toBe('lower_body');
    expect(mapToProviderCategory('trousers')).toBe('lower_body');
    expect(mapToProviderCategory('Skirts')).toBe('lower_body');
  });

  it('defaults everything else to upper_body', () => {
    expect(mapToProviderCategory('Jackets')).toBe('upper_body');
    expect(mapToProviderCategory(undefined)).toBe('upper_body');
  });
});

describe('provider configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.TRY_ON_MOCK;
    delete process.env.REPLICATE_API_TOKEN;
    delete process.env.FAL_KEY;
    delete process.env.TRY_ON_PROVIDER;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('reports mock mode from the TRY_ON_MOCK env var', () => {
    expect(isMockMode()).toBe(false);
    process.env.TRY_ON_MOCK = 'true';
    expect(isMockMode()).toBe(true);
  });

  it('returns null when no provider keys are configured', () => {
    expect(getConfiguredProvider()).toBeNull();
  });

  it('prefers replicate when its token is set', () => {
    process.env.REPLICATE_API_TOKEN = 'token';
    expect(getConfiguredProvider()).toBe('replicate');
  });

  it('falls back to fal when only FAL_KEY is set', () => {
    process.env.FAL_KEY = 'key';
    expect(getConfiguredProvider()).toBe('fal');
  });
});

describe('runVirtualTryOn', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.mocked(axios.get).mockReset();
    vi.mocked(axios.post).mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('throws a 503 explaining how to configure a provider when nothing is configured', async () => {
    delete process.env.TRY_ON_MOCK;
    delete process.env.REPLICATE_API_TOKEN;
    delete process.env.FAL_KEY;

    await expect(
      runVirtualTryOn({
        garmentImageUrl: 'https://example.com/garment.png',
        humanImageUrl: 'https://example.com/human.png',
      })
    ).rejects.toMatchObject({ status: 503 });
  });

  it('returns a clearly labeled demo-mode composite in mock mode without calling any AI provider', async () => {
    process.env.TRY_ON_MOCK = 'true';

    const tinyPng = await sharp({
      create: { width: 20, height: 20, channels: 3, background: { r: 200, g: 200, b: 200 } },
    })
      .png()
      .toBuffer();

    vi.mocked(axios.get).mockResolvedValue({ data: tinyPng } as any);

    const result = await runVirtualTryOn({
      garmentImageUrl: 'https://example.com/garment.png',
      humanImageBase64: `data:image/png;base64,${tinyPng.toString('base64')}`,
      category: 'tops',
    });

    expect(result.mode).toBe('demo');
    expect(result.provider).toBe('mock');
    expect(result.resultImageUrl).toMatch(/^data:image\//);
    expect(result.message).toMatch(/demo mode/i);
    expect(vi.mocked(axios.post)).not.toHaveBeenCalled();
  });
});
