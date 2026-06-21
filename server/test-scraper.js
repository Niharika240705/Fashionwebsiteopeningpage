// Quick test script to check scraping functionality
const { ScrapingOrchestratorService } = require('./dist/services/scraping-orchestrator.service');

async function testScraping() {
  console.log('🧪 Testing scraping service...');
  
  const orchestrator = new ScrapingOrchestratorService();
  
  try {
    // Test with a simple, publicly accessible test page
    // Note: Real e-commerce sites may block automated access
    console.log('Starting scrape test...');
    
    const products = await orchestrator.scrapeAndProcess(
      'myntra',
      'https://www.myntra.com/men-tshirts'
    );
    
    console.log(`✅ Scraped ${products.length} products`);
    products.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} - ${p.brand} - ₹${p.price}`);
    });
  } catch (error) {
    console.error('❌ Scraping error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testScraping();

