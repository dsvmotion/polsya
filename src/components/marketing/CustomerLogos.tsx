import { ScrollAnimation } from './ScrollAnimation';
import { Star } from 'lucide-react';

/* ─── Inline SVG brand logos (monochrome) ─── */
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

function FigmaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 8.943h-4.588c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM4.147 11.963c0 1.665 1.354 3.019 3.019 3.019h3.117V8.943H7.166c-1.665 0-3.019 1.355-3.019 3.02zm4.49 7.379c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v4.49c0 2.476-2.014 4.49-4.588 4.49zm-.471-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02 3.118-1.355 3.118-3.02-1.354-3.019-3.118-3.019zm7.686-1.472c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49 4.49 2.014 4.49 4.49-2.014 4.49-4.49 4.49zm0-7.51c-1.665 0-3.019 1.355-3.019 3.02s1.355 3.019 3.019 3.019 3.019-1.355 3.019-3.02c0-1.664-1.354-3.019-3.019-3.019z" />
    </svg>
  );
}

function AdobeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM8.884 1.376H0v21.248zm6.232 0H24v21.248z" />
    </svg>
  );
}

function WebflowLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.802 8.56s-1.946 6.094-2.048 6.399c-.052-.304-1.022-4.903-1.022-4.903A4.373 4.373 0 0010.618 7.1S8.497 13.234 8.4 13.537c-.005-.254-.316-5.932-.316-5.932A4.213 4.213 0 003.89 3.604L0 20.396h4.94s1.965-6.168 2.07-6.49c.045.279 1.017 4.946 1.017 4.946a4.357 4.357 0 004.086 2.958s2.262-6.675 2.368-6.992c-.003.244.373 5.579.373 5.579h4.945L24 8.614a4.31 4.31 0 00-6.198-.054z" />
    </svg>
  );
}

function FramerLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4 0h16v8h-8zM4 8h8l8 8H4zM4 16h8v8z" />
    </svg>
  );
}

function CanvaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.486 14.095c-.457 1.761-2.072 3.36-4.37 3.36-2.81 0-4.553-2.06-4.553-4.657 0-3.127 2.135-5.735 5.16-5.735 1.377 0 2.31.578 2.81 1.1.189.198.254.438.115.694l-.508.929c-.14.254-.373.312-.635.164-.41-.23-.852-.395-1.488-.395-1.702 0-3.003 1.529-3.003 3.404 0 1.382.83 2.544 2.397 2.544.862 0 1.57-.362 2.101-.927.205-.222.458-.272.693-.09l.795.58c.246.18.28.397.086.63z" />
    </svg>
  );
}

function NotionLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.12 2.14c-.42-.326-.98-.7-2.054-.607l-12.78.794c-.467.047-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.886.747-.933zM1.936 1.035l13.31-.84c1.635-.14 2.054-.046 3.082.7l4.25 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.632-1.68 1.726l-15.458.933c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.746-.793-1.306-.793-1.933V2.715c0-.793.373-1.54 1.446-1.68z" />
    </svg>
  );
}

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-7.076-2.19l-.89 5.549c1.953 1.089 5.555 1.962 8.333 1.962 2.602 0 4.735-.635 6.29-1.866C19.55 20.57 20.4 18.6 20.4 16.28c.001-4.407-2.593-5.862-6.424-7.13z" />
    </svg>
  );
}

function VercelLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1L24 22H0z" />
    </svg>
  );
}

function GitHubLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function MiroLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.392 0H13.9l4 6.667L8.2 0H4.725l4 10L0 0v24l4.725-10L4.725 24h3.5l9.692-17.333L13.9 24h3.5L24 6.667z" />
    </svg>
  );
}

/* ─── Logo row data ─── */
const logoRow1 = [
  { name: 'Behance', Logo: BehanceLogo },
  { name: 'Dribbble', Logo: DribbbleLogo },
  { name: 'Figma', Logo: FigmaLogo },
  { name: 'Adobe', Logo: AdobeLogo },
  { name: 'Webflow', Logo: WebflowLogo },
  { name: 'Framer', Logo: FramerLogo },
];

const logoRow2 = [
  { name: 'Canva', Logo: CanvaLogo },
  { name: 'Notion', Logo: NotionLogo },
  { name: 'Stripe', Logo: StripeLogo },
  { name: 'Vercel', Logo: VercelLogo },
  { name: 'GitHub', Logo: GitHubLogo },
  { name: 'Miro', Logo: MiroLogo },
];

/* ─── Review platforms ─── */
const reviewPlatforms = [
  { name: 'G2', rating: '4.9', reviews: '320+', color: 'text-orange-600 bg-orange-50 border-orange-100' },
  { name: 'Capterra', rating: '4.8', reviews: '180+', color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { name: 'Product Hunt', rating: '#1', reviews: 'Product of the Day', color: 'text-red-600 bg-red-50 border-red-100' },
];

/* ═══════════════════════════════════════════════════════ */
export function CustomerLogos() {
  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 border-y border-gray-100/80 bg-[linear-gradient(to_bottom,hsl(245_30%_98%),white)]">
      <ScrollAnimation>
        <div className="mx-auto max-w-6xl">
          {/* ── Trust label ── */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-8 text-center">
            Trusted by leading creative teams worldwide
          </p>

          {/* ── Review platform badges ── */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10">
            {reviewPlatforms.map((platform) => (
              <div key={platform.name} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${platform.color} text-xs font-medium`}>
                <span className="font-bold">{platform.name}</span>
                <div className="flex gap-0.5">
                  {platform.rating !== '#1' ? (
                    <>
                      <Star className="h-3 w-3 fill-current" />
                      <span>{platform.rating}</span>
                    </>
                  ) : (
                    <span>{platform.rating}</span>
                  )}
                </div>
                <span className="text-[10px] opacity-70">({platform.reviews})</span>
              </div>
            ))}
          </div>

          {/* ── Logo ecosystem: 2-row grid ── */}
          <div className="space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-8 items-center justify-items-center">
              {logoRow1.map(({ name, Logo }) => (
                <div key={name} className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity duration-200 group">
                  <Logo className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 hidden sm:inline">{name}</span>
                </div>
              ))}
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-8 items-center justify-items-center">
              {logoRow2.map(({ name, Logo }) => (
                <div key={name} className="flex items-center gap-2 opacity-40 hover:opacity-70 transition-opacity duration-200 group">
                  <Logo className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-600 hidden sm:inline">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </section>
  );
}
