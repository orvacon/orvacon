import { Fragment } from "react";
import { CrossIcon, LinkIcon } from "@/components/icons";
import { DotField, SectionHeader } from "@/components/section";

const entries = [
  { tag: "entry #1 · created", hash: "hash a1f0…", prev: "prev — null" },
  { tag: "entry #2 · authorized", hash: "hash 9c4e…", prev: "prev a1f0…" },
  { tag: "entry #3 · captured", hash: "hash 5b71…", prev: "prev 9c4e…" },
];

export function Ledger() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[84px]">
      <SectionHeader
        eyebrow="04 — The ledger"
        title="Append-only, and it proves it."
        lead="Each ledger entry carries the hash of the entry before it. Change a past row and every hash after it stops matching — tampering is evident without trusting anyone."
      />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-2 p-[22px]">
        <DotField />
        <div className="relative z-[2] overflow-x-auto">
          <div className="flex min-w-[760px] items-center gap-2">
            {entries.map((entry, i) => (
              <Fragment key={entry.tag}>
                {i > 0 ? (
                  <div className="flex items-center text-accent">
                    <LinkIcon className="h-[18px] w-[18px]" />
                  </div>
                ) : null}
                <div className="flex-1 rounded-[11px] border border-line-2 bg-bg p-3.5">
                  <div className="font-mono text-[11px] text-fg-faint">{entry.tag}</div>
                  <div className="mt-2 font-mono text-[12px] text-accent">{entry.hash}</div>
                  <div className="mt-1 font-mono text-[10.5px] text-fg-faint">{entry.prev}</div>
                </div>
              </Fragment>
            ))}
            <div className="flex items-center text-[#d8674e]">
              <CrossIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 rounded-[11px] border border-dashed border-[rgba(216,103,78,0.5)] bg-[rgba(216,103,78,0.06)] p-3.5">
              <div className="font-mono text-[11px] text-[#e08a72]">tampered row</div>
              <div className="mt-2 font-mono text-[12px] text-[#e08a72]">hash mismatch</div>
              <div className="mt-1 font-mono text-[10.5px] text-[#d8674e]">chain breaks</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
