import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ScrollFadeInProps {
  children: ReactNode;
  className?: string;
  /** Delay in milliseconds before animation starts */
  delay?: number;
}

export function ScrollFadeIn({ children, className = '', delay = 0 }: ScrollFadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            const timer = setTimeout(() => setIsVisible(true), delay);
            return () => clearTimeout(timer);
          }
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`${className} transition-none ${
        isVisible ? 'animate-slide-up-fade' : 'opacity-0 translate-y-5'
      }`}
    >
      {children}
    </div>
  );
}
