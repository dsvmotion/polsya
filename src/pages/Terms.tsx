import { Link } from 'react-router-dom';
import { APP_NAME } from '@/lib/brand';

export default function Terms() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="mt-4 text-muted-foreground">Last updated: January 2025</p>

        <div className="mt-12 space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance</h2>
            <p className="mt-2">
              By accessing or using {APP_NAME}, you agree to be bound by these Terms of Service.
              If you do not agree, do not use the service.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Use of the Service</h2>
            <p className="mt-2">
              You may use {APP_NAME} for lawful purposes only. You are responsible for your
              account, your data, and compliance with applicable laws.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Subscription and Payment</h2>
            <p className="mt-2">
              Paid plans are billed according to the pricing in effect at the time of subscription.
              You may cancel at any time. Refunds are handled according to our billing policy.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Data and Privacy</h2>
            <p className="mt-2">
              Your data is yours. We process it as described in our{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          For questions about these terms, please <Link to="/contact" className="text-primary hover:underline">contact us</Link>.
        </p>
      </div>
    </div>
  );
}
