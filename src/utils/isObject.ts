import { getTypeOf } from "./getTypeOf.js";

export function isObject(v: any): v is Record<string, unknown> {
    return getTypeOf(v) === "object";
}
