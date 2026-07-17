import { ScraperFactory, ScrapedProduct } from './scraper.service';
import { ImageProcessingService, SupabaseStorageService } from './image-processing.service';
import { TrendDetectionService } from './trend-detection.service';
import { Product, IProduct } from '../models/Product.model';

/**
 * Orchestrator Service
 * Coordinates scraping, image processing, and trend detection
 */
export class ScrapingOrchestratorService {
  private imageProcessingService: ImageProcessingService;
  private trendDetectionService: TrendDetectionService;

  constructor() {
    const storageService = new SupabaseStorageService();
    this.imageProcessingService = new ImageProcessingService(storageService);
    this.trendDetectionService = new TrendDetectionService();
  }

  /**
   * Full pipeline: Scrape -> Process Images -> Save -> Calculate Trends
   */
  async scrapeAndProcess(
    scraperType: 'myntra' | 'hm' | 'zara',
    listingUrl: string,
    maxProducts?: number
  ): Promise<IProduct[]> {
    console.log(`🚀 Starting scrape for ${scraperType}...`);

    // 1. Create scraper and scrape products
    let scraper;
    switch (scraperType) {
      case 'myntra':
        scraper = ScraperFactory.createMyntraScraper(maxProducts);
        break;
      case 'hm':
        scraper = ScraperFactory.createHMScraper(maxProducts);
        break;
      case 'zara':
        scraper = ScraperFactory.createZaraScraper(maxProducts);
        break;
      default:
        throw new Error(`Unknown scraper type: ${scraperType}`);
    }

    await scraper.init();
    const scrapedProducts = await scraper.scrapeProducts(listingUrl);
    await scraper.close();

    console.log(`✅ Scraped ${scrapedProducts.length} products`);

    // 2. Process each product
    const savedProducts: IProduct[] = [];

    for (const scrapedProduct of scrapedProducts) {
      try {
        // Check if product already exists
        let product = await Product.findOne({ productUrl: scrapedProduct.productUrl });

        if (product) {
          // Update existing product
          product.lastScraped = new Date();
          product.appearanceCount += 1;
          
          // Update price if changed
          if (scrapedProduct.price !== product.price) {
            product.price = scrapedProduct.price;
            product.originalPrice = scrapedProduct.originalPrice;
            product.discount = scrapedProduct.discount;
            product.discountPercentage = scrapedProduct.discountPercentage;
          }
        } else {
          // Process images for new products
          console.log(`🖼️  Processing images for: ${scrapedProduct.name}`);
          const processedImages = await this.imageProcessingService.processImages(
            scrapedProduct.images,
            `product-${Date.now()}`
          );

          // Create new product
          product = new Product({
            name: scrapedProduct.name,
            brand: scrapedProduct.brand,
            category: scrapedProduct.category,
            price: scrapedProduct.price,
            originalPrice: scrapedProduct.originalPrice,
            discount: scrapedProduct.discount,
            discountPercentage: scrapedProduct.discountPercentage,
            images: {
              original: scrapedProduct.images,
              processed: processedImages,
              approved: processedImages,
            },
            productUrl: scrapedProduct.productUrl,
            canonicalUrl: scrapedProduct.productUrl,
            sourceWebsite: scrapedProduct.sourceWebsite,
            retailerId: scrapedProduct.sourceWebsite,
            audience: 'women',
            appearanceCount: 1,
            metadata: scrapedProduct.metadata,
          });
        }

        // Calculate trend score
        const trendScore = await this.trendDetectionService.calculateTrendScore(product);
        product.trendScore = trendScore;

        // Save product
        await product.save();
        savedProducts.push(product);

        console.log(`✅ Saved: ${product.name} (Trend Score: ${trendScore})`);
      } catch (error) {
        console.error(`❌ Error processing product ${scrapedProduct.name}:`, error);
        continue;
      }
    }

    console.log(`🎉 Completed! Saved ${savedProducts.length} products`);
    return savedProducts;
  }

  /**
   * Batch scrape from multiple sources
   */
  async batchScrape(configs: Array<{ type: 'myntra' | 'hm' | 'zara'; url: string; maxProducts?: number }>): Promise<void> {
    for (const config of configs) {
      try {
        await this.scrapeAndProcess(config.type, config.url, config.maxProducts);
        // Delay between different sources
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Error scraping ${config.type}:`, error);
      }
    }

    // Update all trend scores after batch scrape
    await this.trendDetectionService.updateAllTrendScores();
  }
}

