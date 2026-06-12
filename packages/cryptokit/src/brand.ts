declare const brand: unique symbol;

/**
 * Attach a compile-time brand `B` to a primitive `T`. Module-private symbol —
 * brands cannot collide with or be forged by structurally similar properties.
 * Purely type-level; nothing is emitted at runtime.
 */
export type Brand<T, B extends string> = T & { readonly [brand]: B };
