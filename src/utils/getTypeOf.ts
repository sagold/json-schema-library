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
    const type = toString
        .call(value)
        .match(/\s([^\]]+)\]/)
        .pop()
        .toLowerCase();
    if (type === "file") {
        return "object";
    }
    return type;
}
