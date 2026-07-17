import { describe, expect, it } from 'vitest';
import { buildFingerprint, canonicalizeUrl, normalizeRawProduct } from './normalization.service';
import { normalizeCategory, isMvpCategory, isWomenMvpCategory } from './taxonomy.service';

describe('taxonomy', () => {
  it('normalizes category aliases', () => {
    expect(normalizeCategory('Dress')).toBe('dresses');
    expect(normalizeCategory('gown')).toBe('wedding-gowns');
    expect(normalizeCategory('bridal')).toBe('wedding-gowns');
    expect(normalizeCategory('saree')).toBe('ethnic-wear');
    expect(normalizeCategory('heels')).toBe('footwear');
    expect(normalizeCategory('jewellery')).toBe('jewellery');
    expect(isMvpCategory('women', 'wedding-gowns')).toBe(true);
  });

  it('accepts audience MVP categories', () => {
    expect(isWomenMvpCategory('tops')).toBe(true);
    expect(isMvpCategory('men', 'shirts')).toBe(true);
    expect(isMvpCategory('kids', 'sets')).toBe(true);
    expect(isMvpCategory('women', 'unknown-thing')).toBe(false);
  });
});

describe('normalization', () => {
  it('canonicalizes urls by stripping tracking params', () => {
    const url = canonicalizeUrl('https://shop.example.com/item?utm_source=x&color=red');
    expect(url).toContain('color=red');
    expect(url).not.toContain('utm_source');
  });

  it('builds stable fingerprints', () => {
    const a = buildFingerprint({ brand: 'Zara', name: 'Linen Top', category: 'tops', color: 'Ivory' });
    const b = buildFingerprint({ brand: 'zara', name: 'linen top', category: 'tops', color: 'ivory' });
    expect(a).toBe(b);
  });

  it('normalizes a raw affiliate product', () => {
    const normalized = normalizeRawProduct(
      {
        externalProductId: 'abc',
        name: ' Floral Midi Dress ',
        brand: ' Demo ',
        category: 'dress',
        audience: 'women',
        price: 1000,
        originalPrice: 2000,
        sellerUrl: 'https://example-retailer.com/p/1?utm_campaign=test',
        imageUrls: ['https://img.example/1.jpg'],
        color: 'pink',
      },
      'demo-affiliate'
    );

    expect(normalized.category).toBe('dresses');
    expect(normalized.discountPercentage).toBe(50);
    expect(normalized.canonicalUrl).not.toContain('utm_campaign');
    expect(normalized.dedupeKey).toContain('url:');
  });
});
