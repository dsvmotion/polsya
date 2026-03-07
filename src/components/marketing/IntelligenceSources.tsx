import { ScrollAnimation } from './ScrollAnimation';

/* ─── Inline SVG brand logos (real platform icons) ─── */
function BehanceLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.803 5.731c.589 0 1.119.051 1.605.155.483.103.895.273 1.243.508.343.235.611.547.804.939.187.39.28.863.28 1.412 0 .601-.126 1.101-.381 1.506-.256.401-.643.735-1.16 1.001.736.229 1.289.605 1.655 1.126.369.521.548 1.148.548 1.882 0 .601-.111 1.121-.334 1.555a3.16 3.16 0 01-.907 1.098c-.384.292-.831.505-1.35.645-.516.14-1.063.213-1.643.213H2V5.731h5.803zm-.351 4.972c.48 0 .878-.114 1.192-.345.313-.228.47-.591.47-1.084 0-.27-.05-.489-.151-.66a1.093 1.093 0 00-.403-.412 1.68 1.68 0 00-.588-.215 3.33 3.33 0 00-.697-.068H4.71v2.784h2.742zm.138 5.211c.268 0 .52-.029.754-.089.234-.058.437-.152.612-.282.173-.129.312-.297.414-.502.1-.204.152-.457.152-.762 0-.604-.163-1.04-.49-1.312-.326-.271-.762-.406-1.308-.406H4.71v3.353h2.88zm8.014-5.903c.853 0 1.594.16 2.223.484.627.323 1.145.761 1.551 1.317.404.554.7 1.192.883 1.915.184.722.254 1.486.208 2.289H15.37c.035.832.195 1.241.584 1.626.39.384.975.575 1.756.575.559 0 1.042-.141 1.451-.424.408-.283.66-.582.754-.899h2.466c-.413 1.276-.998 2.19-1.755 2.742-.759.553-1.676.829-2.754.829-.748 0-1.43-.121-2.042-.365a4.369 4.369 0 01-1.58-1.053c-.44-.46-.78-1.01-1.019-1.653-.241-.641-.363-1.352-.363-2.132 0-.756.118-1.454.354-2.094.236-.641.575-1.196 1.015-1.66.441-.466.969-.831 1.588-1.098.617-.266 1.313-.399 2.089-.399zm1.46 3.561c-.318-.338-.787-.506-1.408-.506-.403 0-.741.072-1.014.219-.272.146-.489.329-.653.547a2.143 2.143 0 00-.354.637 3.174 3.174 0 00-.128.519h4.678c-.09-.696-.803-1.079-1.121-1.416zM14.4 6.607h5.186v1.377H14.4V6.607z" />
    </svg>
  );
}

function DribbbleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.424 25.424 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.903 53.903 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.245.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" />
    </svg>
  );
}

function LinkedInLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function InstagramLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function ArtStationLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 17.723l2.027 3.505h.001a2.424 2.424 0 002.164 1.333h13.457l-2.792-4.838H0zm24-2.219a2.408 2.408 0 00-.443-1.356L14.634.921a2.424 2.424 0 00-2.091-1.213H9.538a2.424 2.424 0 00-2.091 1.213L2.134 10.862l2.792 4.838 5.17-8.953h.002l5.611 9.756h5.498a2.422 2.422 0 002.793-2.999z" />
    </svg>
  );
}

function PinterestLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24 18.635 24 24 18.633 24 12.013 24 5.393 18.635 0 12.017 0z" />
    </svg>
  );
}

function VimeoLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197a315.065 315.065 0 003.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.48 4.807z" />
    </svg>
  );
}

function AwwwardsLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.487 9.586l2.204 8.377 2.167-7.473.017-.063h2.17l2.182 7.529L15.428 9.586h2.257L14.03 21.418H11.86L9.677 14.03l-2.168 7.389H5.323L1.68 9.586h2.807zM22.32 9.586L18.68 21.418h-2.186l1.27-4.358-.002-.009 2.3-7.465h2.258z" />
    </svg>
  );
}

function CargoLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.28 9.6H14.4V0h8.88v9.6zM9.6 0H.72v9.6H9.6V0zM9.6 14.4H.72V24H9.6v-9.6zm4.8 0v9.6h8.88v-9.6H14.4z" />
    </svg>
  );
}

const sources = [
  { name: 'Behance', Logo: BehanceLogo, color: '#1769FF' },
  { name: 'Dribbble', Logo: DribbbleLogo, color: '#EA4C89' },
  { name: 'LinkedIn', Logo: LinkedInLogo, color: '#0A66C2' },
  { name: 'Instagram', Logo: InstagramLogo, color: '#E4405F' },
  { name: 'ArtStation', Logo: ArtStationLogo, color: '#13AFF0' },
  { name: 'Pinterest', Logo: PinterestLogo, color: '#BD081C' },
  { name: 'Vimeo', Logo: VimeoLogo, color: '#1AB7EA' },
  { name: 'Awwwards', Logo: AwwwardsLogo, color: '#2B3137' },
  { name: 'Cargo', Logo: CargoLogo, color: '#1A1A1A' },
];

const secondarySourceCount = 41; // "50+ sources" minus the 9 named

export function IntelligenceSources() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,white,hsl(245_30%_97%),white)]" />
      <ScrollAnimation>
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4">Data Sources</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            Enrich every creative profile with{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">50+ intelligence sources</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Pull portfolio work, awards, social presence, and style signals automatically
            from the platforms creatives use every day.
          </p>

          {/* Logo grid */}
          <div className="mt-14 grid grid-cols-3 sm:grid-cols-5 gap-4 max-w-3xl mx-auto">
            {sources.map((source, i) => (
              <ScrollAnimation key={source.name} delay={i * 0.04}>
                <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border border-gray-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group h-full">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ color: source.color }}>
                    <source.Logo className="w-7 h-7 opacity-70 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">{source.name}</span>
                </div>
              </ScrollAnimation>
            ))}
            {/* +N more badge */}
            <ScrollAnimation delay={sources.length * 0.04}>
              <div className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/60 shadow-sm hover:shadow-lg transition-all duration-200 h-full">
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">+{secondarySourceCount}</span>
                <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider">More sources</span>
              </div>
            </ScrollAnimation>
          </div>

          {/* Source categories */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {['Portfolio sites', 'Agency directories', 'Award databases', 'Social signals', 'Professional networks'].map((cat) => (
              <span key={cat} className="text-xs font-medium text-gray-400 bg-gray-100/80 px-3 py-1 rounded-full">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
