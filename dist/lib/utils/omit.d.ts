/**
 * Omit properties from input schema. Accepts any number of properties to
 * remove. Example:
 *
 * ```ts
 * omit(myObject, "if", "dependencies");
 * ```
 *
 * @returns shallow copy of input object without specified properties
 */
export declare function omit(object: Record<string, unknown>, ...keysToOmit: string[]): Record<string, unknown>;
