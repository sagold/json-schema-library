const toString = Object.prototype.toString;

export type JSType =
    | "array"
    | "bigint"
    | "boolean"
    | "function"
    | "null"
    | "number"
    | "object"
    | "string"
    | "symbol"
    | "undefined";

export default function getTypeOf(value: unknown): JSType {
    // eslint-disable-next-line newline-per-chained-call
    return toString
        .call(value)
        .match(/\s([^\]]+)\]/)
        .pop()
        .toLowerCase();
}
