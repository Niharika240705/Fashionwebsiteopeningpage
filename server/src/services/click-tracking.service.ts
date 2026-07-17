import { randomUUID } from 'crypto';
import { Offer } from '../models/Offer.model';
import { Source } from '../models/Source.model';
import { ClickEvent } from '../models/ClickEvent.model';
import { isAllowedDestination } from './ingestion/compliance-policy.service';

export async function createTrackedRedirect(options: {
  offerId: string;
  placement?: string;
  sessionId?: string;
  userId?: string;
}): Promise<{ clickId: string; redirectUrl: string }> {
  const offer = await Offer.findById(options.offerId);
  if (!offer || offer.status !== 'active') {
    throw Object.assign(new Error('Offer not available'), { status: 404 });
  }

  const source = await Source.findOne({ sourceId: offer.sourceId, enabled: true });
  if (!source) {
    throw Object.assign(new Error('Source not available'), { status: 404 });
  }

  const destination = offer.affiliateUrl || offer.sellerUrl;
  if (!isAllowedDestination(source, destination)) {
    throw Object.assign(new Error('Destination host is not allowlisted'), { status: 400 });
  }

  const clickId = randomUUID();
  let redirectUrl = destination;
  let destinationHost = 'unknown';

  try {
    const url = new URL(destination);
    destinationHost = url.hostname;
    const subIdParam = source.affiliateConfig?.subIdParam || 'subid';
    url.searchParams.set(subIdParam, clickId);
    if (source.affiliateConfig?.trackingParam) {
      url.searchParams.set(source.affiliateConfig.trackingParam, 'fashioninsta');
    }
    redirectUrl = url.toString();
  } catch {
    // keep raw destination
  }

  await ClickEvent.create({
    clickId,
    offerId: offer._id,
    productId: offer.productId,
    sourceId: offer.sourceId,
    placement: options.placement,
    sessionId: options.sessionId,
    userId: options.userId,
    destinationHost,
  });

  return { clickId, redirectUrl };
}
