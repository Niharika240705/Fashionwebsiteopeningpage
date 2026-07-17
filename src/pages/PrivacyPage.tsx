import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16">
      <p className="text-xs tracking-[0.2em] uppercase text-black/50 mb-3">Legal</p>
      <h1 className="text-3xl md:text-4xl mb-6">Privacy Policy</h1>
      <p className="text-sm text-black/50 mb-10">Last updated: July 18, 2026</p>

      <div className="space-y-6 text-sm leading-relaxed text-black/75">
        <section>
          <h2 className="text-lg text-black mb-2">Who we are</h2>
          <p>
            PERSONA (“we”, “us”) operates a fashion discovery website that helps you browse
            partner retailer products and click through to purchase on those retailers’ sites.
            We do not sell products directly.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-black mb-2">Information we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Account details you provide (name, email) when you register.</li>
            <li>Saved product preferences stored in your account or on your device as a guest.</li>
            <li>
              Privacy-minimized click events when you use “Go to retailer” (offer/product IDs,
              placement, timestamp; no long-term raw IP storage).
            </li>
            <li>Optional analytics events if you enable cookies/analytics on the site.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg text-black mb-2">How we use information</h2>
          <p>
            We use your information to operate authentication, personalize saved items, improve
            discovery, measure affiliate click-throughs, and keep the service secure. Authentication
            tokens are stored in httpOnly cookies.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-black mb-2">Affiliate disclosure</h2>
          <p>
            We may earn a commission when you buy through links on our site. Product prices and
            availability are shown for discovery and may change on the retailer site.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-black mb-2">Third parties</h2>
          <p>
            Retailer destinations, authentication providers (for example Google OAuth when enabled),
            hosting, database, and image storage providers process data as needed to run the service.
            Their privacy policies apply when you leave our site.
          </p>
        </section>

        <section>
          <h2 className="text-lg text-black mb-2">Contact</h2>
          <p>
            For privacy requests, contact us through the Contact page once available, or the email
            listed on the deployed site.
          </p>
        </section>
      </div>

      <Link to="/" className="inline-block mt-10 text-xs tracking-widest uppercase border border-black px-4 py-2">
        Back home
      </Link>
    </div>
  );
}
