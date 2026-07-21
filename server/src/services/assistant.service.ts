import axios from 'axios';
import { Product } from '../models/Product.model';
import { formatProductResponse } from '../routes/product.routes';
import {
  Audience,
  getCategoriesForAudience,
  getCategoryOptionsForAudience,
  labelForCategory,
  normalizeAudience,
  normalizeCategory,
} from './ingestion/taxonomy.service';
import { isPythonCatalogEnabled, pythonCatalogService } from './python-catalog.service';

/**
 * Persona AI — backend brain.
 *
 * Mirrors the frontend rule/intent layer (fast, no LLM needed) for the
 * common questions, performs catalog search against the real product
 * database, and only reaches for OpenAI when a message doesn't match any
 * known rule/search pattern AND `OPENAI_API_KEY` is configured. Without a
 * key, everything still works via rules + catalog search.
 */

export interface AssistantHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantResult {
  reply: string;
  products?: any[];
  navigateTo?: string;
}

interface BudgetTier {
  label: string;
  minPrice?: number;
  maxPrice?: number;
}

export const BUDGET_TIERS: BudgetTier[] = [
  { label: 'Budget', maxPrice: 1500 },
  { label: 'Mid-Range', minPrice: 1500, maxPrice: 4000 },
  { label: 'Premium', minPrice: 4000, maxPrice: 10000 },
  { label: 'Luxury', minPrice: 10000 },
];

function formatTierRange(tier: BudgetTier): string {
  if (tier.minPrice && tier.maxPrice) return `₹${tier.minPrice.toLocaleString()}–₹${tier.maxPrice.toLocaleString()}`;
  if (tier.maxPrice) return `Under ₹${tier.maxPrice.toLocaleString()}`;
  if (tier.minPrice) return `₹${tier.minPrice.toLocaleString()}+`;
  return 'Any price';
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Catalog search --------------------------------------------------------

export interface CatalogSearchParams {
  q?: string;
  audience?: string;
  category?: string;
  color?: string;
  limit?: number;
}

export async function searchCatalog(params: CatalogSearchParams): Promise<any[]> {
  const audience = normalizeAudience(params.audience);
  const limit = Math.min(Math.max(params.limit || 6, 1), 12);

  if (isPythonCatalogEnabled()) {
    const result = await pythonCatalogService.listProducts({
      q: params.q?.trim() || undefined,
      category: params.category ? normalizeCategory(params.category) : undefined,
      audience,
      color: params.color ? [params.color] : undefined,
      sort: 'relevance',
      page: 1,
      limit,
    });
    return result.products;
  }

  const query: Record<string, any> = { audience };
  if (params.category) query.category = normalizeCategory(params.category);
  if (params.color) query['metadata.color'] = new RegExp(escapeRegex(params.color), 'i');
  if (params.q?.trim()) query.$text = { $search: params.q.trim() };

  const products = await Product.find(query)
    .sort({ trendScore: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return Promise.all(products.map((product) => formatProductResponse(product)));
}

// --- Rule/intent layer ------------------------------------------------------

type IntentType =
  | 'greeting'
  | 'try-on'
  | 'budget'
  | 'wedding'
  | 'ufind'
  | 'navigation'
  | 'faq'
  | 'search'
  | 'designers'
  | 'unknown';

interface DetectedIntent {
  type: IntentType;
  audience?: Audience;
  category?: string;
  color?: string;
  query?: string;
}

const AUDIENCE_KEYWORDS: Record<Audience, RegExp> = {
  women: /\b(women'?s?|woman|female|ladies|lady)\b/i,
  men: /\b(men'?s?|man|male|gents?|guys?)\b/i,
  kids: /\b(kids?|children|child|boys?|girls?|baby|babies|toddlers?)\b/i,
};

const COLOR_WORDS = [
  'black', 'white', 'red', 'blue', 'navy', 'green', 'olive', 'pink', 'yellow',
  'beige', 'ivory', 'cream', 'maroon', 'gold', 'golden', 'silver', 'purple',
  'violet', 'lavender', 'orange', 'brown', 'tan', 'rust', 'grey', 'gray',
  'multicolor', 'peach', 'mint', 'teal', 'burgundy', 'mustard',
];

const SEARCH_TRIGGER = /\b(show me|find|search|looking for|shop|buy|need|want|browse|get me)\b/i;

const DESIGNER_TRIGGER =
  /\bdesigners?\b|\bcouturiers?\b|\bcouture\b|bridal (wear|couturier)|sabyasachi|manish malhotra|tarun tahiliani|anita dongre|ritu kumar/i;

const CATEGORY_LOOKUP: Array<{ audience: Audience; slug: string; label: string }> = (
  ['women', 'men', 'kids'] as Audience[]
).flatMap((audience) =>
  getCategoryOptionsForAudience(audience).map(({ slug, label }) => ({ audience, slug, label }))
);

function detectAudience(lower: string): Audience | undefined {
  for (const audience of ['women', 'men', 'kids'] as Audience[]) {
    if (AUDIENCE_KEYWORDS[audience].test(lower)) return audience;
  }
  return undefined;
}

function detectCategory(lower: string): { audience: Audience; slug: string; label: string } | undefined {
  let best: { audience: Audience; slug: string; label: string; length: number } | undefined;
  for (const entry of CATEGORY_LOOKUP) {
    const label = entry.label.toLowerCase();
    const singular = label.endsWith('s') ? label.slice(0, -1) : label;
    if (lower.includes(label) || (singular.length > 3 && lower.includes(singular))) {
      if (!best || label.length > best.length) best = { ...entry, length: label.length };
    }
  }
  return best;
}

function detectColor(lower: string): string | undefined {
  return COLOR_WORDS.find((color) => new RegExp(`\\b${color}\\b`, 'i').test(lower));
}

function detectIntent(raw: string): DetectedIntent {
  const lower = raw.trim().toLowerCase();
  if (!lower) return { type: 'unknown' };

  if (/^(hi|hello|hey|hiya|yo|sup|good morning|good evening|good afternoon)\b/.test(lower)) {
    return { type: 'greeting' };
  }
  if (/try[-\s]?on|virtual fitting|fitting room|how (do|can) i (try|wear)/.test(lower)) {
    return { type: 'try-on' };
  }
  if (/wedding\s*(gown|dress)|bridal/.test(lower)) {
    return { type: 'wedding' };
  }
  if (/\bbudget\b|price range|how much|afford|luxury tier|mid-?range/.test(lower)) {
    return { type: 'budget' };
  }
  if (/\bufind\b|body shape|body type|which shape am i/.test(lower)) {
    return { type: 'ufind' };
  }
  if (/side ?menu|how (do|to) i (navigate|browse)|where is the menu|find categories/.test(lower)) {
    return { type: 'navigation' };
  }
  if (/\bfaq\b|frequently asked|^help$|^help me\??$/.test(lower)) {
    return { type: 'faq' };
  }
  if (DESIGNER_TRIGGER.test(lower)) {
    return { type: 'designers' };
  }

  const audience = detectAudience(lower);
  const category = detectCategory(lower);
  const color = detectColor(lower);

  if (category || color || SEARCH_TRIGGER.test(lower)) {
    return {
      type: 'search',
      audience: category?.audience || audience,
      category: category?.slug,
      color,
      query: raw.trim(),
    };
  }

  return { type: 'unknown' };
}

// --- Canned replies ----------------------------------------------------------

const GREETING_FOLLOW_UP =
  "Hey again! What are you looking for — dresses, menswear, kids' picks, or something specific?";

const TRY_ON_REPLY =
  'Virtual Try-On in three steps: log in, open an eligible product page, then tap "Try On" and allow camera ' +
  'access — the garment overlays your live camera feed and you can scale/reposition it to preview the fit. ' +
  "It's a styling preview, not a guaranteed fit.";

const UFIND_REPLY =
  'UFIND is our body-shape quiz — tap "UFIND" in the header, answer a few quick questions (or pick your shape ' +
  "directly), and we'll curate a feed suited to your silhouette.";

const NAVIGATION_REPLY =
  'Tap the menu icon (top-left) to open navigation — choose Women, Men, or Kids, then pick a category. The ' +
  'category list is pulled live from our catalog, so it always matches what we sell.';

const FAQ_REPLY =
  'A few quick answers: we link you to trusted retailers (checkout happens on their site); Try-On is a styling ' +
  'preview, not a guaranteed fit; UFIND gives personalized picks from a short body-shape quiz; browse the ' +
  'Designers directory for India\'s top couturiers; save items with the bookmark icon to find them later.';

const DESIGNERS_REPLY =
  "We have a full directory of India's leading designer houses — Sabyasachi, Manish Malhotra, Tarun Tahiliani, " +
  'Anita Dongre, and more — each with a curated collection. Open "Designers" from the menu to browse.';

const SEARCH_EMPTY_REPLY =
  "I couldn't find an exact match for that. Try a different keyword, or ask me about dresses, wedding gowns, or menswear.";

const FALLBACK_REPLY =
  "I didn't quite catch that — could you rephrase? Or ask me about dresses, try-on, budget tiers, or wedding gowns.";

function budgetReply(): string {
  return (
    'We group pieces into four price tiers: ' +
    BUDGET_TIERS.map((tier) => `${tier.label} (${formatTierRange(tier)})`).join(', ') +
    '. You can also set a custom price range in the filters on the Search page.'
  );
}

// --- OpenAI (optional) -------------------------------------------------------

function buildSystemPrompt(): string {
  const label = (audience: Audience) => getCategoriesForAudience(audience).map((c) => labelForCategory(c)).join(', ');

  return [
    'You are Persona AI, the in-house fashion assistant for a premium online fashion marketplace.',
    'Tone: friendly, professional, concise, premium. Never verbose (reply under 60 words). No emoji, no markdown.',
    '',
    'Site knowledge:',
    `- Categories — Women: ${label('women')}. Men: ${label('men')}. Kids: ${label('kids')}.`,
    '- Virtual Try-On: log in, open a product page, tap "Try On", allow camera access; the garment overlays the ' +
      "live camera feed with size/position controls to preview fit. It's a styling preview, not a guaranteed fit.",
    '- Budget filter tiers (INR): Budget under ₹1,500; Mid-Range ₹1,500–₹4,000; Premium ₹4,000–₹10,000; Luxury ' +
      '₹10,000+. Custom ranges are available via the Search page filters.',
    '- UFIND: a short body-shape questionnaire (header button "UFIND") that curates a personalized feed.',
    '- Navigation: the menu icon (top-left) opens Women/Men/Kids categories pulled live from the catalog.',
    '- Designers: a directory at /designers of India\'s leading designer houses (Sabyasachi, Manish Malhotra, ' +
      'Tarun Tahiliani, Anita Dongre, and more), each with its own collection page at /designers/:slug.',
    '',
    'Respond ONLY with a JSON object of this exact shape:',
    '{ "reply": string, "searchQuery"?: { "q"?: string, "audience"?: "women"|"men"|"kids", "category"?: string, "color"?: string }, "navigateTo"?: string }',
    'Include "searchQuery" only when the user wants to find/browse/compare specific products. Include ' +
      '"navigateTo" only for a real internal path (e.g. "/women/dresses"). Never invent products, prices, or ' +
      "policies that aren't described above. If you can't help, say so briefly and suggest a category.",
  ].join('\n');
}

interface OpenAiStructuredReply {
  reply: string;
  searchQuery?: CatalogSearchParams;
  navigateTo?: string;
}

async function callOpenAI(
  message: string,
  history: AssistantHistoryTurn[]
): Promise<OpenAiStructuredReply | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const messages = [
      { role: 'system', content: buildSystemPrompt() },
      ...history.slice(-6).map((turn) => ({ role: turn.role, content: turn.content })),
      { role: 'user', content: message },
    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages,
        temperature: 0.4,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return null;

    const parsed = JSON.parse(content);
    if (typeof parsed?.reply !== 'string' || !parsed.reply.trim()) return null;

    return {
      reply: parsed.reply.trim(),
      searchQuery: parsed.searchQuery && typeof parsed.searchQuery === 'object' ? parsed.searchQuery : undefined,
      navigateTo: typeof parsed.navigateTo === 'string' ? parsed.navigateTo : undefined,
    };
  } catch (error: any) {
    console.error('[assistant] OpenAI call failed:', error?.response?.data || error?.message || error);
    return null;
  }
}

// --- Orchestration ------------------------------------------------------------

export async function getAssistantResponse(
  message: string,
  history: AssistantHistoryTurn[] = []
): Promise<AssistantResult> {
  const intent = detectIntent(message);

  switch (intent.type) {
    case 'greeting':
      return { reply: GREETING_FOLLOW_UP };

    case 'try-on':
      return { reply: TRY_ON_REPLY };

    case 'budget':
      return { reply: budgetReply() };

    case 'ufind':
      return { reply: UFIND_REPLY };

    case 'navigation':
      return { reply: NAVIGATION_REPLY };

    case 'faq':
      return { reply: FAQ_REPLY };

    case 'designers':
      return { reply: DESIGNERS_REPLY };

    case 'wedding': {
      const products = await safeSearch({ audience: 'women', category: 'wedding-gowns', limit: 4 });
      return {
        reply: 'We have a full Wedding Gowns collection under Women. Here are a few pieces to start.',
        products,
      };
    }

    case 'search': {
      const products = await safeSearch({
        q: intent.query,
        audience: intent.audience,
        category: intent.category,
        color: intent.color,
        limit: 6,
      });
      return {
        reply: products.length
          ? `Found ${products.length} piece${products.length === 1 ? '' : 's'} I think you'll love:`
          : SEARCH_EMPTY_REPLY,
        products,
      };
    }

    case 'unknown':
    default: {
      const ai = await callOpenAI(message, history);
      if (ai) {
        let products: any[] | undefined;
        if (ai.searchQuery) {
          products = await safeSearch({ ...ai.searchQuery, limit: 6 });
        }
        return { reply: ai.reply, products, navigateTo: ai.navigateTo };
      }
      return { reply: FALLBACK_REPLY };
    }
  }
}

async function safeSearch(params: CatalogSearchParams): Promise<any[]> {
  try {
    return await searchCatalog(params);
  } catch (error: any) {
    console.error('[assistant] catalog search failed:', error?.message || error);
    return [];
  }
}
