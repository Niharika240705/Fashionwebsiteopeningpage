const WOMEN_CATEGORIES = new Set([
  'dresses',
  'tops',
  'bottoms',
  'ethnic-wear',
  'footwear',
  'bags',
  'accessories',
]);

const CATEGORY_ALIASES: Record<string, string> = {
  dress: 'dresses',
  dresses: 'dresses',
  gown: 'dresses',
  top: 'tops',
  tops: 'tops',
  shirt: 'tops',
  blouse: 'tops',
  tshirt: 'tops',
  't-shirt': 'tops',
  bottom: 'bottoms',
  bottoms: 'bottoms',
  jeans: 'bottoms',
  trousers: 'bottoms',
  pants: 'bottoms',
  skirt: 'bottoms',
  ethnic: 'ethnic-wear',
  'ethnic-wear': 'ethnic-wear',
  saree: 'ethnic-wear',
  kurta: 'ethnic-wear',
  lehenga: 'ethnic-wear',
  shoe: 'footwear',
  shoes: 'footwear',
  footwear: 'footwear',
  heels: 'footwear',
  sneakers: 'footwear',
  bag: 'bags',
  bags: 'bags',
  handbag: 'bags',
  accessory: 'accessories',
  accessories: 'accessories',
  jewelry: 'accessories',
  jewellery: 'accessories',
};

export function normalizeCategory(input: string): string {
  const key = input.trim().toLowerCase().replace(/\s+/g, '-');
  return CATEGORY_ALIASES[key] || CATEGORY_ALIASES[key.replace(/-/g, '')] || key;
}

export function isWomenMvpCategory(category: string): boolean {
  return WOMEN_CATEGORIES.has(normalizeCategory(category));
}

export function getWomenMvpCategories(): string[] {
  return Array.from(WOMEN_CATEGORIES);
}
