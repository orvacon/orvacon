import {
  CardGrid,
  ConnectorCard,
  type ConnectorItem,
  Icon,
  Pkg,
  SectionBar,
} from "@/components/connectors/parts";
import { Flow } from "@/components/icons";

const gateways: ConnectorItem[] = [
  {
    id: "iyzico",
    name: "Iyzico",
    status: "verified",
    featured: true,
    icon: (
      <Icon>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </Icon>
    ),
    desc: (
      <>
        Raw-card and 3-D Secure, verified end-to-end against the gateway sandbox:{" "}
        <Flow
          steps={["authorize", "3DS", "capture", "refund", "reconcile"]}
          className="font-mono text-[12px] text-fg"
        />
        . Stored-card tokens ship as experimental.
      </>
    ),
    footer: <Pkg name="@orvacon/connector-iyzico" accent />,
  },
  {
    id: "paytr",
    name: "PayTR",
    status: "roadmap",
    icon: (
      <Icon>
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
      </Icon>
    ),
    desc: (
      <>
        A planned connector behind the same contract. When it lands, point a config entry at it —
        your application code that calls{" "}
        <span className="font-mono text-[12px] text-fg">orva.authorize()</span> stays untouched.
      </>
    ),
    footer: <Pkg name="@orvacon/connector-paytr" />,
  },
  {
    id: "bankvpos",
    name: "Bank virtual POS",
    status: "roadmap",
    icon: (
      <Icon>
        <path d="M3 21h18M4 10h16M5 10l7-6 7 6M6 10v11M18 10v11M10 10v11M14 10v11" />
      </Icon>
    ),
    desc: "Turkish bank VPOS (3D Pay / 3D Secure) integrations, planned behind the same connector contract.",
    footer: <Pkg name="Turkish bank 3D Secure" />,
  },
];

export function Gateways() {
  return (
    <section className="px-[30px] pb-[84px]">
      <SectionBar index="01 — Payment gateways" right="1 verified · 2 on the roadmap" />
      <CardGrid>
        {gateways.map((item) => (
          <ConnectorCard key={item.id} item={item} />
        ))}
      </CardGrid>
    </section>
  );
}
