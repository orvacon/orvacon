declare const brand: unique symbol;

/**
 * Attach a compile-time brand `B` to a primitive `T`.
 *
 * The brand key is a module-private `unique symbol`, so brands can never
 * collide with (or be forged by) a structurally similar `__brand` property
 * elsewhere. Purely type-level — nothing is emitted at runtime.
 */
export type Brand<T, B extends string> = T & { readonly [brand]: B };
