import { getTypeOf } from "./getTypeOf.js";
export function isObject(v) {
    return getTypeOf(v) === "object";
}
