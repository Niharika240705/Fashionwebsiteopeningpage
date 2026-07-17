import { describe, expect, it } from 'vitest';
import { isAllowedDestination } from './ingestion/compliance-policy.service';
import { ISource } from '../models/Source.model';

describe('destination allowlist', () => {
  const source = {
    sourceId: 'demo-affiliate',
    domain: 'example-retailer.com',
    allowedDestinationHosts: ['example-retailer.com'],
  } as ISource;

  it('allows matching destination hosts', () => {
    expect(isAllowedDestination(source, 'https://www.example-retailer.com/item/1')).toBe(true);
  });

  it('blocks unknown destination hosts', () => {
    expect(isAllowedDestination(source, 'https://evil.example/phish')).toBe(false);
  });
});
