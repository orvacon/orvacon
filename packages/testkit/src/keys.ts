/**
 * A throwaway Ed25519 key pair for tests — a real cryptokit pair, so
 * `orvacon({ webhookSigningKey: testSigningKey })` passes fail-fast validation
 * without you having to run `orvacon keys` first.
 *
 * **Never use it in production.** The secret is published in this package; it
 * exists only so a gateway-free test can construct an orvacon instance.
 */
export const testSigningKey = "orvsk_d0B8bERuNqnsMj1qDUpu4qDXN1YnvERerE5vnLci9U4";

/** The public half of {@link testSigningKey}, for verifying a test delivery. */
export const testPublicKey = "orvpk_9_-g-SC7rZ0dwJ4WQswDZ3UnaZTdz9ATcxxfoqbFclU";
