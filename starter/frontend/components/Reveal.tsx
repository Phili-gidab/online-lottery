'use client';

import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

/**
 * Scroll-in reveal, powered by GSAP ScrollTrigger. The `.reveal` class in
 * globals.css provides the hidden initial state (and the no-JS /
 * reduced-motion fallbacks), so nothing flashes before hydration.
 */
export default function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.classList.add('in');
      return;
    }

    const tween = gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      delay: delay / 1000,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay]);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
