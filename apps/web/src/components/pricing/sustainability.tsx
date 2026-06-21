import type { ReactNode } from "react";

function NoteCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-[12px] border border-line bg-bg-2 px-5 py-[18px]">
      <span className="mt-px shrink-0 text-accent">{icon}</span>
      <div>
        <div className="text-[14.5px] font-semibold">{title}</div>
        <p className="mt-1.5 text-[13.5px] leading-[1.55] text-fg-dim">{desc}</p>
      </div>
    </div>
  );
}

export function Sustainability() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[84px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] items-start gap-x-12 gap-y-10">
        <div className="min-w-0">
          <div className="orv-eyebrow">03 — Sustainability</div>
          <h2 className="mt-4 max-w-[16ch] text-[clamp(26px,3.4vw,42px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            How a free project keeps going.
          </h2>
          <p className="mt-4 max-w-[48ch] text-[16.5px] leading-[1.62] text-fg-dim">
            orvacon is open source and maintained in the open. If it's useful to your business,
            sponsoring its development is the best way to keep it healthy. Sponsorship is optional —
            it never unlocks features or changes the license.
          </p>
          <div className="mt-[26px] flex flex-wrap gap-3">
            <a
              href="https://github.com/sponsors/orvacon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[9px] bg-accent px-[18px] py-[11px] text-[14.5px] font-medium text-white shadow-[0_10px_24px_-12px_var(--accent)] transition hover:-translate-y-px hover:brightness-[1.07]"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 21s-7-4.5-9.5-8.5C.5 9 2 5.5 5.5 5.5c2 0 3.5 1.2 4.5 2.5 1-1.3 2.5-2.5 4.5-2.5C18 5.5 19.5 9 17.5 12.5 15 16.5 12 21 12 21z" />
              </svg>
              Sponsor on GitHub
            </a>
            <a
              href="https://github.com/orvacon/orvacon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[9px] border border-line px-4 py-[11px] text-[14.5px] text-fg transition-colors hover:border-line-2"
            >
              Contribute
            </a>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <NoteCard
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
              </svg>
            }
            title="License never changes for what's released"
            desc="MIT is MIT. A version you depend on stays free, forever."
          />
          <NoteCard
            icon={
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12h4l3 8 4-16 3 8h4" />
              </svg>
            }
            title="If a paid option ever exists, it's separate"
            desc="Any future managed offering would be opt-in and additive — never a paywall over the open-source core."
          />
        </div>
      </div>
    </section>
  );
}
