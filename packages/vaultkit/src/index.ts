import type {
  Buyer,
  Card,
  CardToken,
  ConnectorError,
  DeleteCardResult,
  Orvacon,
  PaymentSource,
} from "@orvacon/paykit";

/**
 * A saved card normalized for persistence and display. orvacon stores nothing —
 * you persist this against your own customer, then pass it to {@link Vaultkit.toSource}
 * to charge the card again. The card number never appears here; only the gateway
 * token and non-sensitive display detail do.
 */
export interface CardOnFile {
  /** The gateway token that stands in for the card on a later charge. */
  token: string;
  /**
   * The vault-user key some gateways scope the token to (Iyzico's `cardUserKey`).
   * Persist it and pass it back as {@link SaveInput.userKey} to add more of the
   * same customer's cards under one key.
   */
  userKey?: string;
  /** Card brand for display, e.g. `"Visa"`. */
  brand?: string;
  /** Last four digits, for display. */
  last4?: string;
  /** The gateway-recorded label, echoed from {@link SaveInput.alias}. */
  alias?: string;
  /** The customer this card belongs to in your system, echoed from {@link SaveInput.customerRef}. */
  customerRef?: string;
  /** A ready-to-render label, e.g. `"Visa •••• 4242"`. */
  label: string;
}

/** Configuration for {@link vaultkit}. */
export interface VaultkitOptions {
  /** The orvacon instance whose gateway vaults and forgets the card. */
  orva: Pick<Orvacon, "storeCard" | "deleteCard">;
}

/** Input to {@link Vaultkit.save}. */
export interface SaveInput {
  /** The card to vault. Toxic: exchanged for a token at the gateway, never persisted. */
  card: Card;
  /**
   * Reuse a customer's existing vault user so their cards share one
   * {@link CardOnFile.userKey}; omit to start a new one. Pass the `userKey` from
   * an earlier {@link CardOnFile}.
   */
  userKey?: string;
  /** A human label for the card, where the gateway records one. */
  alias?: string;
  /** The cardholder. A connector may require a subset — Iyzico needs an email. */
  buyer?: Buyer;
  /** The customer in your system; echoed onto the returned {@link CardOnFile} for you to persist. */
  customerRef?: string;
  /** Which gateway to vault with, when several connectors are configured. */
  connectorId?: string;
}

/** Outcome of {@link Vaultkit.save}: the persist-ready card, or the gateway's error. */
export type SaveResult = { ok: true; card: CardOnFile } | { ok: false; error: ConnectorError };

/** A reference to a saved card — a whole {@link CardOnFile} satisfies it, or just its token. */
export interface CardRef {
  token: string;
  userKey?: string;
}

/** What {@link vaultkit} returns. */
export interface Vaultkit {
  /** Vault a card and return a persist-ready {@link CardOnFile} (token + display label). */
  save(input: SaveInput): Promise<SaveResult>;
  /** Delete a vaulted card at the gateway. A {@link CardOnFile} or a bare token reference works. */
  forget(card: CardRef, connectorId?: string): Promise<DeleteCardResult>;
  /** Turn a saved card back into a {@link PaymentSource} to charge it again. */
  toSource(card: CardRef): PaymentSource;
  /** The display label for a card, e.g. `"Visa •••• 4242"`. */
  label(card: { brand?: string; last4?: string }): string;
}

/**
 * Saved cards on file, statelessly. The gateway vaults the card and orvacon
 * returns a token; vaultkit normalizes that into a {@link CardOnFile} you persist
 * against your own customer, hands it back as a charge {@link PaymentSource}, and
 * deletes it when asked. It keeps no store of its own — your database stays the
 * single home for which customer owns which card.
 *
 * ```ts
 * const vault = vaultkit({ orva });
 * const saved = await vault.save({ card, buyer, customerRef: "cus_42" });
 * if (saved.ok) {
 *   await myDb.cards.insert(saved.card); // you persist it
 *   await orva.authorize({ ...req, source: vault.toSource(saved.card) }); // charge later
 * }
 * ```
 */
export function vaultkit({ orva }: VaultkitOptions): Vaultkit {
  const label = (card: { brand?: string; last4?: string }): string => {
    if (card.last4) {
      return `${card.brand ?? "Card"} •••• ${card.last4}`;
    }
    return card.brand ?? "Saved card";
  };

  return {
    label,

    async save(input) {
      const result = await orva.storeCard({
        card: input.card,
        userKey: input.userKey,
        alias: input.alias,
        buyer: input.buyer,
        connectorId: input.connectorId,
      });
      if (!result.ok) {
        return result;
      }
      const { token, last4, brand } = result.card;
      return {
        ok: true,
        card: {
          token: token.token,
          userKey: token.userKey,
          brand,
          last4,
          alias: input.alias,
          customerRef: input.customerRef,
          label: label({ brand, last4 }),
        },
      };
    },

    forget(card, connectorId) {
      const token: CardToken = { token: card.token, userKey: card.userKey };
      return orva.deleteCard({ token, connectorId });
    },

    toSource(card) {
      return { type: "token", token: { token: card.token, userKey: card.userKey } };
    },
  };
}
