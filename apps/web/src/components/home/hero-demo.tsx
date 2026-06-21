"use client";

import { useState } from "react";
import { CopyButton } from "@/components/copy-button";

const connectors = [
  {
    id: "iyzico",
    name: "Iyzico",
    verified: true,
    fn: "iyzico",
    pkg: "@orvacon/connector-iyzico",
    args: "apiKey, secretKey",
    color: "21, 184, 134",
  },
  {
    id: "paytr",
    name: "PayTR",
    verified: false,
    fn: "paytr",
    pkg: "@orvacon/connector-paytr",
    args: "merchantId, merchantKey, merchantSalt",
    color: "116, 167, 245",
  },
  {
    id: "bankvpos",
    name: "Bank VPOS",
    verified: false,
    fn: "bankVpos",
    pkg: "@orvacon/connector-bank-vpos",
    args: "terminalId, clientId, storeKey",
    color: "232, 154, 108",
  },
];

function codeFor(connector: (typeof connectors)[number]) {
  return `import { ${connector.fn} } from "${connector.pkg}";

const orva = orvacon({
  connectors: [${connector.fn}({ ${connector.args} })],
});

// your code — identical for every gateway
const payment = await orva.authorize(order);`;
}

export function HeroDemo() {
  const [selected, setSelected] = useState(0);
  const active = connectors[selected];

  if (!active) {
    return null;
  }

  return (
    <div className="relative mx-auto grid max-w-[980px] grid-cols-1 gap-4 lg:grid-cols-[1fr_236px]">
      <div className="relative">
        {connectors.map((connector, index) => (
          <div
            key={connector.id}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-50px] h-[380px] w-[120%] -translate-x-1/2 blur-lg transition-opacity duration-500"
            style={{
              background: `radial-gradient(50% 60% at 50% 30%, rgba(${connector.color}, 0.32), transparent 68%)`,
              opacity: index === selected ? 1 : 0,
            }}
          />
        ))}
        <div
          className="relative z-[2] overflow-hidden rounded-[14px] border bg-[#161618] shadow-[0_50px_120px_-50px_rgba(0,0,0,0.9)] transition-colors duration-500"
          style={{ borderColor: `rgba(${active.color}, 0.45)` }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-[background] duration-500"
            style={{
              background: `radial-gradient(130% 55% at 50% 0%, rgba(${active.color}, 0.12), transparent 62%)`,
            }}
          />
          <div className="relative">
            <div
              className="flex items-center justify-between border-b bg-[#0f0f11] px-[15px] py-3 transition-colors duration-500"
              style={{ borderColor: `rgba(${active.color}, 0.22)` }}
            >
              <div className="flex items-center gap-2.5">
                <span className="flex gap-1.5">
                  <span className="h-[11px] w-[11px] rounded-full bg-[#3a3a3f]" />
                  <span className="h-[11px] w-[11px] rounded-full bg-[#2f2f34]" />
                  <span className="h-[11px] w-[11px] rounded-full bg-[#2f2f34]" />
                </span>
                <span className="ml-1 font-mono text-[12.5px] text-[#8c8c86]">payments.ts</span>
              </div>
              <CopyButton text={codeFor(active)} />
            </div>
            <pre className="no-scrollbar m-0 overflow-x-auto px-[22px] pb-6 pt-[22px] font-mono text-[13.5px] leading-[1.8] text-[#c9c7bf]">
              <code>
                <span className="text-[#b69bf0]">import</span>
                {" { "}
                <span className="text-[#74a7f5]">{active.fn}</span>
                {" } "}
                <span className="text-[#b69bf0]">from</span>{" "}
                <span className="text-[#9fce7e]">"{active.pkg}"</span>;{"\n"}
                {"\n"}
                <span className="text-[#b69bf0]">const</span> orva ={" "}
                <span className="text-[#74a7f5]">orvacon</span>
                {"({"}
                {"\n"}
                {"  connectors: ["}
                <span className="text-[#74a7f5]">{active.fn}</span>
                {"({ "}
                {active.args}
                {" })],"}
                {"\n"}
                {"});"}
                {"\n"}
                {"\n"}
                <span className="text-[#6a6a72]">
                  {"// your code — identical for every gateway"}
                </span>
                {"\n"}
                <span className="text-[#b69bf0]">const</span> payment ={" "}
                <span className="text-[#b69bf0]">await</span> orva.
                <span className="text-[#74a7f5]">authorize</span>(order);
              </code>
            </pre>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="orv-eyebrow mb-1">Pick a gateway</div>
        {connectors.map((connector, index) => {
          const on = index === selected;
          return (
            <button
              key={connector.id}
              type="button"
              onClick={() => setSelected(index)}
              style={
                on
                  ? {
                      borderColor: `rgba(${connector.color}, 0.6)`,
                      backgroundColor: `rgba(${connector.color}, 0.12)`,
                      color: `rgb(${connector.color})`,
                    }
                  : undefined
              }
              className={`flex items-center justify-between gap-2 rounded-[10px] border px-3.5 py-3 text-left font-mono text-[13px] transition-colors ${
                on ? "" : "border-line bg-bg-2 text-fg-dim hover:border-line-2"
              }`}
            >
              {connector.name}
              {connector.verified ? (
                <span className="rounded bg-[rgba(63,185,126,0.12)] px-1.5 py-0.5 text-[10px] text-[#3fb97e]">
                  verified
                </span>
              ) : (
                <span className="rounded border border-line px-1.5 py-0.5 text-[10px] text-fg-faint">
                  soon
                </span>
              )}
            </button>
          );
        })}
        <p className="mt-2 text-[12.5px] leading-[1.55] text-fg-faint">
          Swap the connector — your <span className="font-mono text-accent">orva.authorize(…)</span>{" "}
          call never changes.
        </p>
      </div>
    </div>
  );
}
