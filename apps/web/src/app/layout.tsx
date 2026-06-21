import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConsoleBanner } from "@/components/console-banner";
import "./global.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://orvacon.com"),
  title: {
    default: "orvacon — provider-agnostic payment orchestration",
    template: "%s — orvacon",
  },
  description:
    "Provider-agnostic, TypeScript-first payment orchestration. One clean API, any gateway — Iyzico, PayTR and bank virtual POS plug in as connectors behind a single type-safe interface.",
  openGraph: {
    type: "website",
    siteName: "orvacon",
    url: "https://orvacon.com",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <RootProvider theme={{ defaultTheme: "dark", enableSystem: false }}>
          <ConsoleBanner />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
