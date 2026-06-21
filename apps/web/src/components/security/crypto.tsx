import type { ReactNode } from "react";
import { ArrowRight, CrossIcon, Flow } from "@/components/icons";
import { SectionHeader } from "@/components/section";
import { DiagramFrame, Label, Node, Sym } from "@/components/security/parts";

const specs = [
  { k: "Public key", v: "32 bytes" },
  { k: "Signature", v: "64 bytes · R ∥ S" },
  { k: "Nonce", v: "deterministic" },
  { k: "Security", v: "≈128-bit" },
];

function Ed25519Card() {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-bg-2 p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[18px] font-semibold tracking-[-0.01em]">Ed25519</h3>
        <span className="font-mono text-[11px] text-accent">RFC 8032</span>
      </div>
      <div className="mt-1 font-mono text-[12px] text-fg-faint">EdDSA · Curve25519 · SHA-512</div>

      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-line bg-line">
        {specs.map((spec) => (
          <div key={spec.k} className="bg-bg-2 px-3.5 py-3">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg-faint">
              {spec.k}
            </div>
            <div className="mt-1 font-mono text-[13px] text-fg">{spec.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-[10px] border border-[#26262a] bg-[#161618] p-3.5 font-mono text-[12.5px] leading-[1.7] text-[#c9c7bf]">
        <div>
          <span className="text-[#74a7f5]">sign</span>(privateKey, event){" "}
          <span className="text-[#6a6a72]">{"// in orvacon"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-fg-faint">
          <ArrowRight className="h-3 w-3 shrink-0" />
          64-byte signature
        </div>
        <div className="mt-2">
          <span className="text-[#74a7f5]">verify</span>(publicKey, event, sig){" "}
          <span className="text-[#6a6a72]">{"// in your app"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-fg-faint">
          <ArrowRight className="h-3 w-3 shrink-0" />
          true | false
        </div>
      </div>
    </div>
  );
}

function ConstantTimeCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-bg-2 p-6">
      <h3 className="text-[18px] font-semibold tracking-[-0.01em]">Constant-time comparison</h3>
      <p className="mt-2 text-[13.5px] leading-[1.6] text-fg-dim">
        Every signature and token is compared in constant time — an attacker can't recover it
        byte-by-byte by timing how fast verification fails.
      </p>

      <div className="mt-4 overflow-hidden rounded-[10px] border border-[#26262a] font-mono text-[12.5px]">
        <div className="flex items-center gap-2.5 border-l-2 border-[#d8674e] bg-[rgba(216,103,78,0.07)] px-3.5 py-2.5">
          <CrossIcon className="h-3.5 w-3.5 shrink-0 text-[#d8674e]" />
          <span className="text-[#c9c7bf]">sig === expected</span>
          <span className="ml-auto hidden text-[#6a6a72] sm:block">early exit leaks</span>
        </div>
        <div className="flex items-center gap-2.5 border-l-2 border-accent bg-[var(--accent-soft)] px-3.5 py-2.5">
          <Sym size={14} className="h-3.5 w-3.5 shrink-0 text-accent">
            <path d="M20 6L9 17l-5-5" />
          </Sym>
          <span className="text-[#c9c7bf]">timingSafeEqual(sig, expected)</span>
          <span className="ml-auto hidden text-[#6a6a72] sm:block">all bytes, always</span>
        </div>
      </div>

      <p className="mt-3 text-[12.5px] leading-[1.55] text-fg-faint">
        Both Iyzico's and PayTR's official samples compare with{" "}
        <span className="font-mono text-fg-dim">==</span>. orvacon never does.
      </p>
    </div>
  );
}

function World({
  dir,
  title,
  rows,
  foot,
  accent,
}: {
  dir: ReactNode;
  title: string;
  rows: { name: string; detail: string }[];
  foot: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[12px] border p-5 ${
        accent ? "border-[var(--accent-line)] bg-[var(--accent-soft)]" : "border-line bg-bg"
      }`}
    >
      <div
        className={`font-mono text-[11px] uppercase tracking-[0.1em] ${
          accent ? "text-accent" : "text-fg-faint"
        }`}
      >
        {dir}
      </div>
      <div className="mt-3 text-[15px] font-medium text-fg">{title}</div>
      <div className="mt-3 flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.name}
            className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg-2 px-3 py-2"
          >
            <span className="font-mono text-[12.5px] text-fg">{row.name}</span>
            <span className="font-mono text-[11.5px] text-fg-faint">{row.detail}</span>
          </div>
        ))}
      </div>
      <div className={`mt-3 font-mono text-[12px] ${accent ? "text-accent" : "text-fg-faint"}`}>
        {foot}
      </div>
    </div>
  );
}

function TwoWorldsCard() {
  return (
    <div className="mt-[18px] rounded-2xl border border-line bg-bg-2 p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[18px] font-semibold tracking-[-0.01em]">
          Two signature worlds, never crossed
        </h3>
        <span className="hidden font-mono text-[11px] text-fg-faint sm:block">
          separate code paths · separate keys
        </span>
      </div>
      <div className="mt-5 grid gap-[18px] sm:grid-cols-2">
        <World
          dir={
            <>
              inbound · <Flow steps={["gateway", "orvacon"]} />
            </>
          }
          title="Verify the gateway's own MAC."
          rows={[
            { name: "Iyzico", detail: "HMAC-SHA256 · hex" },
            { name: "PayTR", detail: "HMAC-SHA256 · base64" },
          ]}
          foot="symmetric · shared merchant secret"
        />
        <World
          dir={
            <>
              outbound · <Flow steps={["orvacon", "you"]} />
            </>
          }
          title="Sign with Ed25519."
          rows={[
            { name: "sign", detail: "private key · in orvacon" },
            { name: "verify", detail: "public key · in your app" },
          ]}
          foot="asymmetric · the public key can't forge"
          accent
        />
      </div>
    </div>
  );
}

export function Crypto() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[84px]">
      <SectionHeader
        eyebrow="02 — Webhook integrity"
        title="A leaked key can't forge an event."
        lead={
          <>
            Outbound webhooks are signed with an{" "}
            <span className="text-accent">Ed25519 private key</span> that never leaves orvacon; your
            endpoint verifies with the <span className="text-fg">public key</span>. A shared secret
            can be replayed by anyone who reads it — an asymmetric signature can't.
          </>
        }
      />

      <DiagramFrame label="fig.02 · asymmetric webhooks" width={1000} height={340}>
        <svg
          viewBox="0 0 1000 340"
          width={1000}
          height={340}
          fill="none"
          aria-hidden="true"
          className="absolute inset-0 overflow-visible"
        >
          <defs>
            <marker id="e-acc" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
              <path
                d="M1 1 L7 4.5 L1 8"
                stroke="var(--accent)"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
            <marker id="e-red" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
              <path
                d="M1 1 L7 4.5 L1 8"
                stroke="#d8674e"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
          </defs>
          <path
            d="M232 165 L432 165"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeDasharray="6 8"
            markerEnd="url(#e-acc)"
            className="[animation:orv-dash-flow_1s_linear_infinite]"
          />
          <path
            d="M572 165 L772 165"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeDasharray="6 8"
            markerEnd="url(#e-acc)"
            className="[animation:orv-dash-flow_1s_linear_infinite]"
          />
          <path
            d="M548 282 C 700 272 810 240 838 196"
            stroke="#d8674e"
            strokeWidth="1.6"
            strokeDasharray="5 7"
            markerEnd="url(#e-red)"
          />
        </svg>

        <Node x={150} y={165} w={160} variant="accent" corners>
          <Sym>
            <circle cx="12" cy="12" r="2.6" />
            <path d="M12 4.5v4.9M12 14.6v4.9M4.5 12h4.9M14.6 12h4.9" />
          </Sym>
          <span className="font-mono text-[12px] font-medium">orvacon</span>
          <span className="font-mono text-[10px] text-fg-dim">sign · private key</span>
        </Node>
        <Node x={500} y={165} w={140}>
          <Sym className="text-fg-dim">
            <path d="M4 4h16v16H4z" />
            <path d="M4 9h16" />
          </Sym>
          <span className="font-mono text-[12px] text-fg">signed event</span>
          <span className="font-mono text-[10px] text-fg-faint">payload + sig</span>
        </Node>
        <Node x={850} y={165} w={150} variant="accent" corners>
          <Sym>
            <path d="M20 6L9 17l-5-5" />
          </Sym>
          <span className="font-mono text-[12px] font-medium">your endpoint</span>
          <span className="font-mono text-[10px] text-fg-dim">verify · public key</span>
        </Node>
        <Node x={500} y={292} w={150} variant="danger">
          <Sym className="text-[#d8674e]">
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21c1.5-4 12.5-4 14 0" />
          </Sym>
          <span className="font-mono text-[11.5px]">forged event</span>
        </Node>

        <Label x={341} y={135}>
          emit
        </Label>
        <Label x={672} y={135}>
          verify()
        </Label>
        <Label x={742} y={206} tone="danger">
          <CrossIcon className="h-2.5 w-2.5" />
          no private key
        </Label>
      </DiagramFrame>

      <div className="mt-[18px] grid gap-[18px] lg:grid-cols-2">
        <Ed25519Card />
        <ConstantTimeCard />
      </div>
      <TwoWorldsCard />
    </section>
  );
}
