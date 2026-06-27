"use client";

import { useState } from "react";
import { CopyButton } from "@/components/copy-button";

const PUBLIC_PREFIX = "orvpk_";
const SECRET_PREFIX = "orvsk_";
const KEY_BYTES = 32;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate an Ed25519 key pair in orvacon's string format, entirely in the
 * browser — the same shape `orvacon keys` and cryptokit produce.
 */
async function generateKeyPair(): Promise<{ publicKey: string; secretKey: string }> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const rawPublic = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const seed = pkcs8.slice(-KEY_BYTES);
  return {
    publicKey: `${PUBLIC_PREFIX}${toBase64Url(rawPublic)}`,
    secretKey: `${SECRET_PREFIX}${toBase64Url(seed)}`,
  };
}

function KeyRow({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
        <code className="min-w-0 flex-1 truncate font-mono text-xs">{value}</code>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

export function KeyGenerator() {
  const [keys, setKeys] = useState<{ publicKey: string; secretKey: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onGenerate() {
    setBusy(true);
    setError(null);
    generateKeyPair()
      .then(setKeys)
      .catch(() =>
        setError(
          "This browser can't generate Ed25519 keys. Try the latest Chrome, Firefox, or Safari — or run `orvacon keys`.",
        ),
      )
      .finally(() => setBusy(false));
  }

  const env = keys
    ? `ORVACON_WEBHOOK_SIGNING_KEY=${keys.secretKey}\nORVACON_WEBHOOK_PUBLIC_KEY=${keys.publicKey}`
    : "";

  return (
    <div className="rounded-lg border p-5">
      <button
        type="button"
        onClick={onGenerate}
        disabled={busy}
        className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Generating…" : keys ? "Generate another" : "Generate key pair"}
      </button>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      {keys ? (
        <div className="mt-5 space-y-4">
          <KeyRow
            label="Public key"
            hint="Safe to share — for whoever verifies your webhooks."
            value={keys.publicKey}
          />
          <KeyRow
            label="Secret key"
            hint="Secret — set it as an env var, never commit it."
            value={keys.secretKey}
          />
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">.env</span>
              <CopyButton value={env} />
            </div>
            <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
              <code className="font-mono">{env}</code>
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
