/**
 * Canonical gender/category taxonomy for the website (Node/Mongo side).
 *
 * This MUST stay in sync with the Python ingestion registry
 * (`fashion-ingestion/utils/categories.py`) and with the frontend mirror
 * (`src/utils/taxonomy.ts`) so that `audience` (gender) + category slug
 * match consistently across the whole stack. Slugs are generated with the
 * same rule as the Python `slugify()` helper: lowercase, non-alphanumeric
 * runs collapsed to a single hyphen.
 */

export type Audience = 'women' | 'men' | 'kids';

// Exact category labels per audience, in display order. Keep identical to
// `fashion-ingestion/utils/categories.py::CATEGORIES`.
const CATEGORY_LABELS_BY_AUDIENCE: Record<Audience, string[]> = {
  women: [
    'Dresses',
    'Wedding Gowns',
    'Party Wear',
    'Tops',
    'T-Shirts',
    'Shirts',
    'Kurtas',
    'Sarees',
    'Co-ords',
    'Jeans',
    'Trousers',
    'Skirts',
    'Shorts',
    'Jackets',
    'Hoodies',
    'Sweaters',
    'Activewear',
    'Nightwear',
    'Lingerie',
    'Footwear',
    'Accessories',
  ],
  men: [
    'T-Shirts',
    'Shirts',
    'Jeans',
    'Trousers',
    'Shorts',
    'Jackets',
    'Hoodies',
    'Sweatshirts',
    'Blazers',
    'Suits',
    'Ethnic Wear',
    'Activewear',
    'Footwear',
    'Accessories',
  ],
  kids: [
    'Boys',
    'Girls',
    'Infant',
    'Dresses',
    'Tops',
    'T-Shirts',
    'Shirts',
    'Jeans',
    'Shorts',
    'Party Wear',
    'School Wear',
    'Footwear',
    'Accessories',
  ],
};

const FALLBACK_CATEGORY_LABEL = 'Accessories';

export function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// slug -> label lookup, built once from the registry above.
const SLUG_TO_LABEL: Record<string, string> = {};
for (const labels of Object.values(CATEGORY_LABELS_BY_AUDIENCE)) {
  for (const label of labels) {
    SLUG_TO_LABEL[slugify(label)] = label;
  }
}

const AUDIENCE_ALIASES: Record<string, Audience> = {
  women: 'women',
  woman: 'women',
  womens: 'women',
  "women's": 'women',
  female: 'women',
  females: 'women',
  ladies: 'women',
  lady: 'women',
  men: 'men',
  man: 'men',
  mens: 'men',
  "men's": 'men',
  male: 'men',
  males: 'men',
  gents: 'men',
  gentlemen: 'men',
  kids: 'kids',
  kid: 'kids',
  child: 'kids',
  children: 'kids',
  childrens: 'kids',
  baby: 'kids',
  babies: 'kids',
  toddler: 'kids',
  infant: 'kids',
  boys: 'kids',
  girls: 'kids',
  boy: 'kids',
  girl: 'kids',
};

// Free-text/legacy aliases -> canonical category SLUG. Kept broad so that
// existing scraped/demo category strings (old generic buckets like
// "bottoms", "bags", "jewellery", "sets", "outerwear") continue to resolve
// to a valid slug in the new taxonomy instead of becoming orphaned.
const CATEGORY_ALIASES: Record<string, string> = {
  dress: 'dresses',
  dresses: 'dresses',
  gown: 'wedding-gowns',
  gowns: 'wedding-gowns',
  'wedding-gown': 'wedding-gowns',
  'wedding-gowns': 'wedding-gowns',
  bridal: 'wedding-gowns',
  'bridal-wear': 'wedding-gowns',
  'bridal-gown': 'wedding-gowns',
  'party-wear': 'party-wear',
  party: 'party-wear',
  cocktail: 'party-wear',
  'cocktail-dress': 'party-wear',
  'evening-wear': 'party-wear',
  top: 'tops',
  tops: 'tops',
  blouse: 'tops',
  camisole: 'tops',
  tshirt: 't-shirts',
  tshirts: 't-shirts',
  't-shirt': 't-shirts',
  't-shirts': 't-shirts',
  tee: 't-shirts',
  shirt: 'shirts',
  shirts: 'shirts',
  kurta: 'kurtas',
  kurtas: 'kurtas',
  kurti: 'kurtas',
  saree: 'sarees',
  sarees: 'sarees',
  sari: 'sarees',
  coord: 'co-ords',
  'co-ord': 'co-ords',
  'co-ords': 'co-ords',
  coords: 'co-ords',
  'matching-set': 'co-ords',
  set: 'co-ords',
  sets: 'co-ords',
  jean: 'jeans',
  jeans: 'jeans',
  denim: 'jeans',
  bottom: 'trousers',
  bottoms: 'trousers',
  trouser: 'trousers',
  trousers: 'trousers',
  pant: 'trousers',
  pants: 'trousers',
  chino: 'trousers',
  chinos: 'trousers',
  slacks: 'trousers',
  skirt: 'skirts',
  skirts: 'skirts',
  short: 'shorts',
  shorts: 'shorts',
  bermuda: 'shorts',
  jacket: 'jackets',
  jackets: 'jackets',
  coat: 'jackets',
  coats: 'jackets',
  outerwear: 'jackets',
  bomber: 'jackets',
  parka: 'jackets',
  windbreaker: 'jackets',
  hoodie: 'hoodies',
  hoodies: 'hoodies',
  sweater: 'sweaters',
  sweaters: 'sweaters',
  pullover: 'sweaters',
  jumper: 'sweaters',
  cardigan: 'sweaters',
  sweatshirt: 'sweatshirts',
  sweatshirts: 'sweatshirts',
  blazer: 'blazers',
  blazers: 'blazers',
  suit: 'suits',
  suits: 'suits',
  tuxedo: 'suits',
  ethnic: 'ethnic-wear',
  'ethnic-wear': 'ethnic-wear',
  sherwani: 'ethnic-wear',
  dhoti: 'ethnic-wear',
  activewear: 'activewear',
  sportswear: 'activewear',
  'gym-wear': 'activewear',
  leggings: 'activewear',
  athleisure: 'activewear',
  loungewear: 'nightwear',
  nightwear: 'nightwear',
  pajama: 'nightwear',
  pyjama: 'nightwear',
  sleepwear: 'nightwear',
  nightgown: 'nightwear',
  lingerie: 'lingerie',
  bra: 'lingerie',
  underwear: 'lingerie',
  intimates: 'lingerie',
  shapewear: 'lingerie',
  shoe: 'footwear',
  shoes: 'footwear',
  footwear: 'footwear',
  heels: 'footwear',
  heel: 'footwear',
  sneaker: 'footwear',
  sneakers: 'footwear',
  sandal: 'footwear',
  sandals: 'footwear',
  boot: 'footwear',
  boots: 'footwear',
  flats: 'footwear',
  loafer: 'footwear',
  accessory: 'accessories',
  accessories: 'accessories',
  bag: 'accessories',
  bags: 'accessories',
  handbag: 'accessories',
  handbags: 'accessories',
  backpack: 'accessories',
  jewelry: 'accessories',
  jewellery: 'accessories',
  earrings: 'accessories',
  earring: 'accessories',
  necklace: 'accessories',
  bracelet: 'accessories',
  watch: 'accessories',
  watches: 'accessories',
  belt: 'accessories',
  scarf: 'accessories',
  sunglasses: 'accessories',
  boy: 'boys',
  boys: 'boys',
  girl: 'girls',
  girls: 'girls',
  infant: 'infant',
  infants: 'infant',
  newborn: 'infant',
  toddler: 'infant',
  baby: 'infant',
  'school-wear': 'school-wear',
  'school-uniform': 'school-wear',
  uniform: 'school-wear',
};

/** Normalize any free-text category string into a canonical slug. */
export function normalizeCategory(input: string): string {
  const key = slugify(input || '');
  if (SLUG_TO_LABEL[key]) return key;
  return CATEGORY_ALIASES[key] || CATEGORY_ALIASES[key.replace(/-/g, '')] || key;
}

export function normalizeAudience(input?: string): Audience {
  const value = (input || 'women').trim().toLowerCase();
  if (value === 'men' || value === 'kids' || value === 'women') return value;
  return AUDIENCE_ALIASES[value] || 'women';
}

export function getCategoriesForAudience(audience: Audience): string[] {
  return CATEGORY_LABELS_BY_AUDIENCE[audience].map(slugify);
}

export function getCategoryOptionsForAudience(
  audience: Audience
): Array<{ slug: string; label: string }> {
  return CATEGORY_LABELS_BY_AUDIENCE[audience].map((label) => ({ slug: slugify(label), label }));
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
    SLUG_TO_LABEL[normalized] ||
    normalized
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

/** Fallback category slug used when nothing else applies (valid for every audience). */
export function fallbackCategorySlug(): string {
  return slugify(FALLBACK_CATEGORY_LABEL);
}

export function getAllAudiences(): Audience[] {
  return ['women', 'men', 'kids'];
}

/** Map a Python-side `gender` value (already women/men/kids) straight to audience. */
export function genderToAudience(gender?: string | null): Audience {
  return normalizeAudience(gender || undefined);
}
