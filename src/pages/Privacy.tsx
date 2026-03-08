import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated: January 2025</p>

        <div className="mt-12 space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Information we collect</h2>
            <p className="mt-2">
              We collect information you provide (email, name, company) and usage data necessary to
              operate and improve the service. We do not sell your data.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">2. How we use it</h2>
            <p className="mt-2">
              We use your data to provide the service, communicate with you, and improve our
              product. We process data in compliance with GDPR and similar regulations.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Data retention</h2>
            <p className="mt-2">
              We retain your data while your account is active. Upon deletion, we remove or
              anonymize your data according to our retention policy.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Cookies</h2>
            <p className="mt-2">
              We use essential cookies to run the service (e.g. session, preferences). We may use
              optional analytics cookies to improve the product. You can accept or decline non-essential
              cookies via the cookie banner. See your browser settings to manage cookies.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Your rights</h2>
            <p className="mt-2">
              You may access, correct, or delete your data. You may export your data and request
              portability. Contact us to exercise your rights.
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          For questions about privacy, please <Link to="/contact" className="text-primary hover:underline">contact us</Link>.
        </p>
      </div>
    </div>
  );
}
