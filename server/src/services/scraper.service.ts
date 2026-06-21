import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import axios from 'axios';

export interface ScrapedProduct {
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  discountPercentage?: number;
  images: string[];
  productUrl: string;
  sourceWebsite: string;
  metadata?: {
    color?: string;
    size?: string[];
    material?: string;
    description?: string;
  };
}

export interface ScraperConfig {
  baseUrl: string;
  selectors: {
    productCard: string;
    name: string;
    brand: string;
    price: string;
    originalPrice?: string;
    image: string;
    productLink: string;
  };
  rateLimitDelay: number; // milliseconds between requests
  maxProducts?: number;
}

/**
 * Base scraper class with common functionality
 */
export class BaseScraper {
  protected browser: Browser | null = null;
  protected config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  /**
   * Initialize browser instance
   */
  async init(): Promise<void> {
    if (!this.browser) {
      // Enable debug mode via environment variable
      const debugMode = process.env.SCRAPER_DEBUG === 'true';
      const headless = !debugMode;
      const slowMo = debugMode ? 100 : undefined;

      console.log(`🌐 Initializing browser (headless: ${headless}${slowMo ? `, slowMo: ${slowMo}ms` : ''})`);

      this.browser = await chromium.launch({
        headless,
        slowMo,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Check robots.txt compliance
   */
  async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const robotsUrl = new URL('/robots.txt', url).toString();
      const response = await axios.get(robotsUrl, { timeout: 5000 });
      // Simple check - in production, use a proper robots.txt parser
      return response.status === 200;
    } catch {
      return true; // If robots.txt doesn't exist, proceed
    }
  }

  /**
   * Rate limiting delay
   */
  async delay(ms: number = this.config.rateLimitDelay): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Extract category from product name or URL
   */
  protected extractCategory(name: string, url: string): string {
    const nameLower = name.toLowerCase();
    const urlLower = url.toLowerCase();

    const categories = [
      't-shirt', 'tshirt', 'shirt',
      'dress', 'gown',
      'jeans', 'pants', 'trousers',
      'jacket', 'coat',
      'sweater', 'hoodie',
      'shorts',
      'skirt',
      'top', 'blouse',
      'shoes', 'sneakers', 'boots',
      'bag', 'handbag',
      'accessories', 'jewelry',
    ];

    for (const category of categories) {
      if (nameLower.includes(category) || urlLower.includes(category)) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Normalize price string to number
   */
  protected normalizePrice(priceText: string): number {
    const cleaned = priceText.replace(/[^\d.,]/g, '');
    const price = parseFloat(cleaned.replace(',', ''));
    return isNaN(price) ? 0 : price;
  }

  /**
   * Calculate discount percentage
   */
  protected calculateDiscount(original: number, current: number): number {
    if (original <= current || original === 0) return 0;
    return Math.round(((original - current) / original) * 100);
  }
}

/**
 * Generic scraper using Playwright for dynamic content
 */
export class PlaywrightScraper extends BaseScraper {
  /**
   * Scrape products from a listing page
   */
  async scrapeProducts(listingUrl: string): Promise<ScrapedProduct[]> {
    if (!this.browser) {
      await this.init();
    }

    const products: ScrapedProduct[] = [];
    const page = await this.browser!.newPage();

    const screenshotDir = 'debug-screenshots';
    const timestamp = Date.now();
    let screenshotIndex = 0;

    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📄 [${new Date().toISOString()}] Starting scrape for: ${listingUrl}`);
      console.log(`📋 Base URL: ${this.config.baseUrl}`);
      console.log(`🎯 Primary selector: ${this.config.selectors.productCard}`);
      console.log(`${'='.repeat(60)}\n`);
      
      // Set user agent via context (Playwright way)
      const context = page.context();
      await context.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });

      // Set viewport to look more like a real browser
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Navigate to listing page
      console.log(`⏳ Navigating to page...`);
      const navigationStart = Date.now();
      const response = await page.goto(listingUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });
      const navigationTime = Date.now() - navigationStart;

      if (!response || !response.ok()) {
        const errorMsg = `❌ Failed to load page: ${response?.status()} ${response?.statusText()}`;
        console.error(errorMsg);
        const screenshotPath = `${screenshotDir}/error-navigation-${timestamp}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        console.log(`📸 Screenshot saved: ${screenshotPath}`);
        return products;
      }

      console.log(`✅ Page loaded successfully (${response.status()}) in ${navigationTime}ms`);
      console.log(`📄 Final URL: ${page.url()}`);

      // Wait for dynamic content to load (Myntra uses React/lazy loading)
      console.log(`⏳ Waiting for dynamic content to load...`);
      await page.waitForTimeout(3000);
      
      // Wait for network to be idle (important for Myntra)
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log(`✅ Network idle - content should be loaded`);
      } catch (e) {
        console.log(`⚠️ Network idle timeout, continuing anyway...`);
      }

      // Myntra-specific selector fallbacks (only for Myntra)
      const isMyntra = this.config.baseUrl.includes('myntra.com');
      let productCardsLocator: any = null;
      
      // Build selector list - Myntra-specific fallbacks first, then generic
      const possibleSelectors = isMyntra ? [
        this.config.selectors.productCard, // Primary: [data-product-id]
        '[data-product-id]', // Myntra's standard product card
        '.product-base', // Myntra product base class
        'li[class*="product"]', // Generic product list item
        'article[class*="product"]', // Article-based products
        '[class*="ProductCard"]', // React component class
        '[data-testid*="product"]', // Test ID fallback
      ] : [
        this.config.selectors.productCard, // Primary selector
        'article[class*="product"]', // Generic article
        '[class*="product"]', // Generic product class
        '[class*="item"]', // Generic item class
      ];

      console.log(`\n🔍 Searching for product cards with ${possibleSelectors.length} selector(s)...`);
      
      for (let i = 0; i < possibleSelectors.length; i++) {
        const selector = possibleSelectors[i];
        try {
          console.log(`  [${i + 1}/${possibleSelectors.length}] Trying selector: "${selector}"`);
          await page.waitForSelector(selector, { timeout: 5000 });
          productCardsLocator = page.locator(selector);
          const cardCount = await productCardsLocator.count();
          
          if (cardCount > 0) {
            console.log(`  ✅ SUCCESS: Found ${cardCount} product cards using selector: "${selector}"`);
            break;
          } else {
            console.log(`  ⚠️  Selector found but returned 0 cards`);
          }
        } catch (e: any) {
          console.log(`  ❌ Selector not found or timeout: ${e.message?.substring(0, 50) || 'Unknown error'}`);
          continue;
        }
      }

      const cardCount = productCardsLocator ? await productCardsLocator.count() : 0;

      if (cardCount === 0) {
        console.error(`\n❌ CRITICAL: No product cards found with any of ${possibleSelectors.length} selector(s)`);
        console.error(`📸 Taking debug screenshot...`);
        
        const screenshotPath = `${screenshotDir}/no-products-${timestamp}.png`;
        try {
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.error(`📸 Screenshot saved: ${screenshotPath}`);
        } catch (screenshotError) {
          console.error(`❌ Failed to save screenshot: ${screenshotError}`);
        }
        
        // Also save page HTML for debugging
        try {
          const html = await page.content();
          const fs = require('fs');
          const path = require('path');
          if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
          }
          fs.writeFileSync(`${screenshotDir}/no-products-${timestamp}.html`, html);
          console.error(`📄 HTML saved: ${screenshotDir}/no-products-${timestamp}.html`);
        } catch (htmlError) {
          console.error(`❌ Failed to save HTML: ${htmlError}`);
        }
        
        return products;
      }

      const maxProducts = this.config.maxProducts || cardCount;
      const productsToProcess = Math.min(maxProducts, cardCount);
      console.log(`\n🔄 Processing ${productsToProcess} products (max: ${maxProducts}, found: ${cardCount})...\n`);

      let successCount = 0;
      let skipCount = 0;
      const skipReasons: Record<string, number> = {};

      // Helper function to extract text using evaluate (non-blocking, handles lazy DOM)
      const extractText = async (locator: any, selectors: string[]): Promise<string> => {
        for (const selector of selectors) {
          try {
            const text = await locator.locator(selector).first().evaluate((el: any) => {
              return el?.textContent?.trim() || '';
            }).catch(() => '');
            if (text) return text;
          } catch (e) {
            continue;
          }
        }
        return '';
      };

      // Helper function to extract attribute using evaluate
      const extractAttribute = async (locator: any, selector: string, attribute: string): Promise<string> => {
        try {
          return await locator.locator(selector).first().evaluate((el: any, attr: string) => {
            return el?.getAttribute?.(attr) || '';
          }, attribute).catch(() => '');
        } catch (e) {
          return '';
        }
      };

      for (let i = 0; i < productsToProcess; i++) {
        const productNum = i + 1;
        try {
          const card = productCardsLocator.nth(i);
          console.log(`  [${productNum}/${productsToProcess}] Extracting product data...`);
          
          // Scroll card into view to ensure lazy-rendered content loads
          try {
            await card.scrollIntoViewIfNeeded({ timeout: 3000 });
            // Small delay to allow content to render after scroll
            await page.waitForTimeout(200);
          } catch (scrollError) {
            console.log(`    ⚠️  Scroll timeout for product ${productNum}, continuing...`);
          }
          
          // Extract product data with Myntra-specific fallback selectors using evaluate
          const nameSelectors = isMyntra ? [
            this.config.selectors.name, // Primary: .product-product
            '.product-product', // Myntra product name class
            '.product-brand + .product-product', // Adjacent to brand
            'h3', 'h4', // Generic headings
            '[class*="product-name"]', '[class*="product-title"]', // Generic name classes
          ] : [
            this.config.selectors.name,
            'h2', 'h3', '[class*="name"]', '[class*="title"]',
          ];

          const name = await extractText(card, nameSelectors);

          const brandSelectors = isMyntra ? [
            this.config.selectors.brand, // Primary: .product-brand
            '.product-brand', // Myntra brand class
            '[class*="brand"]', // Generic brand class
          ] : [
            this.config.selectors.brand,
            '[class*="brand"]',
          ];

          let brand = await extractText(card, brandSelectors);

          // Fallback brand for Myntra (extract from URL or use site name)
          if (!brand && isMyntra) {
            brand = 'H&M'; // Default for H&M products on Myntra, can be extracted from URL filters
          }
          if (!brand) {
            brand = this.config.baseUrl.split('//')[1]?.split('/')[0] || 'Unknown';
          }

          const priceSelectors = isMyntra ? [
            this.config.selectors.price, // Primary: .product-price
            '.product-price', // Myntra price class
            '.product-discountedPrice', // Discounted price
            '[class*="price"]', '[data-testid*="price"]', // Generic price classes
          ] : [
            this.config.selectors.price,
            '[class*="price"]', '[data-testid*="price"]',
          ];

          const priceText = await extractText(card, priceSelectors);
          const price = this.normalizePrice(priceText);

          // Get product link with Myntra-specific fallback using evaluate
          let productUrl = '';
          const linkSelectors = isMyntra ? [
            this.config.selectors.productLink, // Primary: a
            'a[href*="/"]', // Any link with href
            'a', // Any anchor tag
          ] : [
            this.config.selectors.productLink,
            'a',
          ];

          for (const selector of linkSelectors) {
            try {
              productUrl = await extractAttribute(card, selector, 'href');
              if (productUrl) break;
            } catch (e) {
              continue;
            }
          }
          
          const fullProductUrl = productUrl && productUrl.startsWith('http') 
            ? productUrl 
            : productUrl 
            ? new URL(productUrl, this.config.baseUrl).toString()
            : listingUrl; // Fallback to listing URL if no product URL found

          // Get images with Myntra-specific attribute attempts using evaluate
          const images: string[] = [];
          const imageAttributes = ['src', 'data-src', 'data-lazy-src', 'data-original', 'data-image'];
          
          // Extract images using evaluate to avoid timeout on lazy-loaded images
          const extractImages = async (imgSelector: string): Promise<string[]> => {
            try {
              const imageUrls = await card.locator(imgSelector).evaluateAll((imgs: any[], attrs: string[], baseUrl: string) => {
                const urls: string[] = [];
                for (const img of imgs) {
                  for (const attr of attrs) {
                    const src = img?.getAttribute?.(attr) || img?.src || '';
                    if (src && !src.includes('placeholder') && !src.includes('data:image') && !src.includes('base64')) {
                      const fullUrl = src.startsWith('http') ? src : new URL(src, baseUrl).toString();
                      urls.push(fullUrl);
                      break; // Found image, move to next
                    }
                  }
                }
                return urls;
              }, imageAttributes, this.config.baseUrl).catch(() => []);
              
              return imageUrls || [];
            } catch (e) {
              return [];
            }
          };

          // Try primary image selector
          const primaryImages = await extractImages(this.config.selectors.image);
          images.push(...primaryImages);

          // If no images found, try alternative selector
          if (images.length === 0) {
            const altImages = await extractImages('img');
            images.push(...altImages);
          }

          // Extract original price if available using evaluate
          let originalPrice: number | undefined;
          if (this.config.selectors.originalPrice) {
            const originalPriceText = await extractText(card, [this.config.selectors.originalPrice]);
            if (originalPriceText) {
              originalPrice = this.normalizePrice(originalPriceText);
            }
          }

          const discount = originalPrice ? originalPrice - price : undefined;
          const discountPercentage = originalPrice 
            ? this.calculateDiscount(originalPrice, price) 
            : undefined;

          const category = this.extractCategory(name, fullProductUrl);

          // Validation with detailed logging
          const validationIssues: string[] = [];
          if (!name) validationIssues.push('name');
          if (price <= 0) validationIssues.push('price');
          if (images.length === 0) validationIssues.push('images');

          if (name && price > 0) {
            products.push({
              name: name.trim(),
              brand: brand.trim() || this.config.baseUrl.split('//')[1]?.split('/')[0] || 'Unknown',
              category,
              price,
              originalPrice,
              discount,
              discountPercentage,
              images: images.length > 0 ? images : ['https://via.placeholder.com/400x600?text=No+Image'],
              productUrl: fullProductUrl,
              sourceWebsite: this.config.baseUrl,
              metadata: {
                description: name,
              },
            });
            successCount++;
            const namePreview = name.length > 40 ? name.substring(0, 40) + '...' : name;
            console.log(`    ✅ [${productNum}] "${namePreview}" | Brand: ${brand} | Price: ₹${price} | Images: ${images.length}`);
          } else {
            skipCount++;
            const reason = `missing ${validationIssues.join(', ')}`;
            skipReasons[reason] = (skipReasons[reason] || 0) + 1;
            console.log(`    ⚠️  [${productNum}] SKIPPED: ${reason} (name: ${name ? '✓' : '✗'}, price: ₹${price}, images: ${images.length})`);
          }

          // Rate limiting
          await this.delay();
        } catch (error: any) {
          skipCount++;
          skipReasons['extraction error'] = (skipReasons['extraction error'] || 0) + 1;
          console.error(`    ❌ [${productNum}] ERROR: ${error.message?.substring(0, 100) || 'Unknown error'}`);
          continue;
        }
      }

      // Summary logging
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 SCRAPING SUMMARY`);
      console.log(`   ✅ Successfully extracted: ${successCount} products`);
      console.log(`   ⚠️  Skipped: ${skipCount} products`);
      if (Object.keys(skipReasons).length > 0) {
        console.log(`   📋 Skip reasons:`);
        Object.entries(skipReasons).forEach(([reason, count]) => {
          console.log(`      - ${reason}: ${count}`);
        });
      }
      console.log(`   📦 Total products array: ${products.length}`);
      console.log(`${'='.repeat(60)}\n`);
    } catch (error: any) {
      console.error(`\n❌ CRITICAL ERROR during scraping:`);
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack?.substring(0, 500)}`);
      
      // Save error screenshot
      try {
        const screenshotPath = `${screenshotDir}/error-critical-${timestamp}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.error(`📸 Error screenshot saved: ${screenshotPath}`);
      } catch (screenshotError) {
        console.error(`❌ Failed to save error screenshot: ${screenshotError}`);
      }
    } finally {
      await page.close();
      console.log(`🔒 Page closed\n`);
    }

    return products;
  }
}

/**
 * Static HTML scraper using Cheerio (faster, no browser needed)
 */
export class StaticScraper extends BaseScraper {
  /**
   * Scrape products from static HTML
   */
  async scrapeProducts(listingUrl: string): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];

    try {
      const response = await axios.get(listingUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000,
      });

      const $ = cheerio.load(response.data);
      const productCards = $(this.config.selectors.productCard);

      const maxProducts = this.config.maxProducts || productCards.length;

      productCards.slice(0, maxProducts).each((_, element) => {
        try {
          const $card = $(element);
          
          const name = $card.find(this.config.selectors.name).first().text().trim();
          const brand = $card.find(this.config.selectors.brand).first().text().trim();
          const priceText = $card.find(this.config.selectors.price).first().text().trim();
          const price = this.normalizePrice(priceText);

          const linkElement = $card.find(this.config.selectors.productLink).first();
          const productUrl = linkElement.attr('href') || '';
          const fullProductUrl = productUrl.startsWith('http') 
            ? productUrl 
            : new URL(productUrl, this.config.baseUrl).toString();

          const images: string[] = [];
          $card.find(this.config.selectors.image).each((_, img) => {
            const src = $(img).attr('src') || $(img).attr('data-src') || '';
            if (src) {
              const fullImageUrl = src.startsWith('http') 
                ? src 
                : new URL(src, this.config.baseUrl).toString();
              images.push(fullImageUrl);
            }
          });

          let originalPrice: number | undefined;
          if (this.config.selectors.originalPrice) {
            const originalPriceText = $card
              .find(this.config.selectors.originalPrice)
              .first()
              .text()
              .trim();
            if (originalPriceText) {
              originalPrice = this.normalizePrice(originalPriceText);
            }
          }

          const discount = originalPrice ? originalPrice - price : undefined;
          const discountPercentage = originalPrice 
            ? this.calculateDiscount(originalPrice, price) 
            : undefined;

          const category = this.extractCategory(name, fullProductUrl);

          if (name && brand && price > 0 && images.length > 0) {
            products.push({
              name,
              brand,
              category,
              price,
              originalPrice,
              discount,
              discountPercentage,
              images,
              productUrl: fullProductUrl,
              sourceWebsite: this.config.baseUrl,
              metadata: {
                description: name,
              },
            });
          }
        } catch (error) {
          console.error('Error parsing product card:', error);
        }
      });
    } catch (error) {
      console.error('Error fetching page:', error);
    }

    return products;
  }
}

/**
 * Factory function to create scrapers for different websites
 */
export class ScraperFactory {
  static createMyntraScraper(maxProducts: number = 50): PlaywrightScraper {
    return new PlaywrightScraper({
      baseUrl: 'https://www.myntra.com',
      selectors: {
        // Myntra-specific selectors (tested and optimized)
        productCard: '[data-product-id]', // Myntra's standard product card identifier
        name: '.product-product', // Product name/title
        brand: '.product-brand', // Brand name
        price: '.product-price', // Current price (or discounted price)
        originalPrice: '.product-strike', // Original/strikethrough price
        image: 'img', // Product images
        productLink: 'a', // Product detail page link
      },
      rateLimitDelay: 2000, // 2 seconds between requests (respectful rate limiting)
      maxProducts, // Maximum products to scrape per run
    });
  }

  static createHMScraper(maxProducts: number = 50): PlaywrightScraper {
    return new PlaywrightScraper({
      baseUrl: 'https://www2.hm.com',
      selectors: {
        productCard: 'li[class*="product"], article[class*="product"], .product-item, [data-product-id]',
        name: 'h3, .item-heading, [class*="name"], [class*="title"]',
        brand: '.item-heading, [class*="brand"]', // H&M products are branded as H&M
        price: '.item-price, [class*="price"], [data-testid*="price"]',
        originalPrice: '.item-price-old, [class*="price-old"], [class*="original-price"]',
        image: 'img',
        productLink: 'a[href*="/product/"], a[href*="/en_in/"]',
      },
      rateLimitDelay: 2000,
      maxProducts,
    });
  }

  static createZaraScraper(maxProducts: number = 50): PlaywrightScraper {
    return new PlaywrightScraper({
      baseUrl: 'https://www.zara.com',
      selectors: {
        productCard: '.product',
        name: '.product-name',
        brand: '.product-name', // Zara products are branded as Zara
        price: '.price',
        image: 'img',
        productLink: 'a',
      },
      rateLimitDelay: 3000, // Zara is more strict, use longer delay
      maxProducts,
    });
  }
}

