'use client';

/**
 * CTA link to the entry form. On the homepage it always scrolls to the form
 * (even on repeat clicks, which Next's router treats as a no-op when the
 * hash hasn't changed); from any other page it navigates to /#enter.
 */
export default function EnterLink({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href="/#enter"
      className={className}
      onClick={(e) => {
        if (window.location.pathname === '/') {
          e.preventDefault();
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          document
            .getElementById('enter')
            ?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          window.history.replaceState(null, '', '/#enter');
        }
      }}
    >
      {children}
    </a>
  );
}
