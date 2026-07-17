export type Audience = 'women' | 'men' | 'kids';

const CATEGORIES: Record<Audience, string[]> = {
  women: [
    'wedding-gowns',
    'dresses',
    'tops',
    'bottoms',
    'ethnic-wear',
    'footwear',
    'bags',
    'jewellery',
    'accessories',
    'outerwear',
    'activewear',
    'loungewear',
  ],
  men: [
    'shirts',
    'tops',
    'bottoms',
    'ethnic-wear',
    'footwear',
    'bags',
    'jewellery',
    'accessories',
    'outerwear',
    'activewear',
    'loungewear',
  ],
  kids: [
    'dresses',
    'tops',
    'bottoms',
    'sets',
    'ethnic-wear',
    'footwear',
    'bags',
    'jewellery',
    'accessories',
    'outerwear',
    'activewear',
  ],
};

export function isAudience(value: string | undefined): value is Audience {
  return value === 'women' || value === 'men' || value === 'kids';
}

export function getCategoriesForAudience(audience: Audience): string[] {
  return CATEGORIES[audience];
}

export function labelForAudience(audience: Audience): string {
  return audience.charAt(0).toUpperCase() + audience.slice(1);
}

export function labelForCategory(category: string): string {
  return category
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function defaultCategoryForAudience(audience: Audience): string {
  return CATEGORIES[audience][0];
}
