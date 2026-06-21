"use client";

import {
  Background,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type NodeData = {
  label: string;
  variant: "app" | "authorize" | "orchestrator" | "connector";
  badge?: string;
  verified?: boolean;
};

type OverviewNode = Node<NodeData>;

const hiddenHandle = { opacity: 0 } as const;

function variantClass(data: NodeData) {
  if (data.variant === "app") {
    return "border border-line-2 bg-bg-3 text-fg";
  }
  if (data.variant === "authorize") {
    return "border border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent";
  }
  if (data.variant === "orchestrator") {
    return "border-[1.5px] border-accent bg-bg text-fg";
  }
  return data.verified
    ? "border border-line bg-bg text-fg"
    : "border border-dashed border-line-2 bg-bg text-fg-dim";
}

function FlowNode({ data }: NodeProps<OverviewNode>) {
  return (
    <div
      className={`rounded-[9px] px-3.5 py-2 text-center font-mono text-[12.5px] ${variantClass(data)}`}
    >
      {data.variant !== "app" ? (
        <Handle type="target" position={Position.Left} style={hiddenHandle} />
      ) : null}
      <div className="flex flex-col items-center gap-1">
        <span>{data.label}</span>
        {data.badge ? (
          <span
            className={
              data.verified
                ? "rounded bg-[rgba(63,185,126,0.12)] px-1.5 py-px text-[10px] text-[#3fb97e]"
                : "rounded border border-line px-1.5 py-px text-[10px] text-fg-faint"
            }
          >
            {data.badge}
          </span>
        ) : null}
      </div>
      {data.variant !== "connector" ? (
        <Handle type="source" position={Position.Right} style={hiddenHandle} />
      ) : null}
    </div>
  );
}

const nodeTypes = { box: FlowNode };

const nodes: OverviewNode[] = [
  {
    id: "app",
    type: "box",
    position: { x: 0, y: 116 },
    data: { label: "Your application", variant: "app" },
  },
  {
    id: "authorize",
    type: "box",
    position: { x: 188, y: 116 },
    data: { label: "orva.authorize(…)", variant: "authorize" },
  },
  {
    id: "orchestrator",
    type: "box",
    position: { x: 380, y: 116 },
    data: { label: "orchestrator", variant: "orchestrator" },
  },
  {
    id: "iyzico",
    type: "box",
    position: { x: 560, y: 24 },
    data: { label: "Iyzico", variant: "connector", badge: "verified", verified: true },
  },
  {
    id: "paytr",
    type: "box",
    position: { x: 560, y: 116 },
    data: { label: "PayTR", variant: "connector", badge: "roadmap" },
  },
  {
    id: "bankpos",
    type: "box",
    position: { x: 560, y: 208 },
    data: { label: "Bank POS", variant: "connector", badge: "roadmap" },
  },
];

function makeEdge(id: string, source: string, target: string): Edge {
  return {
    id,
    source,
    target,
    type: "smoothstep",
    animated: true,
    style: { stroke: "var(--accent)", strokeWidth: 1.5 },
  };
}

const edges: Edge[] = [
  makeEdge("e1", "app", "authorize"),
  makeEdge("e2", "authorize", "orchestrator"),
  makeEdge("e3", "orchestrator", "iyzico"),
  makeEdge("e4", "orchestrator", "paytr"),
  makeEdge("e5", "orchestrator", "bankpos"),
];

export function OverviewFlow() {
  return (
    <div className="orv-flow h-[340px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.16 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} size={1} color="var(--border)" />
      </ReactFlow>
    </div>
  );
}
