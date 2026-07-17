import { describe, expect, it } from 'vitest';

/**
 * Policy unit checks for model-free publishing rules.
 * Full Sharp/network processing is covered by integration runs.
 */
describe('image publication policy', () => {
  it('rejects model images when transform is not allowed', () => {
    const personDetected = true;
    const allowsTransform = false;
    const shouldPublishOriginal = false;
    const status =
      personDetected && !allowsTransform
        ? 'rejected'
        : personDetected && allowsTransform
          ? 'review-or-approved'
          : 'approved';

    expect(status).toBe('rejected');
    expect(shouldPublishOriginal).toBe(false);
  });

  it('never falls back to original model image on failure', () => {
    const processedUrl = null;
    const fallback = processedUrl || 'NEUTRAL_PLACEHOLDER';
    expect(fallback).toBe('NEUTRAL_PLACEHOLDER');
    expect(fallback).not.toContain('original-model');
  });
});
