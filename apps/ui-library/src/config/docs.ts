export interface NavItem {
  title: string;
  href: string;
  soon?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const docsNav: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/" },
      { title: "Installation", href: "/docs/installation" },
      { title: "Folder Structure", href: "/docs/folder-structure" },
    ],
  },
  {
    title: "Components",
    items: [
      { title: "Payment Status", href: "/components/payment-status" },
      { title: "Card Form", href: "/components/card-form", soon: true },
      { title: "3-D Secure Frame", href: "/components/three-d-secure-frame", soon: true },
      { title: "Saved Cards", href: "/components/saved-cards", soon: true },
      { title: "Subscription Table", href: "/components/subscription-table", soon: true },
    ],
  },
  {
    title: "Tools",
    items: [{ title: "Webhook Keys", href: "/tools/webhook-keys" }],
  },
];
