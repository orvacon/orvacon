import {
  CardGrid,
  ConnectorCard,
  type ConnectorItem,
  Icon,
  Pkg,
  SectionBar,
} from "@/components/connectors/parts";

const adapters: ConnectorItem[] = [
  {
    id: "supabase",
    name: "Supabase adapter",
    status: "shipped",
    icon: (
      <Icon>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </Icon>
    ),
    desc: "Generates a Postgres schema with default-deny row-level security out of the box.",
    footer: <Pkg name="@orvacon/adapter-supabase" />,
  },
  {
    id: "nextjs",
    name: "Next.js adapter",
    status: "shipped",
    icon: (
      <Icon>
        <path d="M8 6l-6 6 6 6M16 6l6 6-6 6" />
      </Icon>
    ),
    desc: "App Router route handlers and webhook verification, wired up for you.",
    footer: <Pkg name="@orvacon/adapter-nextjs" />,
  },
  {
    id: "postgres",
    name: "Postgres",
    status: "required",
    icon: (
      <Icon>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
        <path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" />
      </Icon>
    ),
    desc: (
      <>
        Any Postgres works through the{" "}
        <span className="font-mono text-[12px] text-fg">postgres</span> driver — Supabase, Neon,
        RDS, or your own.
      </>
    ),
    footer: <Pkg name="postgres" />,
  },
];

export function Adapters() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[84px]">
      <SectionBar index="02 — Database & framework adapters" right="bring your own stack" />
      <CardGrid>
        {adapters.map((item) => (
          <ConnectorCard key={item.id} item={item} />
        ))}
      </CardGrid>
    </section>
  );
}
