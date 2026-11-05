export function Mark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--color-ink)" />
      <rect x="6.5" y="9" width="19" height="16.5" rx="2.5" fill="var(--color-paper)" />
      <rect x="6.5" y="9" width="19" height="5.5" rx="2.5" fill="var(--color-pine)" />
      <rect x="6.5" y="12.2" width="19" height="2.3" fill="var(--color-pine)" />
      <rect x="10" y="6.2" width="2.3" height="5.2" rx="1.1" fill="var(--color-paper)" />
      <rect x="19.7" y="6.2" width="2.3" height="5.2" rx="1.1" fill="var(--color-paper)" />
      <rect x="10" y="16.4" width="4.4" height="4.4" rx="1" fill="var(--color-pine)" />
    </svg>
  );
}
