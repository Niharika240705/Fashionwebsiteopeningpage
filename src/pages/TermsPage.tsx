import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16">
      <p className="text-xs tracking-[0.2em] uppercase text-black/50 mb-3">Legal</p>
      <h1 className="text-3xl md:text-4xl mb-6">Terms & Conditions</h1>
      <p className="text-sm text-black/50 mb-10">Last updated: July 18, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-black/75">
        <section>
          <h2 className="text-lg text-black mb-2">Service description</h2>
          <p>
            PERSONA is a fashion discovery and affiliate referral platform. We showcase products
            sourced from approved partner feeds/APIs (and permitted sources only). When you click a
            product CTA, you are redirected to a third-party retailer to complete any purchase.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-black mb-2">No direct sales</h2>
          <p>
            We are not the seller of record. Orders, payments, shipping, returns, sizing, and
            customer support are handled exclusively by the retailer you are redirected to.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-black mb-2">Affiliate relationships</h2>
          <p>
            Some links are affiliate links. We may earn a commission if you purchase after clicking
            through. This does not change the price you pay.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-black mb-2">Accuracy of catalog information</h2>
          <p>
            Product images, prices, discounts, and availability are provided for discovery and may
            be delayed or incorrect. Always verify details on the retailer site before buying.
            UFind recommendations are styling guidance only, not a fit guarantee.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-black mb-2">Accounts and acceptable use</h2>
          <p>
            You are responsible for keeping your account credentials secure. Do not abuse scraping
            endpoints, attempt unauthorized admin access, or use the service for unlawful activity.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-black mb-2">Intellectual property</h2>
          <p>
            Site branding, original editorial content, and software belong to PERSONA or its
            licensors. Partner product imagery and trademarks belong to their respective owners and
            are used under applicable source agreements.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-black mb-2">Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, PERSONA is not liable for retailer transactions,
            product quality, delivery issues, or losses arising from reliance on catalog data shown
            on this site.
          </p>
        </section>
      </div>

      <Link to="/" className="inline-block mt-10 text-xs tracking-widest uppercase border border-black px-4 py-2">
        Back home
      </Link>
    </div>
  );
}
