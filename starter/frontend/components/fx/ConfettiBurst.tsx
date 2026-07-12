'use client';

import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

const COLORS = ['#d2a032', '#eacb7c', '#23604a', '#b94a32', '#faf6ec'];

/**
 * One celebratory burst of brand-colored confetti, fired on mount.
 * Render it inside a `relative` container (e.g. the success ticket stub).
 */
export default function ConfettiBurst({ count = 32 }: { count?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const pieces: HTMLSpanElement[] = [];
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      const w = 5 + (i % 3) * 3;
      const h = 7 + (i % 4) * 3;
      s.style.cssText = `position:absolute;left:50%;top:35%;width:${w}px;height:${h}px;background:${COLORS[i % COLORS.length]};border-radius:${i % 2 ? '50%' : '2px'};will-change:transform,opacity;`;
      root.appendChild(s);
      pieces.push(s);
    }

    const tl = gsap.timeline({
      onComplete: () => pieces.forEach((p) => p.remove()),
    });
    pieces.forEach((p, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      tl.fromTo(
        p,
        { x: 0, y: 0, rotation: 0, opacity: 1 },
        {
          x: Math.cos(angle) * (90 + Math.random() * 150),
          y: Math.sin(angle) * (70 + Math.random() * 120) - 50,
          rotation: gsap.utils.random(-300, 300),
          opacity: 0,
          duration: 1.2 + Math.random() * 0.8,
          ease: 'power2.out',
        },
        0
      );
    });

    return () => {
      tl.kill();
      pieces.forEach((p) => p.remove());
    };
  }, [count]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0" />
  );
}
