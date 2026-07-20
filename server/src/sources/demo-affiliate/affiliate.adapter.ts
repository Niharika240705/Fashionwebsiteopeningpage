import { createHash } from 'crypto';
import { SourceAdapter, SourceFetchResult } from '../types';
import { Audience } from '../../services/ingestion/taxonomy.service';

type DemoItem = {
  id: string;
  name: string;
  brand: string;
  category: string;
  audience: Audience;
  price: number;
  originalPrice?: number;
  url: string;
  image: string;
  color?: string;
  sizes?: string[];
  description?: string;
};

/**
 * One category's worth of demo catalog data. `category` MUST be the exact
 * canonical slug from `taxonomy.ts` / `taxonomy.service.ts` / `categories.py`
 * (women/men/kids). `retailerUrl` is a real retailer category/listing page;
 * each generated item appends a unique `?ref=persona-<id>` query param so
 * every product has a distinct, working "Go to retailer" destination
 * (Product.productUrl has a unique index — reusing one bare URL across many
 * items previously caused most of them to collide/merge into a single doc).
 */
interface CategorySeed {
  audience: Audience;
  category: string;
  /** Fallback brand used when `brands` (per-item rotation) isn't provided. */
  brand: string;
  /** Optional multi-brand rotation so items in the same category aren't all one brand. */
  brands?: string[];
  retailerUrl: string;
  names: string[];
  images: string[];
  priceMin: number;
  priceMax: number;
  colors?: string[];
  sizes?: string[];
}

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

// Verified-working Unsplash fashion photo IDs, grouped loosely by garment type.
const IMG = {
  dressMidiFloral: img('1572804013309-59a88b7e92f1'),
  dressSlipBlack: img('1595777457583-95e059d581b8'),
  dressMaxiPink: img('1596783074918-c84cb06531ca'),
  dressLaceNavy: img('1551803091-e20673f15770'),
  gownIvory: img('1515372039744-b8f02a3ae446'),
  gownWhite: img('1594552072238-b8a33785b261'),
  gownBlush: img('1566174053879-31528523f8ae'),
  jumpsuitTeal: img('1495385794356-15371f348c31'),
  topWrapIvory: img('1434389677669-e08b4cac3105'),
  rackTopsKnits: img('1490481651871-ab68de25d43d'),
  rackTeesColorful: img('1489987707025-afc232f7ea0f'),
  teeWhiteWomen: img('1554568218-0f1715e72254'),
  ethnicLehenga: img('1610030469983-98e550d6193c'),
  ethnicSaree: img('1583391733956-3750e0ff4e8b'),
  ethnicKurtaMen: img('1617127365659-c47fa864d8bc'),
  coordWomenStreet: img('1552902865-b72c031ac5ea'),
  jeansIndigo: img('1541099649105-f69ad21f3246'),
  jeansStoreWall: img('1560243563-062bfc001d68'),
  trousersKhaki: img('1473966968600-fa801b869a1a'),
  trousersStripeNeon: img('1509631179647-0177331693ae'),
  activewearWomen: img('1518310383802-640c2de311b2'),
  rackJacketsKnits: img('1445205170230-053b83016050'),
  sweaterFlatlay: img('1516762689617-e1cffcef479d'),
  jacketLeatherMen: img('1487222477894-8943e31ef7b2'),
  shirtOxfordMen: img('1596755094514-f87e34085b2c'),
  shirtLinenMen: img('1602810318383-e386cc2a3ccf'),
  teeCrewMen: img('1521572163474-6864f9cf17ab'),
  teeGraphicMen: img('1503341504253-dff4815485f1'),
  teeBeanieMen: img('1571945153237-4929e783af4a'),
  blazerMenSitting: img('1552374196-1ab2a1c593e8'),
  shoesDerbyMen: img('1614252369475-531eba835eb1'),
  sneakersRedBlack: img('1552346154-21d32810aba3'),
  backpackNavy: img('1553062407-98eeb64c6a62'),
  watchSilver: img('1524592094714-0f0654e20314'),
  watchBlackMen: img('1523275335684-37898b6baf30'),
  necklaceChain: img('1611652022419-a9419f74343d'),
  earringsGold: img('1535632066927-ab7c9ab60908'),
  bagMiniBlack: img('1584917865442-de89df76afd3'),
  kidsDressYellow: img('1519238263530-99bdd11df2ea'),
  kidsTeeBoyBlue: img('1503342217505-b0a15ec3261c'),
  kidsCoordMint: img('1515886657613-9f3515b0c78f'),
  kidsEthnicGold: img('1601925260368-ae2f83cf8b7f'),
  kidsShoesWhite: img('1514989940723-e8e51635b782'),
  kidsBraceletMulti: img('1611591437281-460bfbe1220a'),
  kidsGirlsOutdoors: img('1476234251651-f353703a034d'),
  infantRomper: img('1522771930-78848d9293e8'),
  infantPoolRing: img('1519689680058-324335c77eba'),
  kidsRaincoatBackpack: img('1503919545889-aef636e10ad4'),
  // Extra, visually-confirmed images added to lightly diversify a few non-dress
  // categories (see DRESS_IMAGES / WEDDING_GOWN_IMAGES / PARTY_WEAR_IMAGES below
  // for the main fix targeting women/dresses, wedding-gowns, party-wear).
  jacketWomanCoatShopping: img('1483985988355-763728e1935b'),
  hoodieWomanBlue: img('1517841905240-472988babdf9'),
  activewearSportsBra: img('1516726817505-f5ed825624d8'),
};

/**
 * Every ID below was pulled from live Unsplash search results for dress/gown
 * queries (e.g. "woman dress", "wedding gown", "cocktail dress") and verified
 * with an HTTP 200 check against images.unsplash.com before being added here,
 * so browsing women > dresses / wedding-gowns / party-wear shows genuinely
 * distinct product photography instead of a handful of images on repeat.
 */
const DRESS_IMAGES: string[] = [
  img('1585556282289-d4d5a7967936'), // woman in white lace dress smiling
  img('1618814523809-8b181370e747'), // black and red floral dress, dock
  img('1670672454488-06e3821be477'), // blue and white dress, walking by water
  img('1518102885802-e869dcb9da8b'), // three women in red/brown/blue dresses
  img('1704342321078-28337aa0c299'), // red dress, sitting on a couch
  img('1665703156115-00eb01ec4ff9'), // woman in a white dress
  img('1693074446713-aad8855c20d7'), // white dress, holding a bouquet
  img('1618814540017-f152391781c1'), // black and white floral dress, rocks
  img('1617019114583-affb34d1b3cd'), // white long sleeve dress, sunglasses
  img('1574868843985-6caab2f9e64c'), // woman in a blue dress
  img('1649494572241-daefc131b108'), // white dress, standing on a path
  img('1622079401116-8317808352d9'), // blue and black sleeveless dress
  img('1699729589505-d1791e32d925'), // blue dress, holding a glass of wine
  img('1773439878398-696c801b72f4'), // beige dress with red scarf
  img('1631429638741-bdff091f95ad'), // blue dress, standing on a beach
  img('1590343104492-972a3169bc98'), // yellow dress, brown sand
  img('1602303894456-398ce544d90b'), // yellow and red floral dress
  img('1583433306546-ded68847fd0d'), // green and purple floral dress
  img('1662833835232-07db8a7f1570'), // person in a white dress
  img('1610048616025-11a3dcc9fd0b'), // white floral dress near brown wall
  img('1618814509419-e61b0434ae97'), // black and white floral dress, rock formation
  img('1589083133356-aa13ceaef7fd'), // yellow and black floral tube dress
  img('1665783126947-8c98c7b7ac72'), // white and black dress
  img('1576757782865-f4ca733be1ae'), // red and white tube pleated dress
  img('1583039949165-96ee24b0d8de'), // red dress near brown brick wall
  img('1619693645061-031b0585ebd7'), // white dress with red lipstick
  img('1612336307429-8a898d10e223'), // red long sleeve dress
  img('1568251863885-adcac989de24'), // gray one-shouldered mini dress
  img('1588658917122-58f641bfaf9b'), // yellow dress, beach shore
  img('1622080159549-11537bf939e6'), // orange long sleeve dress
  img('1568251188392-ae32f898cb3b'), // woman in a black dress
  img('1613424935149-c8efd5c41e91'), // white sleeveless dress, concrete floor
  img('1589212987511-4a924cb9d8ac'), // black dress, sitting on a metal bench
  img('1594816935907-1e8f03b98437'), // white floral dress, concrete floor
  img('1601859574492-8658b6f7f990'), // white lace dress near green plants
  img('1710023132784-e1b8538d4fb9'), // white dress standing in the dark
  img('1622090567079-343116452be0'), // black and white floral dress, red sun hat
  img('1595877786670-393ef0ac0961'), // black dress in front of woman in white dress
  img('1771926323974-19a1fd379955'), // white dress, lying on rocks
  img('1617551307538-c9cdb9d71289'), // white dress, standing on beach
  img('1708585919491-d089c4e5fe79'), // white dress, standing in a field
];

const WEDDING_GOWN_IMAGES: string[] = [
  img('1585241920473-b472eb9ffbae'), // white floral wedding dress
  img('1595877786462-ea6dc03f1695'), // wedding gown beside a black dress
  img('1596026340110-1ea71c22132f'), // wedding dress, green field near river
  img('1596181243306-e02a1897afb1'), // wedding dress, green grass field
  img('1622122746526-66cb56134cb4'), // groom and bride in wedding dress with bouquet
  img('1622277430358-f4d134452e2e'), // wedding dress near a window
  img('1629326017926-9cad9c909196'), // woman in white wedding dress
  img('1645827028028-5470d8487de5'), // wedding dress in front of a tree
  img('1645827042168-4fb0cdd0bf7e'), // wedding dress, holding a bouquet
  img('1652501046533-1b232088aafe'), // person wearing a wedding dress
  img('1654697602305-6cf060782fb3'), // wedding dress, looking at a phone
  img('1676132068619-f015a54cee3d'), // wedding dress in front of a dress rack
  img('1682226335318-f1911fdef7c1'), // bride getting ready in wedding dress
  img('1689091243226-8516e29c8815'), // chandelier next to a row of wedding dresses
  img('1693074445771-6dd5d1b5668e'), // wedding dress, holding a bouquet
  img('1693074446607-6a3236e8d98a'), // wedding dress, holding a wine glass
  img('1704342677748-f2edfa9221e3'), // red bridal gown
  img('1704342858294-ddfcc6a96c55'), // bridal gown in front of a curtain
  img('1710090411619-69da74080191'), // wedding dress, posing for a picture
  img('1710090411838-5f846e289b2e'), // white wedding dress, holding a bouquet
  img('1741311178735-e65b6e9048b7'), // wedding dress displayed in front of mirrors
  img('1652501077431-fd86441c07f5'), // wedding dress flat-lay on a table
  img('1652501110379-791d8adc753f'), // wedding dress flat-lay on a table
  img('1652501089372-98938d79006e'), // wedding dress flat-lay on a table
];

const PARTY_WEAR_IMAGES: string[] = [
  img('1528813569347-f16dd076e347'), // orange polka-dot spaghetti strap dress
  img('1568252542512-9fe8fe9c87bb'), // woman in a maroon dress
  img('1601653311204-38ac329d790e'), // silver spaghetti strap dress
  img('1603122630570-7fd434d470d0'), // black spaghetti strap dress, on stage
  img('1607624333929-adc8b1d81586'), // blue sleeveless dress, disposable cup
  img('1610372081132-3dfbb6db5aea'), // brown sleeveless dress, wine glass
  img('1629045741329-37f47cb10b88'), // white sleeveless dress, beach sunset bouquet
  img('1631624972105-9d950c206541'), // sequin dress, sitting on a bench
  img('1650817268809-0dc807b39d4a'), // woman in a purple dress
  img('1729168114832-cf16cb0df2fa'), // black dress, posing for a picture
  img('1733324961705-97bd6cd7f4ba'), // orange dress, walking down a runway
  img('1752118411718-f73b654fe52d'), // blue dress, posing elegantly
  img('1752119352566-b254fa6957ac'), // two women posing in formal dresses
  img('1756483502841-a9e2f13846b7'), // grey dress with embellishments
  img('1758539720658-4a1732a5b7cf'), // dark dress, standing outside at night
  img('1764265554883-9804fe44f330'), // dress, standing on outdoor stairs at night
  img('1764265555430-5abe125e9609'), // green dress, standing on stairs at night
  img('1765229276545-c23adb5442bf'), // ornate dress, dimly lit restaurant
  img('1769883204270-909b63437a30'), // formal dress, smiling in an oval mirror
  img('1772615071603-ad5de36e425d'), // sparkling sheer dress with heels
  img('1772615071677-6441340349fd'), // sparkly dress, celebrating with champagne
  img('1729773173866-022d39fc6c50'), // red dress, sitting down
  img('1764265148862-7ee72a4fb367'), // dark red dress, outdoors
  img('1772537768973-1174c03b6ef6'), // teal dress, smiling by a fountain
];

const CATEGORY_SEEDS: CategorySeed[] = [
  // ---------------- WOMEN ----------------
  {
    audience: 'women',
    category: 'dresses',
    brand: 'Myntra',
    brands: ['Myntra', 'H&M', 'Zara', 'Vero Moda', 'AND', 'Global Desi', 'Forever 21', 'Mango', 'ONLY', 'Biba'],
    retailerUrl: 'https://www.myntra.com/dresses',
    // 41 unique names/images so browsing dresses never repeats a title or photo.
    names: [
      'Floral Midi Dress',
      'Satin Slip Dress',
      'Wrap Maxi Dress',
      'Puff-Sleeve Mini Dress',
      'Linen Shift Dress',
      'Off-Shoulder Sundress',
      'Tiered Ruffle Dress',
      'Bodycon Bandage Dress',
      'Polka Dot Fit-and-Flare Dress',
      'Button-Front Shirt Dress',
      'Smocked Waist Sundress',
      'A-Line Midi Dress',
      'Halter Neck Maxi Dress',
      'Ruched Bodycon Midi Dress',
      'Tie-Waist Wrap Dress',
      'Pleated Chiffon Dress',
      'Square-Neck Cotton Dress',
      'Broderie Anglaise Dress',
      'Tiered Tent Dress',
      'Cold-Shoulder Midi Dress',
      'Corset Waist Dress',
      'Balloon-Sleeve Dress',
      'Printed Wrap Midi Dress',
      'Empire Waist Sundress',
      'Denim Shirt Dress',
      'Knit Bodycon Dress',
      'Asymmetric Hem Dress',
      'Cutout Waist Midi Dress',
      'Gingham Check Dress',
      'Flutter Sleeve Dress',
      'Scoop Neck Slip Dress',
      'Tiered Boho Maxi Dress',
      'Fit-and-Flare Party Midi',
      'Lace Trim Sundress',
      'Pintuck Cotton Dress',
      'High-Low Hem Dress',
      'Ribbed Column Dress',
      'Tropical Print Maxi Dress',
      'Collared Poplin Dress',
      'Belted Wrap Dress',
      'Cape-Sleeve Midi Dress',
    ],
    images: DRESS_IMAGES,
    priceMin: 799,
    priceMax: 5999,
    colors: [
      'pink', 'black', 'blue', 'ivory', 'yellow', 'red', 'green', 'orange',
      'white', 'denim', 'lavender', 'coral', 'mustard', 'teal', 'maroon', 'floral print',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'wedding-gowns',
    brand: 'Myntra Bridal',
    brands: ['Myntra Bridal', 'Mohey', 'Kalki Fashion', 'Aashi Studio', 'Panache Haute Couture', 'Jade by Monica and Karishma'],
    retailerUrl: 'https://www.myntra.com/gowns',
    // 24 unique names/images so the bridal shelf doesn't feel like the same gown repeated.
    names: [
      'Sequin Mermaid Wedding Gown',
      'Lace A-Line Bridal Gown',
      'Off-Shoulder Evening Gown',
      'Ballgown Tulle Wedding Dress',
      'Beaded Empire Wedding Gown',
      'Trumpet Silhouette Bridal Gown',
      'Cathedral Train Wedding Gown',
      'Illusion Neckline Bridal Gown',
      'Floral Applique Wedding Gown',
      'Sweetheart Neckline Ballgown',
      'Corset Bodice Bridal Gown',
      'Chapel Train Lace Gown',
      'Draped Satin Wedding Gown',
      'Crystal Embellished Bridal Gown',
      'Halter Neck Bridal Gown',
      'Tiered Organza Wedding Gown',
      'Fit-and-Flare Bridal Gown',
      'Vintage Lace Wedding Gown',
      'Off-White Silk Bridal Gown',
      'Cap Sleeve Wedding Gown',
      'Backless Satin Bridal Gown',
      'Layered Tulle Bridal Gown',
      'Embroidered Bridal Lehenga Gown',
      'Regal Long Train Wedding Gown',
    ],
    images: WEDDING_GOWN_IMAGES,
    priceMin: 5999,
    priceMax: 34999,
    colors: ['ivory', 'white', 'blush', 'champagne', 'pearl', 'off-white', 'silver', 'rose gold'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'party-wear',
    brand: 'Zara Occasion',
    brands: ['Zara Occasion', 'Forever 21', 'Mango', 'AND', 'Sassafras', 'Style Union', 'Twenty Dresses', 'Deme by Gabriella'],
    retailerUrl: 'https://www.myntra.com/party-dresses',
    // 24 unique names/images so the party/occasion shelf doesn't feel like the same dress repeated.
    names: [
      'Sequin Cocktail Dress',
      'Metallic Wrap Dress',
      'Velvet Party Gown',
      'Fringe Flapper Dress',
      'Halter Neck Party Dress',
      'Shimmer Bodycon Dress',
      'Cutout Evening Dress',
      'One-Shoulder Party Dress',
      'Sequin Cape-Sleeve Dress',
      'Satin Cowl-Neck Dress',
      'Feather Trim Party Dress',
      'Sparkle Slip Dress',
      'Ruched Metallic Dress',
      'Backless Sequin Gown',
      'Thigh-Slit Evening Dress',
      'Bardot Party Dress',
      'Draped Satin Cocktail Dress',
      'Crystal Fringe Dress',
      'Plunge Neck Party Dress',
      'Sequin Bodycon Midi',
      'Off-Shoulder Cocktail Gown',
      'Metallic Pleated Dress',
      'Glitter Tulle Party Dress',
      'Statement Sleeve Evening Dress',
    ],
    images: PARTY_WEAR_IMAGES,
    priceMin: 1299,
    priceMax: 9999,
    colors: [
      'navy', 'gold', 'teal', 'blush', 'emerald', 'wine', 'silver',
      'black', 'burgundy', 'copper', 'royal blue', 'fuchsia',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'tops',
    brand: 'H&M',
    retailerUrl: 'https://www2.hm.com/en_in/ladies/shop-by-product/tops.html',
    names: [
      'Linen Wrap Top',
      'Ruffle Sleeve Blouse',
      'Peplum Top',
      'Off-Shoulder Top',
      'Knot-Front Top',
      'Satin Cami Top',
      'Puff Sleeve Blouse',
      'Crochet Top',
    ],
    images: [IMG.topWrapIvory, IMG.rackTopsKnits, IMG.rackTeesColorful],
    priceMin: 599,
    priceMax: 2499,
    colors: ['ivory', 'white', 'black'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 't-shirts',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/tshirts',
    names: [
      'Oversized Graphic Tee',
      'Basic Crew Neck Tee',
      'Ribbed Fitted Tee',
      'Printed Boyfriend Tee',
      'Slogan T-Shirt',
      'Striped Cotton Tee',
      'Crop T-Shirt',
      'Tie-Dye T-Shirt',
    ],
    images: [IMG.teeWhiteWomen, IMG.rackTeesColorful],
    priceMin: 399,
    priceMax: 1299,
    colors: ['white', 'black', 'grey'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  {
    audience: 'women',
    category: 'shirts',
    brand: 'Zara',
    retailerUrl: 'https://www.myntra.com/shirts',
    names: [
      'Classic Cotton Shirt',
      'Striped Poplin Shirt',
      'Oversized Denim Shirt',
      'Satin Button-Down Shirt',
      'Checked Flannel Shirt',
      'Georgette Tie-Neck Shirt',
      'Linen Boyfriend Shirt',
      'Collar Popover Shirt',
    ],
    images: [IMG.topWrapIvory, IMG.shirtOxfordMen],
    priceMin: 899,
    priceMax: 2999,
    colors: ['white', 'blue', 'denim'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'kurtas',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/kurtas',
    names: [
      'Embroidered A-Line Kurta',
      'Printed Straight Kurta',
      'Chikankari Kurta Set',
      'Angrakha Style Kurta',
      'Ikat Print Kurta',
      'Cotton Kurta with Palazzo',
      'Bandhani Print Kurta',
      'Zari Border Kurta',
    ],
    images: [IMG.ethnicLehenga, IMG.ethnicKurtaMen],
    priceMin: 899,
    priceMax: 3999,
    colors: ['maroon', 'mustard', 'white', 'green'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    audience: 'women',
    category: 'sarees',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/saree',
    names: [
      'Banarasi Silk Saree',
      'Chiffon Printed Saree',
      'Georgette Party Saree',
      'Kanjeevaram Silk Saree',
      'Linen Handloom Saree',
      'Organza Embroidered Saree',
      'Cotton Handblock Saree',
      'Sequin Net Saree',
    ],
    images: [IMG.ethnicSaree],
    priceMin: 1499,
    priceMax: 9999,
    colors: ['red', 'gold', 'blue', 'green'],
  },
  {
    audience: 'women',
    category: 'co-ords',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/co-ord-sets',
    names: [
      'Ribbed Knit Co-ord Set',
      'Printed Shirt & Shorts Set',
      'Blazer & Trouser Co-ord',
      'Tie-Dye Lounge Co-ord',
      'Crop Top & Skirt Set',
      'Satin Cami Co-ord',
      'Denim Shirt & Skort Set',
      'Textured Top & Pant Set',
    ],
    images: [IMG.jumpsuitTeal, IMG.coordWomenStreet],
    priceMin: 1299,
    priceMax: 3999,
    colors: ['teal', 'black', 'beige'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'jeans',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/jeans',
    names: [
      'High-Rise Wide Jeans',
      'Skinny Fit Jeans',
      'Straight Leg Jeans',
      'Distressed Boyfriend Jeans',
      'Flared Bootcut Jeans',
      'Cropped Ankle Jeans',
      'Mom Fit Jeans',
      'Bootcut Stretch Jeans',
    ],
    images: [IMG.jeansIndigo, IMG.jeansStoreWall],
    priceMin: 1299,
    priceMax: 3499,
    colors: ['indigo', 'black', 'light blue'],
    sizes: ['26', '28', '30', '32'],
  },
  {
    audience: 'women',
    category: 'trousers',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/trousers',
    names: [
      'Wide-Leg Palazzo Trousers',
      'Tailored Straight Trousers',
      'Pleated Formal Trousers',
      'High-Waist Cigarette Pants',
      'Linen Culottes',
      'Striped Wide Trousers',
      'Cropped Chino Trousers',
      'Pinstripe Trousers',
    ],
    images: [IMG.trousersKhaki, IMG.trousersStripeNeon],
    priceMin: 999,
    priceMax: 2999,
    colors: ['khaki', 'black', 'stripe'],
    sizes: ['26', '28', '30', '32'],
  },
  {
    audience: 'women',
    category: 'skirts',
    brand: 'Zara',
    retailerUrl: 'https://www.myntra.com/skirts',
    names: [
      'Pleated Midi Skirt',
      'A-Line Denim Skirt',
      'Wrap Mini Skirt',
      'Satin Slip Skirt',
      'Tiered Maxi Skirt',
      'Pencil Office Skirt',
      'Corduroy Mini Skirt',
      'Printed Wrap Skirt',
    ],
    images: [IMG.trousersStripeNeon, IMG.rackTopsKnits],
    priceMin: 799,
    priceMax: 2499,
    colors: ['denim', 'black', 'print'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'shorts',
    brand: 'H&M',
    retailerUrl: 'https://www.myntra.com/shorts',
    names: [
      'High-Waist Denim Shorts',
      'Tailored Bermuda Shorts',
      'Pleated Culotte Shorts',
      'Cotton Boxer Shorts',
      'Printed Beach Shorts',
      'Linen Paperbag Shorts',
      'Cargo Utility Shorts',
      'Ribbed Cycling Shorts',
    ],
    images: [IMG.coordWomenStreet, IMG.activewearWomen],
    priceMin: 599,
    priceMax: 1799,
    colors: ['denim', 'black', 'khaki'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'jackets',
    brand: 'Zara',
    retailerUrl: 'https://www.myntra.com/jackets',
    names: [
      'Oversized Denim Jacket',
      'Quilted Puffer Jacket',
      'Biker Leather Jacket',
      'Longline Trench Coat',
      'Corduroy Shacket',
      'Bomber Jacket',
      'Faux Fur Jacket',
      'Cropped Utility Jacket',
    ],
    images: [IMG.rackJacketsKnits, IMG.jacketLeatherMen, IMG.jacketWomanCoatShopping],
    priceMin: 1499,
    priceMax: 4999,
    colors: ['denim', 'black', 'olive'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'hoodies',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/hoodies',
    names: [
      'Fleece Pullover Hoodie',
      'Oversized Zip Hoodie',
      'Graphic Print Hoodie',
      'Cropped Hoodie',
      'Tie-Dye Hoodie',
      'Sherpa Lined Hoodie',
      'Colour-Block Hoodie',
      'Ribbed Hoodie Dress',
    ],
    images: [IMG.rackJacketsKnits, IMG.sweaterFlatlay, IMG.hoodieWomanBlue],
    priceMin: 999,
    priceMax: 2799,
    colors: ['grey', 'black', 'pastel'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'sweaters',
    brand: 'H&M',
    retailerUrl: 'https://www.myntra.com/sweaters',
    names: [
      'Cable Knit Sweater',
      'Turtleneck Pullover',
      'Cardigan Sweater',
      'Chunky Knit Jumper',
      'V-Neck Sweater Vest',
      'Mohair Sweater',
      'Off-Shoulder Knit Sweater',
      'Striped Crew Sweater',
    ],
    images: [IMG.sweaterFlatlay, IMG.rackTopsKnits],
    priceMin: 1199,
    priceMax: 3299,
    colors: ['beige', 'cream', 'grey'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'activewear',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/women-sportswear',
    names: [
      'Performance Sports Bra Set',
      'High-Waist Leggings',
      'Training Tank Top',
      'Zip-Through Tracksuit',
      'Seamless Gym Set',
      'Running Shorts',
      'Quick-Dry Sports Tee',
      'Yoga Wrap Top',
    ],
    images: [IMG.activewearWomen, IMG.coordWomenStreet, IMG.activewearSportsBra],
    priceMin: 799,
    priceMax: 2599,
    colors: ['black', 'grey', 'coral'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'nightwear',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/nightdresses',
    names: [
      'Cotton Nightdress',
      'Satin Pajama Set',
      'Printed Nightsuit',
      'Robe & Slip Set',
      'Floral Sleep Shirt',
      'Striped Pajama Set',
      'Lace Trim Nightgown',
      'Terry Lounge Set',
    ],
    images: [IMG.teeWhiteWomen, IMG.rackTopsKnits],
    priceMin: 599,
    priceMax: 1999,
    colors: ['pastel', 'white', 'print'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'lingerie',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/lingerie',
    names: [
      'Everyday T-Shirt Bra',
      'Lace Trim Bralette',
      'Seamless Padded Bra',
      'High-Waist Brief Pack',
      'Shapewear Bodysuit',
      'Push-Up Bra',
      'Cotton Camisole Set',
      'Sports Bralette',
    ],
    images: [IMG.rackTopsKnits, IMG.teeWhiteWomen],
    priceMin: 399,
    priceMax: 1599,
    colors: ['nude', 'black', 'white'],
    sizes: ['XS', 'S', 'M', 'L'],
  },
  {
    audience: 'women',
    category: 'footwear',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/women-footwear',
    names: [
      'Block Heel Sandals',
      'Pointed Toe Pumps',
      'Ankle Strap Heels',
      'Espadrille Wedges',
      'Ballet Flats',
      'Chunky Sole Sneakers',
      'Strappy Gladiator Sandals',
      'Knee-High Boots',
    ],
    images: [IMG.sneakersRedBlack, IMG.sweaterFlatlay],
    priceMin: 899,
    priceMax: 3999,
    colors: ['nude', 'black', 'tan'],
    sizes: ['36', '37', '38', '39', '40'],
  },
  {
    audience: 'women',
    category: 'accessories',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/women-accessories',
    names: [
      'Gold-Plated Hoop Earrings',
      'Structured Mini Bag',
      'Minimal Analog Watch',
      'Layered Chain Necklace',
      'Tortoiseshell Sunglasses',
      'Leather Woven Belt',
      'Silk Printed Scarf',
      'Beaded Statement Bracelet',
    ],
    images: [IMG.earringsGold, IMG.bagMiniBlack, IMG.watchSilver, IMG.necklaceChain],
    priceMin: 299,
    priceMax: 3999,
    colors: ['gold', 'black', 'silver'],
  },

  // ---------------- MEN ----------------
  {
    audience: 'men',
    category: 't-shirts',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/men-tshirts',
    names: [
      'Essential Crew T-Shirt',
      'Graphic Print Tee',
      'Polo Collar T-Shirt',
      'Henley T-Shirt',
      'Striped Cotton Tee',
      'Oversized Tee',
      'Tie-Dye T-Shirt',
      'Solid V-Neck Tee',
    ],
    images: [IMG.teeCrewMen, IMG.teeGraphicMen, IMG.teeBeanieMen, IMG.rackTeesColorful],
    priceMin: 399,
    priceMax: 1499,
    colors: ['grey', 'black', 'white', 'navy'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    audience: 'men',
    category: 'shirts',
    brand: 'H&M',
    retailerUrl: 'https://www2.hm.com/en_in/men/shop-by-product/shirts.html',
    names: [
      'Oxford Cotton Shirt',
      'Linen Resort Shirt',
      'Checked Flannel Shirt',
      'Slim Fit Formal Shirt',
      'Denim Casual Shirt',
      'Printed Cuban Collar Shirt',
      'Corduroy Overshirt',
      'Striped Business Shirt',
    ],
    images: [IMG.shirtOxfordMen, IMG.shirtLinenMen],
    priceMin: 899,
    priceMax: 2999,
    colors: ['blue', 'white', 'checked'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    audience: 'men',
    category: 'jeans',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/men-jeans',
    names: [
      'Slim Fit Jeans',
      'Straight Fit Jeans',
      'Distressed Denim Jeans',
      'Tapered Jogger Jeans',
      'Relaxed Fit Jeans',
      'Skinny Stretch Jeans',
      'Dark Wash Jeans',
      'Light Wash Bootcut Jeans',
    ],
    images: [IMG.jeansStoreWall, IMG.jeansIndigo],
    priceMin: 1299,
    priceMax: 3499,
    colors: ['indigo', 'black', 'light blue'],
    sizes: ['30', '32', '34', '36'],
  },
  {
    audience: 'men',
    category: 'trousers',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/men-trousers',
    names: [
      'Slim Chino Trousers',
      'Tailored Formal Trousers',
      'Pleated Wide Trousers',
      'Cargo Trousers',
      'Linen Drawstring Trousers',
      'Corduroy Trousers',
      'Stretch Ankle Trousers',
      'Pinstripe Suit Trousers',
    ],
    images: [IMG.trousersKhaki, IMG.blazerMenSitting],
    priceMin: 999,
    priceMax: 3199,
    colors: ['khaki', 'navy', 'grey'],
    sizes: ['30', '32', '34', '36'],
  },
  {
    audience: 'men',
    category: 'shorts',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/men-shorts',
    names: [
      'Cargo Shorts',
      'Chino Shorts',
      'Denim Shorts',
      'Sports Shorts',
      'Cotton Bermuda Shorts',
      'Printed Boardshorts',
      'Linen Shorts',
      'Track Shorts',
    ],
    images: [IMG.coordWomenStreet, IMG.activewearWomen],
    priceMin: 599,
    priceMax: 1799,
    colors: ['khaki', 'navy', 'black'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    audience: 'men',
    category: 'jackets',
    brand: 'Zara',
    retailerUrl: 'https://www.myntra.com/men-jackets',
    names: [
      'Biker Leather Jacket',
      'Bomber Jacket',
      'Denim Jacket',
      'Quilted Puffer Jacket',
      'Windcheater Jacket',
      'Varsity Jacket',
      'Trench Coat',
      'Field Jacket',
    ],
    images: [IMG.jacketLeatherMen, IMG.rackJacketsKnits],
    priceMin: 1499,
    priceMax: 4999,
    colors: ['black', 'olive', 'navy'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    audience: 'men',
    category: 'hoodies',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/men-hoodies',
    names: [
      'Fleece Pullover Hoodie',
      'Zip-Up Hoodie',
      'Graphic Hoodie',
      'Oversized Hoodie',
      'Sherpa Hoodie',
      'Colour-Block Hoodie',
      'Ribbed Hoodie',
      'Sleeveless Hoodie',
    ],
    images: [IMG.teeBeanieMen, IMG.rackJacketsKnits],
    priceMin: 999,
    priceMax: 2799,
    colors: ['grey', 'black', 'navy'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    audience: 'men',
    category: 'sweatshirts',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/men-sweatshirts',
    names: [
      'Crew Neck Sweatshirt',
      'Graphic Print Sweatshirt',
      'Fleece Sweatshirt',
      'Raglan Sleeve Sweatshirt',
      'Colour-Block Sweatshirt',
      'Zip Sweatshirt',
      'Terry Sweatshirt',
      'Varsity Sweatshirt',
    ],
    images: [IMG.sweaterFlatlay, IMG.teeBeanieMen],
    priceMin: 899,
    priceMax: 2499,
    colors: ['grey', 'black', 'maroon'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    audience: 'men',
    category: 'blazers',
    brand: 'Zara',
    retailerUrl: 'https://www.myntra.com/men-blazers',
    names: [
      'Slim Fit Blazer',
      'Double-Breasted Blazer',
      'Linen Summer Blazer',
      'Checked Blazer',
      'Velvet Dinner Blazer',
      'Casual Unstructured Blazer',
      'Tweed Blazer',
      'Wool Blend Blazer',
    ],
    images: [IMG.blazerMenSitting],
    priceMin: 2999,
    priceMax: 7999,
    colors: ['navy', 'grey', 'black'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    audience: 'men',
    category: 'suits',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/men-suits',
    names: [
      'Three-Piece Formal Suit',
      'Slim Fit Two-Piece Suit',
      'Tuxedo Suit',
      'Wedding Sherwani Suit',
      'Linen Summer Suit',
      'Pinstripe Business Suit',
      'Double-Breasted Suit',
      'Velvet Party Suit',
    ],
    images: [IMG.blazerMenSitting, IMG.ethnicKurtaMen],
    priceMin: 4999,
    priceMax: 14999,
    colors: ['navy', 'black', 'charcoal'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    audience: 'men',
    category: 'ethnic-wear',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/men-kurtas',
    names: [
      'Embroidered Kurta Set',
      'Nehru Jacket Kurta Set',
      'Silk Kurta Pyjama',
      'Bandhgala Ethnic Set',
      'Cotton Kurta Set',
      'Dhoti Kurta Set',
      'Printed Kurta',
      'Sherwani Set',
    ],
    images: [IMG.ethnicKurtaMen],
    priceMin: 1499,
    priceMax: 5999,
    colors: ['cream', 'maroon', 'gold'],
    sizes: ['M', 'L', 'XL', 'XXL'],
  },
  {
    audience: 'men',
    category: 'activewear',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/men-sportswear',
    names: [
      'Performance Training Tee',
      'Track Pants',
      'Gym Tank Top',
      'Running Shorts',
      'Compression T-Shirt',
      'Zip-Through Tracksuit',
      'Sports Jacket',
      'Quick-Dry Polo',
    ],
    images: [IMG.activewearWomen, IMG.coordWomenStreet],
    priceMin: 599,
    priceMax: 2499,
    colors: ['black', 'grey', 'blue'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    audience: 'men',
    category: 'footwear',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/men-footwear',
    names: [
      'Leather Derby Shoes',
      'Casual Sneakers',
      'Chelsea Boots',
      'Running Shoes',
      'Loafers',
      'Sandals',
      'Formal Oxford Shoes',
      'Canvas Sneakers',
    ],
    images: [IMG.shoesDerbyMen, IMG.sneakersRedBlack],
    priceMin: 999,
    priceMax: 4999,
    colors: ['brown', 'black', 'white'],
    sizes: ['40', '41', '42', '43', '44'],
  },
  {
    audience: 'men',
    category: 'accessories',
    brand: 'Myntra',
    retailerUrl: 'https://www.myntra.com/men-accessories',
    names: [
      'Everyday Backpack',
      'Chronograph Watch',
      'Stainless Chain Necklace',
      'Leather Wallet',
      'Aviator Sunglasses',
      'Woven Belt',
      'Formal Tie',
      'Cufflinks Set',
    ],
    images: [IMG.backpackNavy, IMG.watchBlackMen, IMG.necklaceChain],
    priceMin: 299,
    priceMax: 4999,
    colors: ['black', 'navy', 'silver'],
  },

  // ---------------- KIDS ----------------
  {
    audience: 'kids',
    category: 'boys',
    brand: 'Myntra Kids',
    retailerUrl: 'https://www.myntra.com/boys-clothing',
    names: [
      'Graphic Print T-Shirt',
      'Cargo Shorts Set',
      'Denim Jacket',
      'Checked Shirt',
      'Track Suit',
      'Casual Polo',
      'Printed Hoodie',
      'Cotton Joggers',
    ],
    images: [IMG.kidsTeeBoyBlue, IMG.kidsRaincoatBackpack],
    priceMin: 399,
    priceMax: 1499,
    colors: ['blue', 'grey', 'red'],
    sizes: ['3-4Y', '5-6Y', '7-8Y', '9-10Y'],
  },
  {
    audience: 'kids',
    category: 'girls',
    brand: 'Myntra Kids',
    retailerUrl: 'https://www.myntra.com/girls-clothing',
    names: [
      'Floral Print Dress',
      'Denim Skirt Set',
      'Ruffle Top',
      'Printed Leggings Set',
      'Party Frock',
      'Cotton Jumpsuit',
      'Embellished Tunic',
      'Tiered Skirt',
    ],
    images: [IMG.kidsGirlsOutdoors, IMG.kidsCoordMint],
    priceMin: 399,
    priceMax: 1799,
    colors: ['pink', 'yellow', 'purple'],
    sizes: ['2-3Y', '4-5Y', '6-7Y', '8-9Y'],
  },
  {
    audience: 'kids',
    category: 'infant',
    brand: 'Myntra Kids',
    retailerUrl: 'https://www.myntra.com/infant-clothing',
    names: [
      'Fleece Romper',
      'Cotton Onesie Set',
      'Hooded Sherpa Jumpsuit',
      'Printed Bodysuit Pack',
      'Soft Cotton Sleepsuit',
      'Knit Cardigan Set',
      'Terry Romper',
      'Organic Cotton Onesie',
    ],
    images: [IMG.infantRomper, IMG.infantPoolRing],
    priceMin: 299,
    priceMax: 1199,
    colors: ['grey', 'white', 'pastel'],
    sizes: ['0-3M', '3-6M', '6-12M', '12-18M'],
  },
  {
    audience: 'kids',
    category: 'dresses',
    brand: 'Myntra Kids',
    retailerUrl: 'https://www.myntra.com/girls-dresses',
    names: [
      'Printed Party Dress',
      'Tutu Fairy Dress',
      'Floral Cotton Dress',
      'Puff Sleeve Dress',
      'Embroidered Frock',
      'Denim Pinafore Dress',
      'Sequin Occasion Dress',
      'Layered Tulle Dress',
    ],
    images: [IMG.kidsDressYellow, IMG.kidsGirlsOutdoors],
    priceMin: 599,
    priceMax: 2199,
    colors: ['yellow', 'pink', 'white'],
    sizes: ['3-4Y', '5-6Y', '7-8Y'],
  },
  {
    audience: 'kids',
    category: 'tops',
    brand: 'H&M Kids',
    retailerUrl: 'https://www.myntra.com/kids-tops',
    names: [
      'Printed Cotton Top',
      'Ruffle Sleeve Top',
      'Peplum Top',
      'Knot-Front Top',
      'Striped Top',
      'Graphic Tank Top',
      'Embroidered Blouse',
      'Puff Sleeve Top',
    ],
    images: [IMG.kidsCoordMint, IMG.kidsTeeBoyBlue],
    priceMin: 299,
    priceMax: 999,
    colors: ['mint', 'white', 'pink'],
    sizes: ['2-3Y', '4-5Y', '6-7Y'],
  },
  {
    audience: 'kids',
    category: 't-shirts',
    brand: 'H&M Kids',
    retailerUrl: 'https://www.myntra.com/kids-tshirts',
    names: [
      'Graphic Print T-Shirt',
      'Solid Cotton Tee',
      'Striped Crew Tee',
      'Cartoon Print Tee',
      'Polo T-Shirt',
      'Tie-Dye Tee',
      'Number Print Tee',
      'Slogan T-Shirt',
    ],
    images: [IMG.kidsTeeBoyBlue],
    priceMin: 249,
    priceMax: 899,
    colors: ['blue', 'white', 'red'],
    sizes: ['4-5Y', '6-7Y', '8-9Y'],
  },
  {
    audience: 'kids',
    category: 'shirts',
    brand: 'Myntra Kids',
    retailerUrl: 'https://www.myntra.com/kids-shirts',
    names: [
      'Checked Casual Shirt',
      'Denim Shirt',
      'Printed Party Shirt',
      'Linen Shirt',
      'Formal White Shirt',
      'Striped Shirt',
      'Corduroy Shirt',
      'Chambray Shirt',
    ],
    images: [IMG.kidsTeeBoyBlue, IMG.shirtOxfordMen],
    priceMin: 399,
    priceMax: 1299,
    colors: ['blue', 'white', 'checked'],
    sizes: ['4-5Y', '6-7Y', '8-9Y'],
  },
  {
    audience: 'kids',
    category: 'jeans',
    brand: 'Myntra Kids',
    retailerUrl: 'https://www.myntra.com/kids-jeans',
    names: [
      'Regular Fit Jeans',
      'Distressed Denim Jeans',
      'Elastic Waist Jeans',
      'Skinny Fit Jeans',
      'Dungaree Jeans',
      'Straight Fit Jeans',
      'Cargo Denim Pants',
      'Stretch Jeggings',
    ],
    images: [IMG.jeansIndigo, IMG.jeansStoreWall],
    priceMin: 399,
    priceMax: 1299,
    colors: ['indigo', 'black', 'light blue'],
    sizes: ['3-4Y', '5-6Y', '7-8Y'],
  },
  {
    audience: 'kids',
    category: 'shorts',
    brand: 'Myntra Kids',
    retailerUrl: 'https://www.myntra.com/kids-shorts',
    names: [
      'Cotton Shorts',
      'Denim Shorts',
      'Cargo Shorts',
      'Printed Beach Shorts',
      'Dungaree Shorts',
      'Track Shorts',
      'Chino Shorts',
      'Bermuda Shorts',
    ],
    images: [IMG.kidsRaincoatBackpack, IMG.kidsCoordMint],
    priceMin: 299,
    priceMax: 999,
    colors: ['khaki', 'denim', 'navy'],
    sizes: ['3-4Y', '5-6Y', '7-8Y'],
  },
  {
    audience: 'kids',
    category: 'party-wear',
    brand: 'Myntra Kids',
    retailerUrl: 'https://www.myntra.com/kids-partywear',
    names: [
      'Festive Ethnic Set',
      'Sequin Party Dress',
      'Bow-Tie Suit Set',
      'Velvet Occasion Dress',
      'Embellished Lehenga',
      'Tuxedo Suit Set',
      'Net Tutu Dress',
      'Brocade Sherwani',
    ],
    images: [IMG.kidsEthnicGold, IMG.kidsDressYellow],
    priceMin: 799,
    priceMax: 2999,
    colors: ['gold', 'red', 'ivory'],
    sizes: ['3-4Y', '5-6Y', '7-8Y'],
  },
  {
    audience: 'kids',
    category: 'school-wear',
    brand: 'Myntra Kids',
    retailerUrl: 'https://www.myntra.com/kids-clothing-sets',
    names: [
      'School Uniform Shirt & Trouser Set',
      'Pinafore School Dress',
      'School PE Track Suit',
      'Formal School Shirt',
      'Pleated School Skirt',
      'School Sweater',
      'Everyday Cotton Set',
      'School Trouser Set',
    ],
    images: [IMG.kidsRaincoatBackpack, IMG.kidsTeeBoyBlue],
    priceMin: 399,
    priceMax: 1499,
    colors: ['navy', 'white', 'grey'],
    sizes: ['4-5Y', '6-7Y', '8-9Y', '10-11Y'],
  },
  {
    audience: 'kids',
    category: 'footwear',
    brand: 'Myntra Kids',
    retailerUrl: 'https://www.myntra.com/kids-shoes',
    names: [
      'Velcro Sneakers',
      'School Shoes',
      'Sandals',
      'Canvas Shoes',
      'Sports Shoes',
      'Ballet Flats',
      'Rain Boots',
      'Slip-On Shoes',
    ],
    images: [IMG.kidsShoesWhite, IMG.sneakersRedBlack],
    priceMin: 299,
    priceMax: 1499,
    colors: ['white', 'black', 'pink'],
    sizes: ['28', '30', '32', '34'],
  },
  {
    audience: 'kids',
    category: 'accessories',
    brand: 'Myntra Kids',
    retailerUrl: 'https://www.myntra.com/kids-accessories',
    names: [
      'Mini School Backpack',
      'Beaded Bracelet Set',
      'Printed Socks Pack',
      'Sun Hat',
      'Hair Clips Set',
      'Kids Sunglasses',
      'Water Bottle Bag',
      'Baseball Cap',
    ],
    images: [IMG.kidsBraceletMulti, IMG.backpackNavy],
    priceMin: 149,
    priceMax: 999,
    colors: ['multi', 'red', 'blue'],
  },
];

function buildDemoFeed(seeds: CategorySeed[]): DemoItem[] {
  const items: DemoItem[] = [];

  for (const seed of seeds) {
    const audiencePrefix = seed.audience[0];
    const count = seed.names.length;

    seed.names.forEach((name, idx) => {
      const id = `${audiencePrefix}-${seed.category}-${String(idx + 1).padStart(2, '0')}`;
      const priceStep = count > 1 ? (seed.priceMax - seed.priceMin) / (count - 1) : 0;
      const price = Math.round(seed.priceMin + priceStep * idx);
      const onSale = idx % 3 === 0;
      const originalPrice = onSale ? Math.round(price * 1.3) : undefined;
      const image = seed.images[idx % seed.images.length];
      const color = seed.colors?.[idx % seed.colors.length];
      const brand = seed.brands?.length ? seed.brands[idx % seed.brands.length] : seed.brand;
      const separator = seed.retailerUrl.includes('?') ? '&' : '?';
      const url = `${seed.retailerUrl}${separator}ref=persona-${id}`;

      items.push({
        id,
        name,
        brand,
        category: seed.category,
        audience: seed.audience,
        price,
        originalPrice,
        url,
        image,
        color,
        sizes: seed.sizes,
      });
    });
  }

  return items;
}

/**
 * Partner catalog used when live retailer scraping is blocked (Akamai/bot walls).
 * Destination URLs point at real retailer category/search pages so "Go to retailer" works.
 * Generated from CATEGORY_SEEDS so every audience/category in the canonical taxonomy
 * (see taxonomy.ts / taxonomy.service.ts / categories.py) has multiple products.
 * Replace with DEMO_AFFILIATE_FEED_URL or ENABLE_*_SCRAPE workers in production.
 */
const DEMO_FEED: DemoItem[] = buildDemoFeed(CATEGORY_SEEDS);

export class DemoAffiliateAdapter implements SourceAdapter {
  sourceId = 'demo-affiliate';
  mode = 'affiliate_feed' as const;

  async fetchProducts(options?: { checkpoint?: string; limit?: number }): Promise<SourceFetchResult> {
    const feedUrl = process.env.DEMO_AFFILIATE_FEED_URL;
    let items = DEMO_FEED;

    if (feedUrl) {
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch demo feed: ${response.status}`);
      }
      items = (await response.json()) as DemoItem[];
    }

    const audienceFilter = process.env.DEMO_FEED_AUDIENCE as Audience | undefined;
    if (audienceFilter) {
      items = items.filter((item) => item.audience === audienceFilter);
    }

    const limit = options?.limit || items.length;
    const sliced = items.slice(0, limit);

    const products = sliced.map((item) => {
      const checksum = createHash('sha256')
        .update(`${item.id}:${item.price}:${item.url}`)
        .digest('hex');

      return {
        externalProductId: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        audience: item.audience,
        price: item.price,
        originalPrice: item.originalPrice,
        currency: 'INR',
        sellerUrl: item.url,
        affiliateUrl: item.url,
        imageUrls: [item.image],
        availability: 'in_stock' as const,
        color: item.color,
        sizes: item.sizes,
        description: item.description,
        rawChecksum: checksum,
      };
    });

    return { products, checkpoint: String(sliced.length) };
  }
}

export { DEMO_FEED };
