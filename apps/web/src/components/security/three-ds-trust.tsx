import { CrossIcon, Flow } from "@/components/icons";
import { SectionHeader } from "@/components/section";
import { DiagramFrame, Node, Sym } from "@/components/security/parts";

export function ThreeDSTrust() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[84px]">
      <SectionHeader
        eyebrow="03 — 3-D Secure trust"
        title="The callback POST is never trusted."
        lead={
          <>
            After the 3DS challenge the browser POSTs back to your callback — but that request is
            attacker-controllable. orvacon ignores its body and re-reads the result from a{" "}
            <span className="text-fg">signed finalize</span> call to the gateway before committing.
          </>
        }
      />
      <DiagramFrame label="fig.03 · 3-d secure finalize" width={1000} height={300}>
        <svg
          viewBox="0 0 1000 300"
          width={1000}
          height={300}
          fill="none"
          aria-hidden="true"
          className="absolute inset-0 overflow-visible"
        >
          <defs>
            <marker id="t-acc" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
              <path
                d="M1 1 L7 4.5 L1 8"
                stroke="var(--accent)"
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
            <marker id="t-red" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
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
            d="M196 130 L290 130"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeDasharray="6 8"
            markerEnd="url(#t-acc)"
            className="[animation:orv-dash-flow_1s_linear_infinite]"
          />
          <path
            d="M438 130 L532 130"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeDasharray="6 8"
            markerEnd="url(#t-acc)"
            className="[animation:orv-dash-flow_1s_linear_infinite]"
          />
          <path
            d="M680 130 L772 130"
            stroke="var(--accent)"
            strokeWidth="1.8"
            strokeDasharray="6 8"
            markerEnd="url(#t-acc)"
            className="[animation:orv-dash-flow_1s_linear_infinite]"
          />
          <path
            d="M605 232 L770 150"
            stroke="#d8674e"
            strokeWidth="1.6"
            strokeDasharray="5 7"
            markerEnd="url(#t-red)"
          />
        </svg>

        <Node x={120} y={130} w={148}>
          <span className="font-mono text-[11.5px] text-fg">authorize()</span>
          <span className="font-mono text-[10px] text-fg-faint">
            <Flow steps={["card", "gateway"]} />
          </span>
        </Node>
        <Node x={364} y={130} w={148}>
          <span className="font-mono text-[11.5px] text-fg">requires_action</span>
          <span className="font-mono text-[10px] text-fg-faint">state persisted</span>
        </Node>
        <Node x={606} y={130} w={148}>
          <span className="font-mono text-[11.5px] text-fg">3DS challenge</span>
          <span className="font-mono text-[10px] text-fg-faint">in the browser</span>
        </Node>
        <Node x={850} y={130} w={150} variant="accent" corners>
          <span className="flex items-center gap-1 font-mono text-[11.5px] font-medium">
            finalize
            <Sym size={12}>
              <path d="M20 6L9 17l-5-5" />
            </Sym>
          </span>
          <span className="font-mono text-[10px] text-fg-dim">signature verified</span>
        </Node>
        <Node x={606} y={248} w={176} variant="danger">
          <span className="font-mono text-[11px]">browser callback POST</span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-[#d8674e]">
            <CrossIcon className="h-2.5 w-2.5" />
            never trusted
          </span>
        </Node>
      </DiagramFrame>
    </section>
  );
}
