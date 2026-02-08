import { getTypeOf } from "./getTypeOf";

export function isObject(v: unknown): v is Record<string, unknown> {
    return getTypeOf(v) === "object";
}
