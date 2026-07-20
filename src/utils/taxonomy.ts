/**
 * Canonical gender/category taxonomy for the frontend.
 *
 * Mirrors `fashion-ingestion/utils/categories.py` (Python) and
 * `server/src/services/ingestion/taxonomy.service.ts` (Node) so that
 * SideMenu / category pages always reflect the same audience + category
 * structure the backend classifies products into. Update all three
 * together when the category list changes.
 */

export type Audience = 'women' | 'men' | 'kids';

export interface CategoryOption {
  slug: string;
  label: string;
}

// Exact category labels per audience, in display order.
const CATEGORY_LABELS: Record<Audience, string[]> = {
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

export function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const SLUG_TO_LABEL: Record<Audience, Record<string, string>> = {
  women: {},
  men: {},
  kids: {},
};
for (const audience of Object.keys(CATEGORY_LABELS) as Audience[]) {
  for (const label of CATEGORY_LABELS[audience]) {
    SLUG_TO_LABEL[audience][slugify(label)] = label;
  }
}

export function isAudience(value: string | undefined): value is Audience {
  return value === 'women' || value === 'men' || value === 'kids';
}

/** Category slugs for an audience, in registry order (used for nav/menus). */
export function getCategoriesForAudience(audience: Audience): string[] {
  return CATEGORY_LABELS[audience].map(slugify);
}

/** Category {slug, label} pairs for an audience, in registry order. */
export function getCategoryOptionsForAudience(audience: Audience): CategoryOption[] {
  return CATEGORY_LABELS[audience].map((label) => ({ slug: slugify(label), label }));
}

export function labelForAudience(audience: Audience): string {
  return audience.charAt(0).toUpperCase() + audience.slice(1);
}

export function labelForCategory(category: string, audience?: Audience): string {
  const key = slugify(category);
  if (audience && SLUG_TO_LABEL[audience][key]) {
    return SLUG_TO_LABEL[audience][key];
  }
  for (const map of Object.values(SLUG_TO_LABEL)) {
    if (map[key]) return map[key];
  }
  return key
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function isCategoryForAudience(audience: Audience, category: string): boolean {
  return getCategoriesForAudience(audience).includes(slugify(category));
}

export function defaultCategoryForAudience(audience: Audience): string {
  return getCategoriesForAudience(audience)[0];
}
