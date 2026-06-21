export function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute h-[11px] w-[11px] border-[var(--mark)] ${className}`}
    />
  );
}

export function Check({ className }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
