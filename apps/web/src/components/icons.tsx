import { Fragment } from "react";

type IconProps = { className?: string };

export function ArrowRight({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowDown({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M9.5 17H7A5 5 0 0 1 7 7h2.5M14.5 7H17a5 5 0 0 1 0 10h-2.5M8 12h8" />
    </svg>
  );
}

export function CrossIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function Flow({ steps, className }: { steps: string[]; className?: string }) {
  return (
    <span
      className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-1 align-middle ${className ?? ""}`}
    >
      {steps.map((step, i) => (
        <Fragment key={step}>
          {i > 0 ? <ArrowRight className="h-[0.85em] w-[0.85em] shrink-0 opacity-50" /> : null}
          <span>{step}</span>
        </Fragment>
      ))}
    </span>
  );
}
