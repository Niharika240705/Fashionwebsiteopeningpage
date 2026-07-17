export type Audience = 'women' | 'men' | 'kids';

const SHARED_CORE = [
  'tops',
  'bottoms',
  'footwear',
  'bags',
  'accessories',
  'jewellery',
] as const;

const WOMEN_CATEGORIES = new Set<string>([
  ...SHARED_CORE,
  'dresses',
  'wedding-gowns',
  'ethnic-wear',
  'outerwear',
  'activewear',
  'loungewear',
]);

const MEN_CATEGORIES = new Set<string>([
  ...SHARED_CORE,
  'shirts',
  'ethnic-wear',
  'outerwear',
  'activewear',
  'loungewear',
]);

const KIDS_CATEGORIES = new Set<string>([
  ...SHARED_CORE,
  'dresses',
  'sets',
  'ethnic-wear',
  'outerwear',
  'activewear',
]);

const CATEGORY_ALIASES: Record<string, string> = {
  dress: 'dresses',
  dresses: 'dresses',
  gown: 'wedding-gowns',
  gowns: 'wedding-gowns',
  'wedding-gown': 'wedding-gowns',
  'wedding-gowns': 'wedding-gowns',
  bridal: 'wedding-gowns',
  'bridal-wear': 'wedding-gowns',
  top: 'tops',
  tops: 'tops',
  shirt: 'shirts',
  shirts: 'shirts',
  blouse: 'tops',
  tshirt: 'tops',
  't-shirt': 'tops',
  bottom: 'bottoms',
  bottoms: 'bottoms',
  jeans: 'bottoms',
  trousers: 'bottoms',
  pants: 'bottoms',
  shorts: 'bottoms',
  skirt: 'bottoms',
  ethnic: 'ethnic-wear',
  'ethnic-wear': 'ethnic-wear',
  saree: 'ethnic-wear',
  kurta: 'ethnic-wear',
  lehenga: 'ethnic-wear',
  'lehenga-choli': 'ethnic-wear',
  sherwani: 'ethnic-wear',
  shoe: 'footwear',
  shoes: 'footwear',
  footwear: 'footwear',
  heels: 'footwear',
  sneakers: 'footwear',
  sandals: 'footwear',
  bag: 'bags',
  bags: 'bags',
  handbag: 'bags',
  backpack: 'bags',
  accessory: 'accessories',
  accessories: 'accessories',
  jewelry: 'jewellery',
  jewellery: 'jewellery',
  earrings: 'jewellery',
  necklace: 'jewellery',
  bracelet: 'jewellery',
  watch: 'accessories',
  watches: 'accessories',
  jacket: 'outerwear',
  coats: 'outerwear',
  outerwear: 'outerwear',
  activewear: 'activewear',
  sportswear: 'activewear',
  loungewear: 'loungewear',
  sets: 'sets',
  'coord-set': 'sets',
};

const CATEGORY_LABELS: Record<string, string> = {
  dresses: 'Dresses',
  'wedding-gowns': 'Wedding Gowns',
  tops: 'Tops',
  shirts: 'Shirts',
  bottoms: 'Bottoms',
  'ethnic-wear': 'Ethnic Wear',
  footwear: 'Footwear',
  bags: 'Bags',
  accessories: 'Accessories',
  jewellery: 'Jewellery',
  outerwear: 'Outerwear',
  activewear: 'Activewear',
  loungewear: 'Loungewear',
  sets: 'Sets',
};

export function normalizeCategory(input: string): string {
  const key = input.trim().toLowerCase().replace(/\s+/g, '-');
  return CATEGORY_ALIASES[key] || CATEGORY_ALIASES[key.replace(/-/g, '')] || key;
}

export function normalizeAudience(input?: string): Audience {
  const value = (input || 'women').toLowerCase();
  if (value === 'men' || value === 'kids' || value === 'women') return value;
  return 'women';
}

export function getCategoriesForAudience(audience: Audience): string[] {
  const set =
    audience === 'men' ? MEN_CATEGORIES : audience === 'kids' ? KIDS_CATEGORIES : WOMEN_CATEGORIES;
  return Array.from(set);
}

export function isMvpCategory(audience: Audience, category: string): boolean {
  const normalized = normalizeCategory(category);
  return getCategoriesForAudience(audience).includes(normalized);
}

/** @deprecated use isMvpCategory('women', category) */
export function isWomenMvpCategory(category: string): boolean {
  return isMvpCategory('women', category);
}

/** @deprecated use getCategoriesForAudience('women') */
export function getWomenMvpCategories(): string[] {
  return getCategoriesForAudience('women');
}

export function labelForCategory(category: string): string {
  const normalized = normalizeCategory(category);
  return (
    CATEGORY_LABELS[normalized] ||
    normalized
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

export function getAllAudiences(): Audience[] {
  return ['women', 'men', 'kids'];
}
