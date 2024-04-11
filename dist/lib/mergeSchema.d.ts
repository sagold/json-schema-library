import { JsonSchema } from "./types";
export declare function mergeSchema<T extends JsonSchema>(a: T, b: T, ...omit: string[]): T;
export declare function mergeSchema2(a: unknown, b: unknown, property?: string): unknown;
