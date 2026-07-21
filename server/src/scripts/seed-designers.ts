import 'dotenv/config';
import { connectMongoDB, disconnectMongoDB } from '../config/database';
import { Designer } from '../models/Designer.model';
import { Product } from '../models/Product.model';

/**
 * Seeds the Indian Designer Fashion Directory: `Designer` records for the
 * full heritage-&-couture roster, plus demo `Product` catalog entries per
 * designer (linked via `designerId`) so collection pages aren't empty.
 *
 * Safe to re-run: clears previously-seeded designer records/products first
 * (matched by `retailerId: 'designer'`), then reseeds from scratch.
 *
 * Usage: npm run seed:designers  (from server/)
 */

const RETAILER_ID = 'designer';

// A small, verified-reachable pool of Unsplash editorial/fashion photos
// (mix of images already used elsewhere in this codebase plus additional
// verified IDs) reused across designer covers and demo products so every
// image request resolves with a real photo rather than a broken link.
const IMAGE_POOL = [
  '1719518411339-5158cea86caf',
  '1649217708362-4368faa2559b',
  '1575201046471-082b5c1a1e79',
  '1731512702625-03fa99b30be4',
  '1762430815620-fcca603c240c',
  '1567357244786-35edb9b5e9a9',
  '1670431492581-a46ed324f2a5',
  '1704775986777-b903cf6b9802',
  '1761574028262-6d834741bfd8',
  '1599681906238-c4f97c8b4454',
  '1761574028714-7c2882992a9f',
  '1756483510900-ec43edbafb45',
  '1612694831362-d0f69f3bcf2d',
  '1639244151653-7807947de5a5',
  '1483985988355-763728e1935b',
  '1591047139829-d91aecb6caea',
  '1515886657613-9f3515b0c78f',
  '1539533018447-63fcce2678e3',
  '1558769132-cb1aea1f0efe',
  '1532453288672-3a27e9be9efd',
  '1523359346063-d879354c0ea5',
  '1556906781-9a412961c28c',
  '1620656798579-1984d9e87df7',
  '1610030469983-98e550d6193c',
  '1596460107916-430662021049',
  '1601925260368-ae2f83cf8b7f',
  '1595777457583-95e059d581b8',
  '1607346256330-dee7af15f7c5',
  '1617019114583-affb34d1b3cd',
  '1606800052052-a08af7148866',
  '1571513722275-4b41940f54b8',
];

function unsplash(index: number, w: number, h: number): string {
  const id = IMAGE_POOL[index % IMAGE_POOL.length];
  return `https://images.unsplash.com/photo-${id}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=${w}&h=${h}`;
}

type Audience = 'women' | 'men';

interface ProductArchetype {
  name: string;
  category: string;
  subcategory: string;
  occasion: string;
  colors: string[];
  tier: 'budget' | 'mid' | 'premium' | 'luxury';
  audience: Audience;
}

// Tier -> INR price range, matched to src/utils/budget.ts BUDGET_TIERS.
const TIER_RANGES: Record<ProductArchetype['tier'], [number, number]> = {
  budget: [900, 1500],
  mid: [1800, 4000],
  premium: [4500, 9800],
  luxury: [15000, 285000],
};

const WOMEN_ARCHETYPES: ProductArchetype[] = [
  { name: 'Hand-Embroidered Bridal Lehenga', category: 'lehengas', subcategory: 'Lehengas', occasion: 'Bridal', colors: ['Red', 'Maroon'], tier: 'luxury', audience: 'women' },
  { name: 'Zardozi Wedding Lehenga Set', category: 'lehengas', subcategory: 'Lehengas', occasion: 'Wedding', colors: ['Ivory', 'Blush Pink'], tier: 'luxury', audience: 'women' },
  { name: 'Heritage Handloom Silk Saree', category: 'sarees', subcategory: 'Sarees', occasion: 'Festive', colors: ['Emerald', 'Wine'], tier: 'premium', audience: 'women' },
  { name: 'Hand-Painted Tussar Silk Saree', category: 'sarees', subcategory: 'Sarees', occasion: 'Festive', colors: ['Mustard', 'Ivory'], tier: 'premium', audience: 'women' },
  { name: 'Embellished Anarkali Gown', category: 'wedding-gowns', subcategory: 'Gowns', occasion: 'Wedding', colors: ['Champagne', 'Silver'], tier: 'luxury', audience: 'women' },
  { name: 'Draped Cocktail Gown', category: 'party-wear', subcategory: 'Gowns', occasion: 'Party Wear', colors: ['Black', 'Midnight Blue'], tier: 'premium', audience: 'women' },
  { name: 'Chikankari Kurta Set', category: 'kurtas', subcategory: 'Kurta Sets', occasion: 'Contemporary', colors: ['White', 'Powder Blue'], tier: 'mid', audience: 'women' },
  { name: 'Printed Silk Co-ord Set', category: 'co-ords', subcategory: 'Co-ords', occasion: 'Contemporary', colors: ['Coral', 'Sage Green'], tier: 'mid', audience: 'women' },
  { name: 'Structured Bandhani Jacket', category: 'jackets', subcategory: 'Jackets', occasion: 'Ethnic', colors: ['Indigo', 'Rust'], tier: 'mid', audience: 'women' },
  { name: 'Kundan Statement Necklace Set', category: 'accessories', subcategory: 'Jewelry', occasion: 'Bridal', colors: ['Gold'], tier: 'premium', audience: 'women' },
  { name: 'Hand-Embroidered Potli Clutch', category: 'accessories', subcategory: 'Bags', occasion: 'Festive', colors: ['Gold', 'Maroon'], tier: 'budget', audience: 'women' },
  { name: 'Hand-Dyed Mulberry Silk Dupatta', category: 'accessories', subcategory: 'Dupattas', occasion: 'Festive', colors: ['Fuchsia', 'Teal'], tier: 'budget', audience: 'women' },
  { name: 'Draped Saree Gown', category: 'wedding-gowns', subcategory: 'Gowns', occasion: 'Wedding', colors: ['Rose Gold'], tier: 'luxury', audience: 'women' },
  { name: 'Floral Threadwork Lehenga', category: 'lehengas', subcategory: 'Lehengas', occasion: 'Festive', colors: ['Pastel Pink'], tier: 'premium', audience: 'women' },
  { name: 'Tissue Silk Bridal Dupatta', category: 'accessories', subcategory: 'Dupattas', occasion: 'Bridal', colors: ['Gold', 'Ivory'], tier: 'mid', audience: 'women' },
];

const MEN_ARCHETYPES: ProductArchetype[] = [
  { name: 'Hand-Embroidered Silk Sherwani', category: 'sherwanis', subcategory: 'Sherwanis', occasion: 'Wedding', colors: ['Ivory', 'Maroon'], tier: 'luxury', audience: 'men' },
  { name: 'Classic Jodhpuri Bandhgala', category: 'bandhgalas', subcategory: 'Bandhgalas', occasion: 'Bridal', colors: ['Navy', 'Charcoal'], tier: 'premium', audience: 'men' },
  { name: 'Bespoke Tailored Suit', category: 'suits', subcategory: 'Suits', occasion: 'Contemporary', colors: ['Black', 'Grey'], tier: 'premium', audience: 'men' },
  { name: 'Nehru Jacket with Kurta Set', category: 'jackets', subcategory: 'Jackets', occasion: 'Festive', colors: ['Beige', 'Olive'], tier: 'mid', audience: 'men' },
  { name: 'Indo-Western Bundi Jacket Set', category: 'indo-western', subcategory: 'Indo-Western', occasion: 'Party Wear', colors: ['Black', 'Gold'], tier: 'mid', audience: 'men' },
  { name: 'Textured Silk Kurta', category: 'kurtas', subcategory: 'Kurtas', occasion: 'Ethnic', colors: ['White', 'Sand'], tier: 'budget', audience: 'men' },
  { name: 'Hand-Woven Dupion Kurta Set', category: 'kurtas', subcategory: 'Kurta Sets', occasion: 'Festive', colors: ['Rust', 'Indigo'], tier: 'mid', audience: 'men' },
  { name: 'Embroidered Wedding Bandhgala', category: 'bandhgalas', subcategory: 'Bandhgalas', occasion: 'Wedding', colors: ['Gold', 'Ivory'], tier: 'luxury', audience: 'men' },
  { name: 'Signature Pocket Square & Belt Set', category: 'accessories', subcategory: 'Belts', occasion: 'Contemporary', colors: ['Brown', 'Black'], tier: 'budget', audience: 'men' },
];

interface DesignerSeed {
  name: string;
  slug: string;
  shortDescription: string;
  specializations: string[];
  websiteUrl: string;
  /** Path appended to websiteUrl for demo product "View Original" links. */
  shopPath: string;
  featured?: boolean;
  city: string;
  foundedYear?: number;
  tagline: string;
}

const DESIGNERS: DesignerSeed[] = [
  {
    name: 'Sabyasachi',
    slug: 'sabyasachi',
    shortDescription:
      'India\u2019s most iconic couturier, celebrated for opulent bridal lehengas, heirloom Bengal textiles, and a maximalist aesthetic that has defined a generation of Indian weddings.',
    specializations: ['Bridal', 'Couture', 'Heritage Textiles', 'Luxury'],
    websiteUrl: 'https://www.sabyasachi.com',
    shopPath: '/collections',
    featured: true,
    city: 'Kolkata',
    foundedYear: 1999,
    tagline: 'The House of Sabyasachi',
  },
  {
    name: 'Manish Malhotra',
    slug: 'manish-malhotra',
    shortDescription:
      'Bollywood\u2019s favourite designer, known for glamorous bridal couture, intricate embroidery, and red-carpet gowns that fuse Indian craft with global glamour.',
    specializations: ['Bridal', 'Couture', 'Bollywood Glam', 'Luxury'],
    websiteUrl: 'https://manishmalhotra.in',
    shopPath: '/collections',
    featured: true,
    city: 'Mumbai',
    foundedYear: 2005,
    tagline: 'Manish Malhotra Couture',
  },
  {
    name: 'Tarun Tahiliani',
    slug: 'tarun-tahiliani',
    shortDescription:
      'A pioneer of Indian couture famed for architectural draping, hand-finished embroidery, and reimagining traditional silhouettes for the modern bride.',
    specializations: ['Couture', 'Bridal', 'Draping', 'Luxury'],
    websiteUrl: 'https://www.taruntahiliani.com',
    shopPath: '/collections',
    featured: true,
    city: 'New Delhi',
    foundedYear: 1990,
    tagline: 'Tarun Tahiliani Couture',
  },
  {
    name: 'Anita Dongre',
    slug: 'anita-dongre',
    shortDescription:
      'A champion of sustainable, artisan-led fashion whose bridal and prêt lines blend Rajasthani craftsmanship with contemporary silhouettes.',
    specializations: ['Contemporary', 'Bridal', 'Sustainable Fashion', 'Prêt'],
    websiteUrl: 'https://www.anitadongre.com',
    shopPath: '/collections',
    featured: true,
    city: 'Mumbai',
    foundedYear: 1995,
    tagline: 'Anita Dongre',
  },
  {
    name: 'Ritu Kumar',
    slug: 'ritu-kumar',
    shortDescription:
      'The revivalist matriarch of Indian fashion, credited with reintroducing centuries-old textile traditions through elegant, wearable couture.',
    specializations: ['Heritage', 'Revivalist Textiles', 'Bridal', 'Contemporary'],
    websiteUrl: 'https://www.ritukumar.com',
    shopPath: '/collections',
    city: 'New Delhi',
    foundedYear: 1966,
    tagline: 'Ritu Kumar',
  },
  {
    name: 'Abu Jani Sandeep Khosla',
    slug: 'abu-jani-sandeep-khosla',
    shortDescription:
      'The design duo behind some of India\u2019s most theatrical couture shows, renowned for lavish hand-embroidery and regal, larger-than-life silhouettes.',
    specializations: ['Couture', 'Bridal', 'Embroidery', 'Luxury'],
    websiteUrl: 'https://www.abujanisandeepkhosla.com',
    shopPath: '/collections',
    city: 'Mumbai',
    foundedYear: 1986,
    tagline: 'Abu Jani Sandeep Khosla',
  },
  {
    name: 'Rohit Bal',
    slug: 'rohit-bal',
    shortDescription:
      'A legend of Indian fashion whose romantic, floral-infused couture and mastery of texture made him one of the country\u2019s most influential designers.',
    specializations: ['Couture', 'Menswear', 'Romantic Silhouettes', 'Heritage'],
    websiteUrl: 'https://www.rohitbal.com',
    shopPath: '/collections',
    city: 'New Delhi',
    foundedYear: 1990,
    tagline: 'Rohit Bal',
  },
  {
    name: 'JJ Valaya',
    slug: 'jj-valaya',
    shortDescription:
      'Known for regal, palace-inspired couture drawing on Mughal and Rajput heritage, delivered with a distinctly maximalist bridal sensibility.',
    specializations: ['Royal Heritage', 'Bridal', 'Couture', 'Menswear'],
    websiteUrl: 'https://www.jjvalaya.com',
    shopPath: '/collections',
    city: 'New Delhi',
    foundedYear: 1994,
    tagline: 'House of Valaya',
  },
  {
    name: 'Raghavendra Rathore',
    slug: 'raghavendra-rathore',
    shortDescription:
      'The custodian of the modern Jodhpuri bandhgala, crafting bespoke heritage menswear rooted in royal Rajasthani tailoring traditions.',
    specializations: ['Menswear', 'Bandhgalas', 'Bespoke', 'Heritage'],
    websiteUrl: 'https://www.rathore.com',
    shopPath: '/collections',
    city: 'Jodhpur',
    foundedYear: 1994,
    tagline: 'Raghavendra Rathore Jodhpur',
  },
  {
    name: 'Rina Dhaka',
    slug: 'rina-dhaka',
    shortDescription:
      'Known for body-conscious silhouettes and an Indo-Western sensibility that brings a youthful, contemporary edge to festive and bridal wear.',
    specializations: ['Contemporary', 'Bridal', 'Indo-Western'],
    websiteUrl: 'https://www.rinadhaka.in',
    shopPath: '/collections',
    city: 'New Delhi',
    foundedYear: 1993,
    tagline: 'Rina Dhaka',
  },
  {
    name: 'Neeta Lulla',
    slug: 'neeta-lulla',
    shortDescription:
      'An award-winning costume designer and couturier whose bridal creations have shaped Bollywood\u2019s biggest on-screen wedding moments.',
    specializations: ['Bridal', 'Bollywood Costume', 'Couture'],
    websiteUrl: 'https://www.neetalulla.com',
    shopPath: '/collections',
    city: 'Mumbai',
    foundedYear: 1985,
    tagline: 'Neeta Lulla',
  },
  {
    name: 'Shantnu & Nikhil',
    slug: 'shantnu-and-nikhil',
    shortDescription:
      'A designer duo celebrated for military-inspired detailing and modern bridal menswear that reimagines the sherwani and bandhgala for a new generation.',
    specializations: ['Menswear', 'Bridal', 'Indo-Western', 'Luxury'],
    websiteUrl: 'https://www.shantnunikhil.com',
    shopPath: '',
    city: 'New Delhi',
    foundedYear: 1994,
    tagline: 'Shantnu & Nikhil',
  },
  {
    name: 'Ashima Leena',
    slug: 'ashima-leena',
    shortDescription:
      'One of India\u2019s longest-running bridal couture houses, prized for intricate hand embroidery and a signature blend of heritage and glamour.',
    specializations: ['Bridal', 'Couture', 'Handcraft Embroidery'],
    websiteUrl: 'https://al-design.in',
    shopPath: '',
    city: 'New Delhi',
    foundedYear: 1987,
    tagline: 'Ashima Leena',
  },
  {
    name: 'Ashish N Soni',
    slug: 'ashish-n-soni',
    shortDescription:
      'A minimalist among Indian couturiers, known for sculptural tailoring, restrained palettes, and quietly confident contemporary silhouettes.',
    specializations: ['Contemporary', 'Minimalism', 'Prêt'],
    websiteUrl: 'https://www.ashishnsoni.com',
    shopPath: '',
    city: 'New Delhi',
    foundedYear: 1991,
    tagline: 'Ashish N Soni',
  },
  {
    name: 'Rohit Gandhi + Rahul Khanna',
    slug: 'rohit-gandhi-rahul-khanna',
    shortDescription:
      'A contemporary label known for architectural silhouettes and signature metallic embroidery, dressing both red carpets and modern weddings.',
    specializations: ['Contemporary', 'Metallic Embroidery', 'Prêt'],
    websiteUrl: 'https://www.rohitandrahul.com',
    shopPath: '/collections',
    city: 'New Delhi',
    foundedYear: 1997,
    tagline: 'Rohit Gandhi + Rahul Khanna',
  },
  {
    name: 'Rajesh Pratap Singh',
    slug: 'rajesh-pratap-singh',
    shortDescription:
      'A textile-obsessed designer whose precise tailoring and experimental weaves have made him a favourite among fashion purists.',
    specializations: ['Menswear', 'Tailoring', 'Textile Innovation', 'Contemporary'],
    websiteUrl: 'https://www.rajeshpratapsingh.com',
    shopPath: '/collections',
    city: 'New Delhi',
    foundedYear: 1994,
    tagline: 'Rajesh Pratap Singh',
  },
  {
    name: 'Gauri & Nainika',
    slug: 'gauri-and-nainika',
    shortDescription:
      'A mother-daughter design duo known for feminine, pastel-hued bridal and occasion wear with intricate hand embellishment.',
    specializations: ['Bridal', 'Contemporary', 'Prêt Couture'],
    websiteUrl: 'https://www.gauriandnainika.com',
    shopPath: '/collections',
    city: 'Mumbai',
    foundedYear: 2004,
    tagline: 'Gauri & Nainika',
  },
  {
    name: 'Varun Bahl',
    slug: 'varun-bahl',
    shortDescription:
      'Renowned for romantic floral embroidery and soft, ethereal bridal couture that has become a signature at Indian fashion weeks.',
    specializations: ['Bridal', 'Couture', 'Floral Embroidery'],
    websiteUrl: 'https://www.varunbahl.com',
    shopPath: '/collections',
    city: 'New Delhi',
    foundedYear: 1994,
    tagline: 'Varun Bahl',
  },
  {
    name: 'Vikram Phadnis',
    slug: 'vikram-phadnis',
    shortDescription:
      'A celebrated couturier and film costume designer known for opulent bridal lehengas and glamorous Bollywood-inspired occasion wear.',
    specializations: ['Bridal', 'Bollywood Costume', 'Couture'],
    websiteUrl: 'https://www.vikramphadnis.com',
    shopPath: '/collections',
    city: 'Mumbai',
    foundedYear: 1990,
    tagline: 'Vikram Phadnis',
  },
  {
    name: 'Niki Mahajan',
    slug: 'niki-mahajan',
    shortDescription:
      'Known for regal, richly embroidered bridal couture that draws on Mughal-era motifs and opulent zardozi work.',
    specializations: ['Bridal', 'Couture', 'Regal Embroidery'],
    websiteUrl: 'https://www.nikimahajan.com',
    shopPath: '/collections',
    city: 'New Delhi',
    tagline: 'Niki Mahajan',
  },
  {
    name: 'Dev R Nil',
    slug: 'dev-r-nil',
    shortDescription:
      'A Kolkata-born label celebrated for bold statement prints and impeccably tailored prêt that carries an unmistakably Indian flavour.',
    specializations: ['Prêt', 'Menswear', 'Womenswear', 'Contemporary'],
    websiteUrl: 'https://www.devnil.com',
    shopPath: '',
    city: 'Kolkata',
    foundedYear: 2001,
    tagline: 'dev r nil',
  },
  {
    name: 'James Ferreira',
    slug: 'james-ferreira',
    shortDescription:
      'A veteran of Indian fashion whose Western-silhouette bridal couture and made-to-order gowns have earned decades of loyal patronage.',
    specializations: ['Bridal Couture', 'Western Silhouettes', 'Prêt'],
    websiteUrl: 'https://jamesferreira.co.in',
    shopPath: '/shop',
    city: 'Mumbai',
    foundedYear: 1976,
    tagline: 'James Ferreira',
  },
  {
    name: 'Nachiket Barve',
    slug: 'nachiket-barve',
    shortDescription:
      'An award-winning designer recognised internationally for sustainable craftsmanship and contemporary bridal wear rooted in Indian textiles.',
    specializations: ['Contemporary', 'Bridal', 'Sustainable Craft'],
    websiteUrl: 'https://www.nachiketbarve.in',
    shopPath: '/collections',
    city: 'Mumbai',
    foundedYear: 2007,
    tagline: 'Nachiket Barve',
  },
  {
    name: 'Narendra Kumar',
    slug: 'narendra-kumar',
    shortDescription:
      'A menswear specialist known for sharp, minimal tailoring that bridges classic Indian silhouettes with modern global style.',
    specializations: ['Menswear', 'Contemporary', 'Tailoring'],
    websiteUrl: 'https://www.narendrakumar.in',
    shopPath: '/collections',
    city: 'New Delhi',
    tagline: 'Narendra Kumar',
  },
  {
    name: 'Troy Costa',
    slug: 'troy-costa',
    shortDescription:
      'A bespoke menswear specialist celebrated for sharply tailored sherwanis and suits favoured by grooms and Bollywood alike.',
    specializations: ['Menswear', 'Sherwanis', 'Bespoke Tailoring'],
    websiteUrl: 'https://troycosta.in',
    shopPath: '',
    city: 'Mumbai',
    tagline: 'Troy Costa',
  },
  {
    name: 'Ranna Gill',
    slug: 'ranna-gill',
    shortDescription:
      'Known for playful prints and relaxed, resort-friendly silhouettes that bring a breezy, contemporary energy to Indian prêt.',
    specializations: ['Prêt', 'Contemporary', 'Resortwear'],
    websiteUrl: 'https://www.rannagill.com',
    shopPath: '/collections',
    city: 'New Delhi',
    tagline: 'Ranna Gill',
  },
  {
    name: 'Payal Jain',
    slug: 'payal-jain',
    shortDescription:
      'A textile revivalist whose work champions handloom weaves and artisanal techniques through refined, wearable silhouettes.',
    specializations: ['Textile Revivalist', 'Contemporary', 'Prêt'],
    websiteUrl: 'https://www.payaljain.co.in',
    shopPath: '',
    city: 'New Delhi',
    foundedYear: 1993,
    tagline: 'Payal Jain',
  },
  {
    name: 'Suneet Varma',
    slug: 'suneet-varma',
    shortDescription:
      'A veteran couturier known for glamorous, embellished bridal and eveningwear that balances drama with old-world craftsmanship.',
    specializations: ['Bridal', 'Couture', 'Luxury'],
    websiteUrl: 'https://www.suneetvarma.com',
    shopPath: '/collections',
    city: 'New Delhi',
    foundedYear: 1990,
    tagline: 'Suneet Varma',
  },
  {
    name: 'Hemant Trivedi',
    slug: 'hemant-trivedi',
    shortDescription:
      'One of India\u2019s original couturiers, celebrated for elegant, heritage-inspired bridal wear with a refined, understated glamour.',
    specializations: ['Bridal', 'Couture', 'Heritage'],
    websiteUrl: 'https://www.hemanttrivedi.com',
    shopPath: '/collections',
    city: 'Mumbai',
    tagline: 'Hemant Trivedi',
  },
  {
    name: 'Monisha Jaising',
    slug: 'monisha-jaising',
    shortDescription:
      'A red-carpet favourite known for figure-flattering, richly embellished bridal and eveningwear worn by celebrities across the globe.',
    specializations: ['Bridal', 'Red Carpet', 'Couture'],
    websiteUrl: 'https://www.monishajaising.com',
    shopPath: '/collections',
    city: 'Mumbai',
    foundedYear: 1994,
    tagline: 'Monisha Jaising',
  },
  {
    name: 'Anju Modi',
    slug: 'anju-modi',
    shortDescription:
      'Renowned for cinematic, period-inspired costume design and richly textured bridal couture drawing on royal Indian heritage.',
    specializations: ['Bridal', 'Period Costume', 'Heritage Textiles'],
    websiteUrl: 'https://www.anjumodi.com',
    shopPath: '/collections',
    city: 'New Delhi',
    tagline: 'Anju Modi',
  },
];

function pickPrice(tier: ProductArchetype['tier']): number {
  const [min, max] = TIER_RANGES[tier];
  const raw = min + Math.random() * (max - min);
  return Math.round(raw / 100) * 100;
}

function menswearBias(designer: DesignerSeed): boolean {
  return designer.specializations.some((s) =>
    /menswear|bandhgala|sherwani|bespoke tailoring|tailoring/i.test(s)
  );
}

async function seedDesigner(designer: DesignerSeed, index: number, productCount: number) {
  const doc = await Designer.findOneAndUpdate(
    { slug: designer.slug },
    {
      name: designer.name,
      slug: designer.slug,
      coverImageUrl: unsplash(index, 1400, 900),
      shortDescription: designer.shortDescription,
      specializations: designer.specializations,
      websiteUrl: designer.websiteUrl,
      featured: Boolean(designer.featured),
      active: true,
      sortOrder: index,
      metadata: {
        foundedYear: designer.foundedYear,
        city: designer.city,
        tagline: designer.tagline,
      },
    },
    { upsert: true, new: true }
  );

  // Clear any previously-seeded products for this designer so the script is
  // idempotent (categories/prices/images can change between seed versions).
  await Product.deleteMany({ designerId: doc._id });

  const menswearLed = menswearBias(designer);
  const archetypes = menswearLed
    ? [...MEN_ARCHETYPES, ...WOMEN_ARCHETYPES.filter((a) => a.category === 'accessories')]
    : [...WOMEN_ARCHETYPES, ...MEN_ARCHETYPES.filter((a) => a.category === 'accessories')];

  const shopUrl = `${designer.websiteUrl}${designer.shopPath}`;

  const products = Array.from({ length: productCount }).map((_, i) => {
    // Spread picks across the full archetype list (rather than a
    // consecutive slice) so a small product count still reflects a mix of
    // the designer's specialties instead of clustering on whichever
    // archetypes happen to sit at index+0, index+1, index+2.
    const archetype = archetypes[(index * 5 + i * 3) % archetypes.length];
    const color = archetype.colors[i % archetype.colors.length];
    const imgIndex = index * 7 + i;

    return {
      name: `${designer.name} ${archetype.name}`,
      brand: designer.name,
      designerId: doc._id,
      category: archetype.category,
      subcategory: archetype.subcategory,
      audience: archetype.audience,
      price: pickPrice(archetype.tier),
      currency: 'INR',
      images: {
        original: [unsplash(imgIndex, 900, 1200), unsplash(imgIndex + 1, 900, 1200)],
        processed: [],
        approved: [unsplash(imgIndex, 900, 1200), unsplash(imgIndex + 1, 900, 1200)],
      },
      productUrl: `${shopUrl}?ref=persona-designers&item=${designer.slug}-${i + 1}`,
      sourceWebsite: designer.name,
      retailerId: RETAILER_ID,
      externalProductIds: [],
      availability: (Math.random() < 0.12 ? 'out_of_stock' : 'in_stock') as
        | 'in_stock'
        | 'out_of_stock',
      trendScore: Math.round((designer.featured ? 60 : 20) + Math.random() * 40),
      appearanceCount: 1,
      lastScraped: new Date(),
      lastVerifiedAt: new Date(),
      metadata: {
        color,
        description: `${color} ${archetype.name.toLowerCase()} from ${designer.name}\u2019s ${archetype.occasion.toLowerCase()} edit.`,
        styleTags: [archetype.occasion, ...designer.specializations.slice(0, 2)],
        occasion: archetype.occasion,
        collectionName: `${designer.tagline} \u2014 ${archetype.occasion} Edit`,
      },
    };
  });

  await Product.insertMany(products);
  return { designer: doc.name, slug: doc.slug, products: products.length };
}

async function main() {
  console.log('\ud83d\udd0c Connecting to MongoDB...');
  await connectMongoDB();
  console.log('\u2705 Connected');

  // Clear all previously-seeded designer catalog data first, in case the
  // roster shrinks between runs (stale slugs would otherwise stay active).
  const staleDesigners = await Designer.find({}, { _id: 1 }).lean();
  if (staleDesigners.length) {
    await Product.deleteMany({ designerId: { $in: staleDesigners.map((d) => d._id) } });
    await Designer.deleteMany({});
    console.log(`\ud83e\udde9 Cleared ${staleDesigners.length} previously-seeded designer(s).`);
  }

  const FEATURED_PRODUCT_COUNT = 7;
  const STANDARD_PRODUCT_COUNT = 3;

  const results = [];
  for (let i = 0; i < DESIGNERS.length; i += 1) {
    const designer = DESIGNERS[i];
    const count = designer.featured ? FEATURED_PRODUCT_COUNT : STANDARD_PRODUCT_COUNT;
    const result = await seedDesigner(designer, i, count);
    results.push(result);
    console.log(`  \u2713 ${result.designer} \u2014 ${result.products} products`);
  }

  const totalProducts = results.reduce((sum, r) => sum + r.products, 0);
  console.log('\n\u2705 Designer seed complete:', {
    designers: results.length,
    totalProducts,
  });

  await disconnectMongoDB();
}

main().catch(async (error) => {
  console.error('\u274c Designer seed failed:', error);
  await disconnectMongoDB().catch(() => undefined);
  process.exit(1);
});
