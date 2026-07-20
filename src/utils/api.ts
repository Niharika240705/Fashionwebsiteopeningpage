import { ProductListResponse, ProductQuery, ProductSummary } from '../types/product';
import { AssistantChatResponse, AssistantHistoryTurn } from '../types/assistant';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

function buildQuery(params: Record<string, unknown> = {}): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      search.set(key, value.join(','));
    } else {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function testBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, { credentials: 'include' });
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
}

export async function getProducts(query: ProductQuery = {}): Promise<ProductListResponse> {
  return apiRequest(`/products${buildQuery(query as Record<string, unknown>)}`);
}

export async function getTrendingProducts(query: {
  category?: string;
  audience?: string;
  limit?: number;
} = {}): Promise<{ products: ProductSummary[] }> {
  return apiRequest(`/products/trending${buildQuery(query)}`);
}

export async function getProduct(id: string): Promise<{ product: ProductSummary }> {
  return apiRequest(`/products/${id}`);
}

export async function getCategories(audience = 'women'): Promise<{
  categories: Array<{ slug: string; label: string }>;
}> {
  return apiRequest(`/products/categories${buildQuery({ audience })}`);
}

export async function getSavedProducts(): Promise<{ products: ProductSummary[] }> {
  return apiRequest('/user/saved-products');
}

export async function saveProduct(productId: string): Promise<void> {
  await apiRequest(`/user/saved-products/${productId}`, { method: 'POST' });
}

export async function removeSavedProduct(productId: string): Promise<void> {
  await apiRequest(`/user/saved-products/${productId}`, { method: 'DELETE' });
}

export async function assistantChat(payload: {
  message: string;
  history?: AssistantHistoryTurn[];
}): Promise<AssistantChatResponse> {
  return apiRequest('/assistant/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getRedirectUrl(offerId: string, placement = 'product_card'): string {
  return `${API_URL}/r/${offerId}?placement=${encodeURIComponent(placement)}`;
}

export interface TryOnRequestPayload {
  productId?: string;
  garmentImageUrl: string;
  humanImageBase64?: string;
  humanImageUrl?: string;
  category?: string;
  sizeHint?: string;
  garmentDescription?: string;
}

export interface TryOnResponse {
  success: boolean;
  mode: 'photorealistic' | 'demo';
  provider: string;
  resultImageUrl: string;
  category: string;
  sizeHint?: string;
  message?: string;
}

/**
 * Requests a generative virtual try-on from the Node backend (POST /api/try-on), which forwards
 * to the configured provider (Replicate/fal.ai) server-side so API keys never reach the client.
 */
export async function requestTryOn(payload: TryOnRequestPayload): Promise<TryOnResponse> {
  return apiRequest('/try-on', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export default apiRequest;
