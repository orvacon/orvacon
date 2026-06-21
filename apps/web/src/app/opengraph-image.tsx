import { ImageResponse } from "next/og";

export const alt = "orvacon — provider-agnostic payment orchestration";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 88,
        background: "#08080A",
        color: "#f4f3f1",
      }}
    >
      <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em", color: "#15b886" }}>
        orvacon
      </div>
      <div
        style={{
          fontSize: 80,
          fontWeight: 600,
          lineHeight: 1.04,
          letterSpacing: "-0.03em",
          marginTop: 34,
          maxWidth: 940,
        }}
      >
        Provider-agnostic payment orchestration.
      </div>
      <div style={{ fontSize: 32, color: "#8e8d96", marginTop: 30, maxWidth: 880 }}>
        One clean API, any gateway. Runs in your own runtime — it never touches the money.
      </div>
      <div style={{ fontSize: 23, color: "#56565e", marginTop: 48 }}>
        MIT · TypeScript-first · Ed25519-signed webhooks
      </div>
    </div>,
    { ...size },
  );
}
