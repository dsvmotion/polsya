interface GlowOrbProps {
  /** CSS color value, e.g. 'hsl(var(--brand-red-wine))' */
  color: string;
  /** Tailwind size class e.g. 'w-[600px] h-[600px]' */
  size?: string;
  /** Tailwind positioning e.g. 'top-[-200px] left-[-100px]' */
  position?: string;
  /** Animation delay e.g. '2s' */
  delay?: string;
  /** Opacity class e.g. 'opacity-15' */
  opacity?: string;
}

export function GlowOrb({
  color,
  size = 'w-[500px] h-[500px]',
  position = 'top-0 left-0',
  delay = '0s',
  opacity = 'opacity-20',
}: GlowOrbProps) {
  return (
    <div
      className={`absolute ${size} ${position} ${opacity} rounded-full blur-3xl animate-float pointer-events-none`}
      style={{
        background: color,
        animationDelay: delay,
      }}
      aria-hidden="true"
    />
  );
}
