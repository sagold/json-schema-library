export type JSType = "array" | "bigint" | "boolean" | "function" | "null" | "number" | "object" | "string" | "symbol" | "undefined";
export default function getTypeOf(value: unknown): JSType;
