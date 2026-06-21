import { Flow } from "@/components/icons";
import { SectionHeader } from "@/components/section";
import { DiagramFrame, Label, Node, Sym, WhyCallout } from "@/components/security/parts";

export function Custody() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[84px]">
      <SectionHeader
        eyebrow="01 — Custody boundary"
        title="Money never flows through orvacon."
        lead={
          <>
            Funds move on the{" "}
            <Flow steps={["card", "your gateway account"]} className="text-[#3fb97e]" /> path.
            orvacon only ever sits on the <span className="text-accent">control path</span> —
            coordinating the call, persisting state, signing events. It holds no balance and never
            custodies money.
          </>
        }
      />
      <DiagramFrame label="fig.01 · payment custody" width={1000} height={420}>
        <svg
          viewBox="0 0 1000 420"
          width={1000}
          height={420}
          fill="none"
          aria-hidden="true"
          className="absolute inset-0 overflow-visible"
        >
          <defs>
            <marker id="c-acc" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
              <path
                d="M1 1 L7 4.5 L1 8"
                stroke="var(--accent)"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
            <marker id="c-green" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
              <path
                d="M1 1 L7 4.5 L1 8"
                stroke="#3fb97e"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
            <marker id="c-dim" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
              <path
                d="M1 1 L7 4.5 L1 8"
                stroke="var(--text-faint)"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
          </defs>
          <path
            d="M150 198 C 250 120 370 96 470 86"
            stroke="var(--text-faint)"
            strokeWidth="1.5"
            strokeDasharray="5 7"
            markerEnd="url(#c-dim)"
          />
          <path
            d="M150 210 C 380 70 620 70 850 198"
            stroke="#3fb97e"
            strokeWidth="2.6"
            markerEnd="url(#c-green)"
          />
          <path
            d="M500 122 L500 300"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeDasharray="6 8"
            markerEnd="url(#c-acc)"
            className="[animation:orv-dash-flow_1s_linear_infinite]"
          />
          <path
            d="M560 338 C 700 326 800 280 858 244"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeDasharray="6 8"
            markerEnd="url(#c-acc)"
            className="[animation:orv-dash-flow_1s_linear_infinite]"
          />
          <path
            d="M850 224 C 760 300 640 344 562 344"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeDasharray="4 7"
            opacity="0.6"
          />
        </svg>

        <Node x={115} y={210} w={118}>
          <Sym className="text-fg-dim">
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21c1.5-4 12.5-4 14 0" />
          </Sym>
          <span className="font-mono text-[12px] text-fg">Cardholder</span>
        </Node>
        <Node x={500} y={80} w={150}>
          <Sym className="text-fg-dim">
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <path d="M3 9h18M8 21h8" />
          </Sym>
          <span className="font-mono text-[12px] text-fg">Your application</span>
        </Node>
        <Node x={500} y={340} w={172} variant="accent" corners>
          <Sym>
            <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5" />
            <path d="M7 8 L11 12 L7 16" />
            <path d="M11.5 12 L17 12" />
          </Sym>
          <span className="font-mono text-[12px] font-medium">orvacon orchestrator</span>
          <span className="font-mono text-[10px] text-fg-dim">control only · no funds</span>
        </Node>
        <Node x={885} y={210} w={128} variant="green">
          <Sym>
            <path d="M3 7h18v12H3z" />
            <path d="M3 11h18M7 15h4" />
          </Sym>
          <span className="font-mono text-[12px]">Your gateway account</span>
        </Node>

        <Label x={500} y={138} tone="green">
          funds · <Flow steps={["card", "gateway"]} />
        </Label>
        <Label x={430} y={210}>
          orva.authorize()
        </Label>
        <Label x={735} y={300}>
          control API
        </Label>
      </DiagramFrame>
      <WhyCallout>
        <span className="font-medium text-fg">Why it matters:</span> because the money path never
        touches orvacon, it falls outside money-transmitter regulation and stays off your
        PCI-custody scope. A compromise of the orchestrator cannot move or divert funds — there's no
        balance to move.
      </WhyCallout>
    </section>
  );
}
