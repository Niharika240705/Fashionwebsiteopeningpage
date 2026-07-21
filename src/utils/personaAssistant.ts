/**
 * Persona AI — rule/intent layer.
 *
 * Fast, no-network classification for the common questions we know we'll get
 * (try-on, budget, wedding gowns, navigation, FAQs) plus lightweight catalog
 * search-query extraction ("black dresses" -> category=dresses, color=black).
 * Anything that doesn't match a rule falls through to the backend assistant
 * endpoint (rules + catalog search, and an LLM if one is configured).
 */
import { Audience, getCategoryOptionsForAudience } from './taxonomy';

export type IntentType =
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

export interface DetectedIntent {
  type: IntentType;
  audience?: Audience;
  category?: string;
  color?: string;
  query?: string;
}

export const PERSONA_GREETING =
  "Hi! I'm Persona AI, your personal fashion assistant.\n" +
  'I can help you find clothes, compare products, search by style, navigate the platform, and answer fashion-related questions.\n' +
  'What are you looking for today?';

export type QuickActionId =
  | 'find-dresses'
  | 'mens-collection'
  | 'kids-collection'
  | 'shop-by-budget'
  | 'try-on-help'
  | 'faq';

export const QUICK_ACTIONS: { id: QuickActionId; label: string }[] = [
  { id: 'find-dresses', label: 'Find Dresses' },
  { id: 'mens-collection', label: "Men's Collection" },
  { id: 'kids-collection', label: 'Kids Collection' },
  { id: 'shop-by-budget', label: 'Shop by Budget' },
  { id: 'try-on-help', label: 'How to Use Try-On' },
  { id: 'faq', label: 'Help & FAQs' },
];

export interface BudgetTier {
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

const AUDIENCE_KEYWORDS: Record<Audience, RegExp> = {
  women: /\b(women'?s?|woman|female|ladies|lady|girl(?!s? collection))\b/i,
  men: /\b(men'?s?|man|male|gents?|guys?)\b/i,
  kids: /\b(kids?|children|child|boys?|girls?|baby|babies|toddlers?)\b/i,
};

const COLOR_WORDS = [
  'black', 'white', 'red', 'blue', 'navy', 'green', 'olive', 'pink', 'yellow',
  'beige', 'ivory', 'cream', 'maroon', 'gold', 'golden', 'silver', 'purple',
  'violet', 'lavender', 'orange', 'brown', 'tan', 'rust', 'grey', 'gray',
  'multicolor', 'peach', 'mint', 'teal', 'burgundy', 'mustard',
];

const SEARCH_TRIGGER = /\b(show me|find|search|looking for|shop|buy|need|want|browse|get me|any)\b/i;

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
      if (!best || label.length > best.length) {
        best = { ...entry, length: label.length };
      }
    }
  }
  return best;
}

function detectColor(lower: string): string | undefined {
  return COLOR_WORDS.find((color) => new RegExp(`\\b${color}\\b`, 'i').test(lower));
}

function stripKnownWords(lower: string, words: string[]): string {
  let result = lower;
  for (const word of words) {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
  }
  return result.replace(/\s+/g, ' ').trim();
}

export function detectIntent(raw: string): DetectedIntent {
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
    const stripped = stripKnownWords(lower, [
      ...(category ? [category.label.toLowerCase()] : []),
      ...(color ? [color] : []),
      'show me', 'find', 'search for', 'search', 'looking for', 'shop', 'buy',
      'need', 'want', 'browse', 'get me', 'any', 'for', 'me', 'a', 'some',
    ]);

    return {
      type: 'search',
      audience: category?.audience || audience,
      category: category?.slug,
      color,
      query: stripped || undefined,
    };
  }

  return { type: 'unknown' };
}

export function getGreetingReply(): string {
  return PERSONA_GREETING;
}

export function getGreetingFollowUpReply(): string {
  return "Hey again! What are you looking for — dresses, menswear, kids' picks, or something specific?";
}

export function getTryOnReply(): string {
  return (
    'Virtual Try-On in three steps:\n' +
    '1. Log in, then open any eligible product page.\n' +
    "2. Tap “Try On” and allow camera access.\n" +
    '3. The garment overlays your live camera feed — use the size/position controls to preview the fit.\n' +
    "It's a styling preview, not a guaranteed fit — always check the retailer's size chart before you buy."
  );
}

export function getBudgetReply(): string {
  return (
    'We group pieces into four price tiers so you can shop by comfort level:\n' +
    BUDGET_TIERS.map((tier) => `• ${tier.label} — ${formatTierRange(tier)}`).join('\n') +
    '\nYou can also set a custom price range in the filters on the Search page. Tap a tier below to shop it now.'
  );
}

export function formatTierRange(tier: BudgetTier): string {
  if (tier.minPrice && tier.maxPrice) return `₹${tier.minPrice.toLocaleString()}–₹${tier.maxPrice.toLocaleString()}`;
  if (tier.maxPrice) return `Under ₹${tier.maxPrice.toLocaleString()}`;
  if (tier.minPrice) return `₹${tier.minPrice.toLocaleString()}+`;
  return 'Any price';
}

export function getWeddingReply(): string {
  return "We have a full Wedding Gowns collection under Women. Here are a few pieces to start, or browse the whole collection.";
}

export function getUfindReply(): string {
  return (
    'UFIND is our body-shape quiz — tap “UFIND” in the header, answer a few quick questions (or pick your shape directly), ' +
    "and we'll curate a feed suited to your silhouette."
  );
}

export function getNavigationReply(): string {
  return (
    'Tap the menu icon (top-left) to open navigation — choose Women, Men, or Kids, then pick a category, ' +
    'or tap "Designers" to browse our Indian designer directory. The category list is pulled live from our ' +
    'catalog, so it always matches what we sell.'
  );
}

export function getDesignersReply(): string {
  return (
    "We have a full directory of India's leading designer houses — Sabyasachi, Manish Malhotra, Tarun Tahiliani, " +
    'Anita Dongre, and more — each with their own curated collection. Tap "Designers" in the menu or the button below.'
  );
}

export function getFaqReply(): string {
  return (
    'A few quick answers:\n' +
    '• We link you to trusted retailers — checkout happens on their site.\n' +
    '• Try-On is a styling preview, not a guaranteed fit.\n' +
    '• UFIND gives personalized picks from a short body-shape quiz.\n' +
    '• Browse the Designers directory for India\'s top couturiers and their collections.\n' +
    '• Save items with the bookmark icon to find them later.\n' +
    'Ask me anything else — I\'m happy to help.'
  );
}

export function getSearchFoundReply(count: number): string {
  if (count === 1) return 'Found one piece I think you\'ll love:';
  return `Found ${count} pieces I think you'll love:`;
}

export function getSearchEmptyReply(): string {
  return "I couldn't find an exact match for that. Try a different keyword, or ask me about dresses, wedding gowns, or menswear.";
}

export function getFallbackReply(): string {
  return "I didn't quite catch that — could you rephrase? Or ask me about dresses, try-on, budget tiers, or wedding gowns.";
}
