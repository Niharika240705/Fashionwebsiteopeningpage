import { IProduct, Product } from '../models/Product.model';

export interface TrendFactors {
  appearanceCount: number;
  discountPercentage: number;
  categoryPopularity: number;
  recency: number; // How recently the product was seen
  crossSitePresence: number; // How many different sites it appears on
}

/**
 * Trend Detection Service
 * Calculates trend scores for products based on multiple factors
 */
export class TrendDetectionService {
  /**
   * Calculate trend score for a product
   * Score ranges from 0-100, higher = more trending
   */
  async calculateTrendScore(product: IProduct): Promise<number> {
    const factors = await this.analyzeTrendFactors(product);
    
    // Weighted scoring system
    const weights = {
      appearanceCount: 0.25,      // 25% - how often seen
      discountPercentage: 0.20,   // 20% - discount appeal
      categoryPopularity: 0.20,   // 20% - category trend
      recency: 0.20,              // 20% - how recent
      crossSitePresence: 0.15,    // 15% - multi-site presence
    };

    // Normalize each factor to 0-100 scale
    const normalizedFactors = {
      appearanceCount: this.normalizeAppearanceCount(factors.appearanceCount),
      discountPercentage: Math.min(factors.discountPercentage, 100),
      categoryPopularity: factors.categoryPopularity * 100,
      recency: this.normalizeRecency(factors.recency),
      crossSitePresence: this.normalizeCrossSitePresence(factors.crossSitePresence),
    };

    // Calculate weighted score
    const trendScore =
      normalizedFactors.appearanceCount * weights.appearanceCount +
      normalizedFactors.discountPercentage * weights.discountPercentage +
      normalizedFactors.categoryPopularity * weights.categoryPopularity +
      normalizedFactors.recency * weights.recency +
      normalizedFactors.crossSitePresence * weights.crossSitePresence;

    return Math.round(Math.min(Math.max(trendScore, 0), 100));
  }

  /**
   * Analyze trend factors for a product
   */
  private async analyzeTrendFactors(product: IProduct): Promise<TrendFactors> {
    // Get similar products (same name/brand) across different sites
    const similarProducts = await Product.find({
      $or: [
        { name: { $regex: new RegExp(product.name.split(' ').slice(0, 3).join(' '), 'i') } },
        { brand: product.brand, category: product.category },
      ],
    }).lean();

    // Count appearances across different sites
    const uniqueSites = new Set(similarProducts.map((p) => p.sourceWebsite));
    const appearanceCount = similarProducts.length;
    const crossSitePresence = uniqueSites.size;

    // Get category popularity (how many products in this category recently)
    const categoryPopularity = await this.getCategoryPopularity(product.category);

    // Calculate recency (days since last seen)
    const daysSinceLastSeen = Math.floor(
      (Date.now() - product.lastScraped.getTime()) / (1000 * 60 * 60 * 24)
    );
    const recency = Math.max(0, 7 - daysSinceLastSeen) / 7; // Normalize to 0-1

    return {
      appearanceCount,
      discountPercentage: product.discountPercentage || 0,
      categoryPopularity,
      recency,
      crossSitePresence,
    };
  }

  /**
   * Get category popularity score (0-1)
   * Based on number of products in category seen in last 7 days
   */
  private async getCategoryPopularity(category: string): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentProductsInCategory = await Product.countDocuments({
      category,
      lastScraped: { $gte: sevenDaysAgo },
    });

    // Normalize: assume 100+ products in a category in 7 days = very popular (1.0)
    return Math.min(recentProductsInCategory / 100, 1.0);
  }

  /**
   * Normalize appearance count to 0-100 scale
   */
  private normalizeAppearanceCount(count: number): number {
    // Logarithmic scaling: 1 = 10, 10 = 50, 100+ = 100
    if (count <= 1) return 10;
    if (count <= 10) return 10 + (count - 1) * 4.44; // Linear from 10 to 50
    return Math.min(50 + Math.log10(count / 10) * 25, 100);
  }

  /**
   * Normalize recency to 0-100 scale
   */
  private normalizeRecency(recency: number): number {
    return recency * 100;
  }

  /**
   * Normalize cross-site presence to 0-100 scale
   */
  private normalizeCrossSitePresence(siteCount: number): number {
    // 1 site = 20, 2 sites = 60, 3+ sites = 100
    if (siteCount === 1) return 20;
    if (siteCount === 2) return 60;
    return 100;
  }

  /**
   * Update trend scores for all products
   * Should be run periodically (e.g., daily)
   */
  async updateAllTrendScores(): Promise<void> {
    const products = await Product.find({});
    let updated = 0;

    for (const product of products) {
      try {
        const trendScore = await this.calculateTrendScore(product);
        await Product.updateOne(
          { _id: product._id },
          { $set: { trendScore } }
        );
        updated++;
      } catch (error) {
        console.error(`Error updating trend score for product ${product._id}:`, error);
      }
    }

    console.log(`✅ Updated trend scores for ${updated} products`);
  }

  /**
   * Get trending products based on category
   */
  async getTrendingByCategory(category?: string, limit: number = 20): Promise<IProduct[]> {
    const query: any = { trendScore: { $gt: 0 } };
    if (category) {
      query.category = category;
    }

    return await Product.find(query)
      .sort({ trendScore: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get trending categories
   */
  async getTrendingCategories(limit: number = 10): Promise<Array<{ category: string; avgTrendScore: number; count: number }>> {
    const result = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          avgTrendScore: { $avg: '$trendScore' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { avgTrendScore: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          category: '$_id',
          avgTrendScore: { $round: ['$avgTrendScore', 2] },
          count: 1,
          _id: 0,
        },
      },
    ]);

    return result;
  }
}

